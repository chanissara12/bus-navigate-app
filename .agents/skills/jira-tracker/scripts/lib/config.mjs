import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const CONFIG_DIR = '.jira';
const CONFIG_FILE = 'config.local.json';
const CONFIG_REL_PATH = `${CONFIG_DIR}/${CONFIG_FILE}`;

const TEMPLATE = {
  baseUrl: 'https://your-domain.atlassian.net',
  email: 'your-email@example.com',
  apiToken: 'YOUR_API_TOKEN_HERE',
  defaultProjectKey: 'TL',
};

// Only credentials are required; defaultProjectKey is optional (may legitimately
// stay as a real project key like "TL", so it is never treated as a placeholder).
const REQUIRED_KEYS = ['baseUrl', 'email', 'apiToken'];
const PLACEHOLDER_VALUES = new Set(REQUIRED_KEYS.map((key) => TEMPLATE[key]));

export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}

function ensureGitignored(cwd) {
  const gitignorePath = join(cwd, '.gitignore');
  const entry = `${CONFIG_REL_PATH}`;
  const cacheEntry = `${CONFIG_DIR}/.cache.json`;

  let existing = '';
  if (existsSync(gitignorePath)) {
    existing = readFileSync(gitignorePath, 'utf-8');
  }

  const linesToAdd = [entry, cacheEntry].filter((line) => !existing.includes(line));
  if (linesToAdd.length === 0) return;

  const prefix = existing.length > 0 && !existing.endsWith('\n') ? '\n' : '';
  appendFileSync(gitignorePath, `${prefix}${linesToAdd.join('\n')}\n`, 'utf-8');
}

/**
 * Creates .jira/config.local.json from the template if it doesn't exist yet
 * (or unconditionally with force: true). This is the only place that writes
 * the file — loadConfig() never creates it, it only reads/validates.
 */
export function initConfig(cwd = process.cwd(), { force = false } = {}) {
  const dir = join(cwd, CONFIG_DIR);
  const path = join(cwd, CONFIG_REL_PATH);

  if (existsSync(path) && !force) {
    return `${CONFIG_REL_PATH} มีอยู่แล้ว ไม่ได้เขียนทับ (ใช้ --force ถ้าต้องการรีเซ็ตเป็น template ใหม่)`;
  }

  mkdirSync(dir, { recursive: true });
  writeFileSync(path, `${JSON.stringify(TEMPLATE, null, 2)}\n`, 'utf-8');
  ensureGitignored(cwd);

  return (
    `สร้างไฟล์ config ที่ ${CONFIG_REL_PATH} แล้ว\n` +
    `กรุณากรอก baseUrl, email, apiToken ให้ครบก่อนใช้งานคำสั่งอื่น (defaultProjectKey ใส่หรือไม่ใส่ก็ได้)`
  );
}

export function loadConfig(cwd = process.cwd()) {
  const path = join(cwd, CONFIG_REL_PATH);

  if (!existsSync(path)) {
    throw new ConfigError(
      `ยังไม่มี ${CONFIG_REL_PATH} — รันคำสั่ง init ก่อน: node scripts/jira.mjs init`
    );
  }

  let raw;
  try {
    raw = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (err) {
    throw new ConfigError(`${CONFIG_REL_PATH} ไม่ใช่ JSON ที่ถูกต้อง: ${err.message}`);
  }

  const missing = REQUIRED_KEYS.filter((key) => {
    const value = raw[key];
    return !value || typeof value !== 'string' || !value.trim() || PLACEHOLDER_VALUES.has(value);
  });

  if (missing.length > 0) {
    throw new ConfigError(
      `${CONFIG_REL_PATH} ยังไม่ได้กรอกค่า: ${missing.join(', ')}\nกรุณาแก้ไขไฟล์นี้ก่อนใช้งาน`
    );
  }

  ensureGitignored(cwd);

  return {
    baseUrl: raw.baseUrl.replace(/\/+$/, ''),
    email: raw.email.trim(),
    apiToken: raw.apiToken.trim(),
    defaultProjectKey: typeof raw.defaultProjectKey === 'string' && raw.defaultProjectKey.trim()
      ? raw.defaultProjectKey.trim()
      : null,
  };
}
