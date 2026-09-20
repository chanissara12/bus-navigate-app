#!/usr/bin/env python3
"""Render an isometric SVG preview of a Mine Structure Design blueprint or massing sketch.

Pure stdlib, no dependencies (mirrors blueprint_to_nbt.py) — so a design can be
eyeballed before spending the effort of a full LOD4 NBT export, or even before any
block-level detail exists.

Two input shapes are accepted, auto-detected by key:

- A voxel blueprint (has "layers") — the LOD3/4 schema shared with
  blueprint_to_nbt.py. Colors are guessed from each palette entry's block name; pass
  --colors (or a "colors" map inside the blueprint) to override.
- A massing sketch (has "boxes") — a coarse LOD1/2 concept preview, before any
  per-block palette or layout exists. See templates/concept-spec.md for the schema.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from blueprint_to_nbt import parse_state, validate  # noqa: E402


TILE_WIDTH = 32.0
TILE_HEIGHT = TILE_WIDTH / 2.0
VOXEL_HEIGHT = TILE_HEIGHT
MARGIN = 24.0

_COLOR_PREFIXES = {
    "white": (233, 236, 236), "orange": (240, 118, 19), "magenta": (199, 78, 189),
    "light_blue": (58, 175, 217), "yellow": (248, 198, 39), "lime": (112, 185, 25),
    "pink": (237, 141, 172), "light_gray": (142, 142, 134), "cyan": (21, 137, 145),
    "purple": (121, 42, 172), "blue": (53, 57, 157), "brown": (114, 71, 40),
    "green": (84, 109, 27), "red": (160, 39, 34), "black": (20, 21, 25),
    "gray": (62, 68, 71),
}

_WOOD_PREFIXES = {
    "oak": (172, 133, 86), "spruce": (114, 84, 48), "birch": (196, 179, 123),
    "dark_oak": (65, 43, 23), "acacia": (169, 88, 54), "jungle": (169, 126, 86),
    "crimson": (109, 52, 66), "warped": (48, 101, 97), "cherry": (227, 171, 192),
    "mangrove": (117, 54, 48), "bamboo": (197, 168, 80),
}

# Checked in order, first substring match wins — longer/more specific first.
_KEYWORDS: list[tuple[str, tuple[int, int, int]]] = [
    ("grass_block", (95, 159, 53)), ("dirt", (134, 96, 67)),
    ("mossy_cobblestone", (103, 118, 86)), ("mossy_stone_brick", (108, 118, 101)),
    ("cobblestone", (127, 127, 127)), ("stone_brick", (122, 122, 122)),
    ("deepslate", (70, 70, 74)), ("blackstone", (42, 36, 40)),
    ("andesite", (136, 136, 136)), ("diorite", (188, 188, 186)),
    ("granite", (149, 103, 86)), ("sandstone", (219, 203, 154)),
    ("sand", (219, 207, 163)), ("quartz", (235, 229, 222)),
    ("nether_brick", (44, 22, 27)), ("netherrack", (99, 46, 46)),
    ("basalt", (78, 78, 84)), ("obsidian", (20, 18, 29)),
    ("dark_prismarine", (51, 90, 79)), ("prismarine", (99, 156, 151)),
    ("brick", (150, 97, 83)), ("packed_mud", (139, 110, 83)),
    ("mud_bricks", (139, 110, 83)), ("mud", (66, 53, 44)), ("clay", (159, 164, 177)),
    ("moss", (89, 124, 44)), ("leaves", (60, 110, 50)),
    ("hay_block", (196, 166, 46)), ("bone_block", (219, 214, 196)),
    ("end_stone", (219, 222, 157)), ("purpur", (169, 123, 169)),
    ("amethyst", (139, 105, 201)), ("crying_obsidian", (48, 17, 68)),
    ("tuff", (108, 109, 101)), ("calcite", (222, 223, 213)),
    ("oxidized_copper", (82, 127, 109)), ("weathered_copper", (109, 146, 116)),
    ("exposed_copper", (154, 144, 120)), ("copper", (195, 120, 83)),
    ("iron_block", (216, 216, 208)), ("gold_block", (247, 213, 74)),
    ("diamond_block", (100, 220, 214)), ("emerald_block", (58, 181, 99)),
    ("lapis_block", (39, 66, 152)), ("glowstone", (196, 149, 92)),
    ("glass", (200, 230, 230)), ("planks", (172, 133, 86)),
    ("log", (114, 84, 48)), ("wood", (114, 84, 48)),
    ("cobweb", (220, 220, 220)), ("vine", (72, 100, 46)),
]

_TINTED_FAMILIES = (
    "concrete_powder", "concrete", "stained_glass", "terracotta",
    "glazed_terracotta", "wool", "carpet",
)


def guess_color(block_name: str) -> tuple[int, int, int]:
    name = block_name.split(":", 1)[-1]
    if any(family in name for family in _TINTED_FAMILIES):
        for prefix, rgb in _COLOR_PREFIXES.items():
            if name.startswith(prefix):
                return rgb
    if "planks" in name or "log" in name or "wood" in name:
        for prefix, rgb in _WOOD_PREFIXES.items():
            if name.startswith(prefix):
                return rgb
    for keyword, rgb in _KEYWORDS:
        if keyword in name:
            return rgb
    return (150, 150, 150)


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return (int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16))


def shade(rgb: tuple[int, int, int], factor: float) -> tuple[int, int, int]:
    return tuple(max(0, min(255, int(channel * factor))) for channel in rgb)  # type: ignore[return-value]


def to_hex(rgb: tuple[int, int, int]) -> str:
    return "#%02x%02x%02x" % rgb


def project(x: float, z: float, y: float) -> tuple[float, float]:
    sx = (x - z) * (TILE_WIDTH / 2.0)
    sy = (x + z) * (TILE_HEIGHT / 2.0) - y * VOXEL_HEIGHT
    return sx, sy


def polygon_points(corners: list[tuple[float, float]]) -> str:
    return " ".join(f"{sx:.2f},{sy:.2f}" for sx, sy in corners)


def cuboid_faces(x: float, y: float, z: float, w: float, h: float, d: float,
                  rgb: tuple[int, int, int]) -> tuple[list[str], list[tuple[float, float]]]:
    """Isometric top/right/left faces for one axis-aligned box, always drawn (no
    per-face occlusion culling — used for coarse massing sketches with few boxes)."""
    faces = []
    points: list[tuple[float, float]] = []

    top = [project(x, z, y + h), project(x + w, z, y + h),
           project(x + w, z + d, y + h), project(x, z + d, y + h)]
    right = [project(x + w, z, y + h), project(x + w, z + d, y + h),
             project(x + w, z + d, y), project(x + w, z, y)]
    left = [project(x, z + d, y + h), project(x + w, z + d, y + h),
            project(x + w, z + d, y), project(x, z + d, y)]

    for pts, factor in ((top, 1.0), (right, 0.75), (left, 0.55)):
        points.extend(pts)
        fill = to_hex(shade(rgb, factor))
        faces.append(f'<polygon points="{polygon_points(pts)}" fill="{fill}" stroke="#000000" stroke-opacity="0.25" stroke-width="0.5"/>')

    return faces, points


def compose_svg(face_svgs: list[str], all_points: list[tuple[float, float]],
                 legend_entries: list[tuple[str, str]]) -> str:
    if not all_points:
        all_points = [(0.0, 0.0)]

    min_x = min(p[0] for p in all_points) - MARGIN
    max_x = max(p[0] for p in all_points) + MARGIN
    min_y = min(p[1] for p in all_points) - MARGIN
    max_y = max(p[1] for p in all_points) + MARGIN
    width = max_x - min_x
    height = max_y - min_y

    legend_lines = []
    legend_y = max_y
    for row, (color_hex, label) in enumerate(legend_entries):
        ly = max_y + 18 + row * 16
        legend_lines.append(
            f'<rect x="{min_x + 4:.2f}" y="{ly - 10:.2f}" width="12" height="12" fill="{color_hex}" stroke="#000" stroke-width="0.5"/>'
            f'<text x="{min_x + 22:.2f}" y="{ly:.2f}" font-family="monospace" font-size="11" fill="#222">{label}</text>'
        )
        legend_y = ly

    legend_extra_height = (18 + (len(legend_lines) + 1) * 16) if legend_lines else 0
    view_height = height + legend_extra_height

    svg = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{min_x:.2f} {min_y:.2f} {width:.2f} {view_height:.2f}" '
        f'width="{width:.0f}" height="{view_height:.0f}">',
        f'<rect x="{min_x:.2f}" y="{min_y:.2f}" width="{width:.2f}" height="{view_height:.2f}" fill="#eef1f5"/>',
        *face_svgs,
        *legend_lines,
        "</svg>",
    ]
    return "\n".join(svg)


DEFAULT_BOX_COLORS = [
    "#c98a5e", "#6f9dc9", "#8fbf6f", "#c9a75e", "#a888c9",
    "#c96e6e", "#6ec9b8", "#c9c96e", "#8f8fc9", "#c98fb0",
]


def render_massing(sketch: dict) -> str:
    boxes = sketch.get("boxes", [])
    face_svgs: list[str] = []
    all_points: list[tuple[float, float]] = []
    legend_entries: list[tuple[str, str]] = []

    ordered = sorted(enumerate(boxes), key=lambda item: sum(item[1]["pos"]))
    for index, box in ordered:
        x, y, z = box["pos"]
        w, h, d = box["size"]
        color_hex = box.get("color") or DEFAULT_BOX_COLORS[index % len(DEFAULT_BOX_COLORS)]
        rgb = hex_to_rgb(color_hex)
        faces, points = cuboid_faces(x, y, z, w, h, d, rgb)
        face_svgs.extend(faces)
        all_points.extend(points)
        label = box.get("label", f"box {index}")
        legend_entries.append((to_hex(rgb), f"{label} ({w}x{h}x{d})"))

    return compose_svg(face_svgs, all_points, legend_entries)


def render(blueprint: dict, colors_override: dict[str, str]) -> str:
    palette = blueprint["palette"]
    layers = blueprint["layers"]

    resolved_colors: dict[str, tuple[int, int, int]] = {}
    for symbol, state in palette.items():
        if symbol == ".":
            continue
        if symbol in colors_override:
            resolved_colors[symbol] = hex_to_rgb(colors_override[symbol])
        else:
            block_name, _ = parse_state(state)
            resolved_colors[symbol] = guess_color(block_name)

    occupied: dict[tuple[int, int, int], str] = {}
    for y, layer in enumerate(layers):
        for z, row in enumerate(layer):
            for x, symbol in enumerate(row):
                if symbol != ".":
                    occupied[(x, y, z)] = symbol

    ordered = sorted(occupied.items(), key=lambda item: sum(item[0]))

    face_svgs: list[str] = []
    all_points: list[tuple[float, float]] = []

    for (x, y, z), symbol in ordered:
        rgb = resolved_colors[symbol]
        top_visible = (x, y + 1, z) not in occupied
        right_visible = (x + 1, y, z) not in occupied
        left_visible = (x, y, z + 1) not in occupied

        if top_visible:
            pts = [project(x, z, y + 1), project(x + 1, z, y + 1),
                   project(x + 1, z + 1, y + 1), project(x, z + 1, y + 1)]
            all_points.extend(pts)
            fill = to_hex(shade(rgb, 1.0))
            face_svgs.append(f'<polygon points="{polygon_points(pts)}" fill="{fill}" stroke="#000000" stroke-opacity="0.25" stroke-width="0.5"/>')
        if right_visible:
            pts = [project(x + 1, z, y + 1), project(x + 1, z + 1, y + 1),
                   project(x + 1, z + 1, y), project(x + 1, z, y)]
            all_points.extend(pts)
            fill = to_hex(shade(rgb, 0.75))
            face_svgs.append(f'<polygon points="{polygon_points(pts)}" fill="{fill}" stroke="#000000" stroke-opacity="0.25" stroke-width="0.5"/>')
        if left_visible:
            pts = [project(x, z + 1, y + 1), project(x + 1, z + 1, y + 1),
                   project(x + 1, z + 1, y), project(x, z + 1, y)]
            all_points.extend(pts)
            fill = to_hex(shade(rgb, 0.55))
            face_svgs.append(f'<polygon points="{polygon_points(pts)}" fill="{fill}" stroke="#000000" stroke-opacity="0.25" stroke-width="0.5"/>')

    legend_entries = [
        (to_hex(resolved_colors[symbol]), f"{symbol} = {parse_state(state)[0]}")
        for symbol, state in sorted(palette.items())
        if symbol != "."
    ]
    return compose_svg(face_svgs, all_points, legend_entries)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="blueprint JSON (has 'layers') or massing sketch JSON (has 'boxes')")
    parser.add_argument("--output", type=Path, help="SVG output path (default: input path with .svg extension)")
    parser.add_argument("--colors", type=Path, help="voxel blueprints only: JSON file mapping palette symbol -> '#rrggbb', overriding guessed colors")
    args = parser.parse_args()

    data = json.loads(args.input.read_text(encoding="utf-8"))

    if "boxes" in data:
        svg = render_massing(data)
    else:
        validate(data, args.input)
        colors_override: dict[str, str] = dict(data.get("colors", {}))
        if args.colors:
            colors_override.update(json.loads(args.colors.read_text(encoding="utf-8")))
        svg = render(data, colors_override)

    output = args.output or args.input.with_suffix(".svg")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(svg, encoding="utf-8")
    print(f"{args.input}: preview -> {output}")


if __name__ == "__main__":
    main()
