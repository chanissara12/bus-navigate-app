#!/usr/bin/env python3
"""Validate a Mine RTS blueprint and emit a vanilla Java Structure NBT file."""

from __future__ import annotations

import argparse
import gzip
import glob
import json
import re
import struct
from collections import Counter
from pathlib import Path


BLOCK_STATE = re.compile(r"^(?P<name>[a-z0-9_.-]+:[a-z0-9_./-]+)(?:\[(?P<properties>[^]]+)\])?$")


def parse_state(value: str) -> tuple[str, dict[str, str]]:
    match = BLOCK_STATE.fullmatch(value)
    if not match:
        raise ValueError(f"invalid block state: {value!r}")
    properties: dict[str, str] = {}
    encoded = match.group("properties")
    if encoded:
        for item in encoded.split(","):
            if "=" not in item:
                raise ValueError(f"invalid block property in {value!r}: {item!r}")
            key, property_value = item.split("=", 1)
            if not key or not property_value or key in properties:
                raise ValueError(f"invalid block property in {value!r}: {item!r}")
            properties[key] = property_value
    return match.group("name"), properties


def validate(blueprint: dict, source: Path) -> Counter[str]:
    if blueprint.get("schema_version") != 1:
        raise ValueError(f"{source}: schema_version must be 1")
    size = blueprint.get("size")
    if not isinstance(size, list) or len(size) != 3 or any(not isinstance(v, int) or v < 1 for v in size):
        raise ValueError(f"{source}: size must contain three positive integers")
    width, height, depth = size
    palette = blueprint.get("palette")
    if not isinstance(palette, dict) or palette.get(".") != "minecraft:air":
        raise ValueError(f"{source}: palette must map '.' to minecraft:air")
    for symbol, state in palette.items():
        if not isinstance(symbol, str) or len(symbol) != 1:
            raise ValueError(f"{source}: palette symbols must be one character: {symbol!r}")
        parse_state(state)

    layers = blueprint.get("layers")
    if not isinstance(layers, list) or len(layers) != height:
        raise ValueError(f"{source}: expected {height} layers, found {len(layers) if isinstance(layers, list) else 'invalid'}")
    counts: Counter[str] = Counter()
    for y, layer in enumerate(layers):
        if not isinstance(layer, list) or len(layer) != depth:
            raise ValueError(f"{source}: layer {y} must contain {depth} rows")
        for z, row in enumerate(layer):
            if not isinstance(row, str) or len(row) != width:
                raise ValueError(f"{source}: layer {y}, row {z} must be {width} characters")
            for x, symbol in enumerate(row):
                if symbol not in palette:
                    raise ValueError(f"{source}: undeclared symbol {symbol!r} at ({x}, {y}, {z})")
                counts[symbol] += 1

    for marker in blueprint.get("markers", []):
        pos = marker.get("pos")
        if not isinstance(pos, list) or len(pos) != 3 or any(not isinstance(v, int) for v in pos):
            raise ValueError(f"{source}: marker {marker.get('id', '<unnamed>')} has invalid pos")
        if not marker.get("external") and not (0 <= pos[0] < width and 0 <= pos[1] < height and 0 <= pos[2] < depth):
            raise ValueError(f"{source}: internal marker {marker.get('id', '<unnamed>')} is outside the structure")
    return counts


def utf(value: str) -> bytes:
    encoded = value.encode("utf-8")
    return struct.pack(">H", len(encoded)) + encoded


def named(tag_type: int, name: str, payload: bytes) -> bytes:
    return bytes((tag_type,)) + utf(name) + payload


def string_tag(name: str, value: str) -> bytes:
    return named(8, name, utf(value))


def int_tag(name: str, value: int) -> bytes:
    return named(3, name, struct.pack(">i", value))


def compound_payload(children: list[bytes]) -> bytes:
    return b"".join(children) + b"\x00"


def compound_tag(name: str, children: list[bytes]) -> bytes:
    return named(10, name, compound_payload(children))


def int_list_tag(name: str, values: list[int]) -> bytes:
    return named(9, name, b"\x03" + struct.pack(">i", len(values)) + b"".join(struct.pack(">i", value) for value in values))


def compound_list_tag(name: str, compounds: list[list[bytes]]) -> bytes:
    return named(9, name, b"\x0a" + struct.pack(">i", len(compounds)) + b"".join(compound_payload(value) for value in compounds))


def encode(blueprint: dict) -> bytes:
    symbols = list(blueprint["palette"])
    states = [parse_state(blueprint["palette"][symbol]) for symbol in symbols]
    palette = []
    for block_name, properties in states:
        children = [string_tag("Name", block_name)]
        if properties:
            children.append(compound_tag("Properties", [string_tag(key, value) for key, value in properties.items()]))
        palette.append(children)

    state_indexes = {symbol: index for index, symbol in enumerate(symbols)}
    blocks = []
    for y, layer in enumerate(blueprint["layers"]):
        for z, row in enumerate(layer):
            for x, symbol in enumerate(row):
                if symbol == ".":
                    continue
                blocks.append([int_tag("state", state_indexes[symbol]), int_list_tag("pos", [x, y, z])])

    root = [
        int_tag("DataVersion", 3955),
        int_list_tag("size", blueprint["size"]),
        compound_list_tag("palette", palette),
        compound_list_tag("blocks", blocks),
        compound_list_tag("entities", []),
    ]
    return b"\x0a\x00\x00" + compound_payload(root)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("blueprints", nargs="+", type=Path)
    parser.add_argument("--output", type=Path, help="NBT output path; valid with one blueprint")
    args = parser.parse_args()
    sources = [Path(match) for pattern in args.blueprints for match in glob.glob(str(pattern))]
    if not sources:
        parser.error("no blueprints matched")
    if args.output and len(sources) != 1:
        parser.error("--output requires exactly one blueprint")

    for source in sources:
        blueprint = json.loads(source.read_text(encoding="utf-8"))
        counts = validate(blueprint, source)
        non_air = sum(count for symbol, count in counts.items() if symbol != ".")
        message = f"{source}: OK {blueprint['size'][0]}x{blueprint['size'][1]}x{blueprint['size'][2]}, {non_air} non-air blocks"
        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            with gzip.GzipFile(filename=str(args.output), mode="wb", mtime=0) as target:
                target.write(encode(blueprint))
            message += f" -> {args.output}"
        print(message)


if __name__ == "__main__":
    main()
