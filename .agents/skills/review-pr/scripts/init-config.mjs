#!/usr/bin/env node
// Creates .review-pr/config.local.json in the current project from a template and
// ensures it is gitignored. Run once per project before reviewing Bitbucket PRs.
// GitHub/GitLab projects do not need it (they use gh/glab auth), but it is harmless.
//
//   node <skill>/scripts/init-config.mjs [-f|--force]
//
// Without --force it never overwrites an existing config (so real credentials are
// safe). With --force it resets the file back to the placeholder template. This
// mirrors jira-tracker's init: this script is the ONLY writer of the config file;
// bb-auth.mjs only reads it.

import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const CONFIG_DIR = '.review-pr';
const CONFIG_FILE = 'config.local.json';
const CONFIG_REL_PATH = `${CONFIG_DIR}/${CONFIG_FILE}`;

const TEMPLATE = {
  defaultProvider: null,
  defaultBaseBranch: 'dev',
  reportLanguage: null,
  bitbucket: {
    token: null,
  },
};

const force = process.argv.slice(2).some((a) => a === '-f' || a === '--force');
const cwd = process.cwd();
const dir = join(cwd, CONFIG_DIR);
const path = join(cwd, CONFIG_REL_PATH);

function ensureGitignored() {
  const gitignorePath = join(cwd, '.gitignore');
  const entry = CONFIG_REL_PATH;

  let existing = '';
  if (existsSync(gitignorePath)) existing = readFileSync(gitignorePath, 'utf-8');
  if (existing.split(/\r?\n/).some((line) => line.trim() === entry)) return;

  const prefix = existing.length > 0 && !existing.endsWith('\n') ? '\n' : '';
  appendFileSync(gitignorePath, `${prefix}${entry}\n`, 'utf-8');
}

if (existsSync(path) && !force) {
  ensureGitignored();
  process.stdout.write(
    `${CONFIG_REL_PATH} มีอยู่แล้ว ไม่ได้เขียนทับ (ใช้ --force ถ้าต้องการรีเซ็ตเป็น template ใหม่)\n`
  );
  process.exit(0);
}

mkdirSync(dir, { recursive: true });
writeFileSync(path, `${JSON.stringify(TEMPLATE, null, 2)}\n`, 'utf-8');
ensureGitignored();

process.stdout.write(
  `สร้างไฟล์ config ที่ ${CONFIG_REL_PATH} แล้ว และเพิ่มลง .gitignore ให้เรียบร้อย\n` +
    `ถ้ารีวิว Bitbucket ให้กรอก "bitbucket.token" (access token) ก่อนใช้งาน\n` +
    `หมายเหตุ: app password ใช้ไม่ได้แล้วตั้งแต่ 2026-07-28\n` +
    `(GitHub/GitLab ไม่ต้องกรอก — ใช้ gh/glab auth ตามปกติ)\n`
);
