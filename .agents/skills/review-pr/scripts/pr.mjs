#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { ArgsError, parseArgs } from '../../code-review/scripts/lib/args.mjs';
import { LANGS } from '../../code-review/scripts/lib/i18n.mjs';
import { deriveVerdict } from '../../code-review/scripts/lib/verdict.mjs';
import { StateError, decideMode, parseMarker } from './lib/state.mjs';
import { ContradictionError, compareRounds } from './lib/compare.mjs';
import { renderComment } from './lib/comment.mjs';
import { RenderError } from '../../code-review/scripts/lib/render.mjs';

const SPEC = {
  input: { aliases: ['--input', '-i'], type: 'string' },
  previous: { aliases: ['--previous'], type: 'string' },
  comment: { aliases: ['--comment'], type: 'string' },
  head: { aliases: ['--head'], type: 'string' },
  base: { aliases: ['--base'], type: 'string' },
  lang: { aliases: ['--lang', '-l'], type: 'string' },
  provider: { aliases: ['--provider', '-p'], type: 'string' },
};

const PROVIDERS = ['github', 'gitlab', 'bitbucket'];

function resolveProvider(args) {
  const provider = args.provider ?? 'github';
  if (!PROVIDERS.includes(provider)) {
    throw new ArgsError(`provider "${provider}" ไม่รองรับ (${PROVIDERS.join('/')})`);
  }
  return provider;
}

function readJson(path, label) {
  if (!path) throw new ArgsError(`ต้องระบุ ${label}`);
  const raw = readText(path, label);
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new ArgsError(`ไฟล์ ${path} ไม่ใช่ JSON ที่ถูกต้อง: ${err.message}`);
  }
}

function readText(path, label) {
  if (!path) throw new ArgsError(`ต้องระบุ ${label}`);
  try {
    return readFileSync(path, 'utf8');
  } catch (err) {
    throw new ArgsError(`อ่าน ${path} ไม่ได้: ${err.message}`);
  }
}

function readPrevious(args) {
  if (args.previous) return readJson(args.previous, '--previous');
  if (args.comment) return parseMarker(readText(args.comment, '--comment'));
  return null;
}

function resolveLang(args, result) {
  const lang = args.lang ?? result?.reportLanguage ?? 'en';
  if (!LANGS.includes(lang)) throw new ArgsError(`ภาษา "${lang}" ไม่รองรับ (${LANGS.join('/')})`);

  // The finding prose is already written in the result's language; only the
  // headings and status line follow --lang. Letting the two differ produces a
  // comment in two languages, so refuse instead of rendering it.
  if (args.lang && result?.reportLanguage && args.lang !== result.reportLanguage) {
    throw new ArgsError(
      `--lang ${args.lang} ขัดกับ reportLanguage "${result.reportLanguage}" ในผลรีวิว — ` +
        `finding เขียนเป็นภาษา ${result.reportLanguage} ไว้แล้ว ต้องให้ code-review รีวิวใหม่ถ้าจะเปลี่ยนภาษา`
    );
  }
  return lang;
}

/** Decide full vs incremental, and state the reason when it must be full. */
function runState(argv) {
  const args = parseArgs(argv, SPEC);
  if (!args.head) throw new ArgsError('ต้องระบุ --head <sha>');

  const previous = readPrevious(args);
  const decision = decideMode({
    previousSha: previous?.reviewedHeadSha ?? null,
    headSha: args.head,
    lang: resolveLang(args, null),
  });

  return JSON.stringify(
    {
      ...decision,
      reviewVersion: (previous?.reviewVersion ?? 0) + 1,
      previousFindings: previous?.findings ?? [],
      previousDismissed: previous?.dismissed ?? [],
    },
    null,
    2
  );
}

/** Compare against the previous round; fails loudly on a silent reversal. */
function runCompare(argv) {
  const args = parseArgs(argv, SPEC);
  const result = readJson(args.input, '--input');
  const previous = readPrevious(args);
  const comparison = compareRounds(previous, result.findings ?? [], resolveLang(args, result));
  return JSON.stringify(comparison, null, 2);
}

function runComment(argv) {
  const args = parseArgs(argv, SPEC);
  const result = readJson(args.input, '--input');
  const lang = resolveLang(args, result);
  if (!args.head) throw new ArgsError('ต้องระบุ --head <sha>');

  // The verdict is derived here too, not trusted from the file. This layer
  // renders the status line, so a stale or hand-edited verdict would otherwise
  // reach the PR contradicting the findings printed directly beneath it.
  const derived = deriveVerdict(result);
  if (result.verdict && result.verdict !== derived) {
    throw new ArgsError(
      `verdict "${result.verdict}" ใน ${args.input} ขัดกับ findings — ค่าที่ถูกต้องคือ "${derived}"`
    );
  }
  result.verdict = derived;

  const previous = readPrevious(args);
  const decision = decideMode({
    previousSha: previous?.reviewedHeadSha ?? null,
    headSha: args.head,
    lang,
  });

  const comparison =
    decision.mode === 'incremental'
      ? compareRounds(previous, result.findings ?? [], lang)
      : null;

  return renderComment(result, {
    lang,
    reviewVersion: (previous?.reviewVersion ?? 0) + 1,
    headSha: args.head,
    baseBranch: args.base,
    previousSha: decision.previousSha,
    fullRerunReason: decision.mode === 'full' && previous ? decision.reason : null,
    comparison,
    dismissed: result.dismissed ?? [],
    provider: resolveProvider(args),
  });
}

const COMMANDS = {
  state: runState,
  compare: runCompare,
  comment: runComment,
};

const KNOWN_ERRORS = [ArgsError, StateError, ContradictionError, RenderError];

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
