/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "media",
    content: ["./src/**/*.{html,ts}"],
    theme: {
        extend: {
            // Semantic design tokens for the "Signage x Data-Dark" direction
            // (.impeccable/surfaces/frontend-src-app.md). Consumed as utilities
            // (`text-accent-600`, `dark:bg-night-900`) per frontend/CLAUDE.md's
            // "UI & Design System" rules — never the raw hex, never inline style.
            colors: {
                // Light-mode body text, borders, muted labels.
                ink: {
                    50: "#f8fafc",
                    100: "#f1f5f9",
                    200: "#e2e8f0",
                    300: "#cbd5e1",
                    400: "#94a3b8",
                    500: "#64748b",
                    600: "#475569",
                    700: "#334155",
                    800: "#1e293b",
                    900: "#0f172a",
                },
                // Dark-mode true-neutral surfaces — deliberately not `ink` above:
                // that scale carries a blue cast, and the direction contract calls
                // for an off-black ground, never a tinted one.
                night: {
                    50: "#EDEBE7",
                    100: "#A6A4A0",
                    200: "#8C8A87",
                    300: "#6E7075",
                    400: "#3A3D41",
                    500: "#2E343B",
                    600: "#262626",
                    700: "#1A1F24",
                    800: "#191D22",
                    900: "#121212",
                },
                // Brand identity — station-plate header, default route badges, nav,
                // and (site-wide) every other primary interactive control.
                accent: {
                    50: "#EBEDF9",
                    100: "#DBDFF3",
                    200: "#C3C9EC",
                    300: "#AEB8F5",
                    400: "#7A8AE8",
                    500: "#5566D6",
                    600: "#3D4EAF",
                    700: "#344090",
                    800: "#2B3578",
                    900: "#262C66",
                },
                // The "recommended / go" signal — reserved for that state alone on
                // redesigned screens, and (site-wide) every other positive/success badge.
                success: {
                    50: "#EAF7F4",
                    100: "#D3EEE8",
                    200: "#B8E4DA",
                    300: "#9FD6CE",
                    400: "#4FB3A9",
                    500: "#2FA391",
                    600: "#178F79",
                    700: "#116054",
                    800: "#164A42",
                    900: "#123330",
                    950: "#0E1F1D",
                },
                // Alerts, misboarding, cancelled service — never reused elsewhere.
                danger: {
                    50: "#FBEDEC",
                    100: "#F6DDDA",
                    200: "#F0C4BB",
                    300: "#E7B0A7",
                    400: "#E2A29B",
                    500: "#C77A6D",
                    600: "#9C4A3F",
                    700: "#7A342A",
                    800: "#5A3D38",
                    900: "#2E1A17",
                },
                // Delayed-service badges; also stands in for the map's "current
                // position" marker (kept identical in both themes by design).
                warning: {
                    50: "#FEF9EC",
                    100: "#FCEFCB",
                    200: "#F8DFA0",
                    300: "#F0C465",
                    400: "#E6B04E",
                    500: "#D9A441",
                    600: "#B8842A",
                    700: "#8F6420",
                    800: "#6B4B18",
                    900: "#4A3410",
                },
            },
        },
    },
    plugins: [],
}

