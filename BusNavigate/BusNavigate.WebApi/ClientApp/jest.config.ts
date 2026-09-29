import type { Config } from "jest";

const config: Config = {
    preset: "jest-preset-angular",
    setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
    testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/dist/"],
    collectCoverageFrom: ["src/app/**/*.ts", "!src/app/**/*.module.ts", "!src/app/**/*.spec.ts"],
};

export default config;
