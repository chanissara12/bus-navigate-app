#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { ArgsError, parseArgs } from './lib/args.mjs';
import { ValidationError, validateDraft } from './lib/validate.mjs';
import { deriveVerdict, renumber } from './lib/verdict.mjs';
import { RenderError, renderReport } from './lib/render.mjs';
import { LANGS } from './lib/i18n.mjs';

const SPEC = {
  input: { aliases: ['--input', '-i'], type: 'string', required: true },
  lang: { aliases: ['--lang', '-l'], type: 'string' },
  json: { aliases: ['--json'], type: 'boolean' },
  renumber: { aliases: ['--renumber'], type: 'boolean' },
};

function loadDraft(path) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    throw new ArgsError(`อ่านไฟล์ไม่ได้: ${path}`);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new ArgsError(`ไฟล์ ${path} ไม่ใช่ JSON ที่ถูกต้อง: ${err.message}`);
  }
}

function resolveLang(flagValue, draft) {
  const lang = flagValue ?? draft.reportLanguage ?? 'en';
  if (!LANGS.includes(lang)) {
    throw new ArgsError(`ภาษา "${lang}" ไม่รองรับ (${LANGS.join('/')})`);
  }
  return lang;
}

/** Validate, derive the verdict, and return the completed result. */
function finalize(args) {
  const draft = loadDraft(args.input);
  const lang = resolveLang(args.lang, draft);

  if (args.renumber && Array.isArray(draft.findings)) {
    draft.findings = renumber(draft.findings);
  }

  validateDraft(draft, lang);

  return {
    ...draft,
    reportLanguage: lang,
    verdict: deriveVerdict(draft),
    reviewedAt: draft.reviewedAt ?? new Date().toISOString(),
  };
}

function runValidate(argv) {
  const args = parseArgs(argv, SPEC);
  const result = finalize(args);
  return `ผ่านการตรวจ — verdict: ${result.verdict} · findings: ${result.findings.length} · ภาษา: ${result.reportLanguage}`;
}

function runRender(argv) {
  const args = parseArgs(argv, SPEC);
  const result = finalize(args);
  const report = renderReport(result, result.reportLanguage);

  if (args.json) {
    return JSON.stringify({ ...result, report }, null, 2);
  }
  return report;
}

const COMMANDS = {
  validate: runValidate,
  render: runRender,
};

const KNOWN_ERRORS = [ArgsError, ValidationError, RenderError];

function main() {
  const [, , command, ...rest] = process.argv;
  const run = COMMANDS[command];

  if (!run) {
    console.error(
      `Unknown command: ${command ?? '(none)'}\nAvailable: ${Object.keys(COMMANDS).join(', ')}`
    );
    process.exitCode = 1;
    return;
  }

  try {
    console.log(run(rest));
  } catch (err) {
    if (KNOWN_ERRORS.some((ErrClass) => err instanceof ErrClass)) {
      console.error(err.message);
      process.exitCode = 1;
      return;
    }
    throw err;
  }
}

main();
