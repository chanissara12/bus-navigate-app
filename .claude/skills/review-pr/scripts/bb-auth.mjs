#!/usr/bin/env node
// Reads Bitbucket credentials from .review-pr/config.local.json in the current
// project and prints shell `export` lines to stdout. Intended to be consumed via
// `eval "$(node <skill>/scripts/bb-auth.mjs)"` so the secret is placed into the
// shell environment WITHOUT ever being printed to the terminal / agent transcript.
//
// Emits a single BB_AUTH holding a ready-to-use Authorization header value:
//   - a workspace/repo/project access token -> "Bearer <token>"
// All human-facing messages go to stderr; stdout carries only the export lines,
// and never the raw secret.
//
// Access tokens are the ONLY supported credential, deliberately. App passwords
// were removed by Atlassian on 2026-07-28, and while an Atlassian API token
// (email + token, sent as Basic) would also work, supporting a second path buys
// nothing here and costs clarity: when auth fails you would first have to work
// out which credential was used before you could work out why it failed.

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CONFIG_REL_PATH = '.review-pr/config.local.json';
const PLACEHOLDERS = new Set(['YOUR_ACCESS_TOKEN_HERE']);

function fail(message) {
  process.stderr.write(`bb-auth: ${message}\n`);
  process.exit(1);
}

const path = resolve(process.cwd(), CONFIG_REL_PATH);
if (!existsSync(path)) {
  fail(`ยังไม่มี ${CONFIG_REL_PATH} — สร้างจาก template ก่อน (ดู references/config.md)`);
}

let raw;
try {
  raw = JSON.parse(readFileSync(path, 'utf-8'));
} catch (err) {
  fail(`${CONFIG_REL_PATH} ไม่ใช่ JSON ที่ถูกต้อง: ${err.message}`);
}

const bb = raw.bitbucket ?? {};
const clean = (v) => (typeof v === 'string' && v.trim() && !PLACEHOLDERS.has(v.trim()) ? v.trim() : null);

const token = clean(bb.token);

// A config left over from the app-password era gets the migration path, not a
// generic "not configured" that sends you looking in the wrong place.
if (!token && (clean(bb.username) || clean(bb.appPassword))) {
  fail(
    `${CONFIG_REL_PATH} ยังใช้ app password ซึ่ง Bitbucket ปิดไปแล้วเมื่อ 2026-07-28 — ` +
      `สร้าง access token แล้วใส่ใน "token" จากนั้นลบ "username"/"appPassword" ทิ้ง`
  );
}

if (!token) {
  fail(`${CONFIG_REL_PATH} ยังไม่ได้กรอก "bitbucket.token" (access token)`);
}

const authValue = `Bearer ${token}`;

// POSIX-safe single-quote escaping: close, insert an escaped quote, reopen.
const shSingleQuote = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

process.stdout.write(`export BB_AUTH=${shSingleQuote(authValue)}\n`);
