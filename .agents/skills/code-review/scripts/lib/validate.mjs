import { CAPS, LANGS } from './i18n.mjs';
import { deriveVerdict, severityRank, SEVERITIES, VERDICTS } from './verdict.mjs';

export class ValidationError extends Error {
  constructor(problems) {
    super(
      `ผลรีวิวไม่ผ่านการตรวจ ${problems.length} ข้อ:\n` +
        problems.map((p) => `  - ${p}`).join('\n')
    );
    this.name = 'ValidationError';
    this.problems = problems;
  }
}

const CATEGORIES = [
  'correctness',
  'security',
  'data_integrity',
  'breaking_change',
  'architecture',
  'error_handling',
  'concurrency',
  'testing',
  'performance',
  'maintainability',
  'style',
];

const CHECK_STATUSES = ['passed', 'failed', 'skipped', 'not_available'];
const TARGET_TYPES = ['git_diff', 'commit_range', 'working_tree', 'staged', 'files', 'path'];

/**
 * Count sentences in English prose.
 *
 * Periods inside code spans (`.editorconfig`, `FileHelper.cs`) and inside
 * version numbers (6.0.302) are not sentence boundaries — without stripping
 * them first, a single well-cited sentence reads as four.
 */
export function countSentences(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return 0;
  const flattened = trimmed.replace(/`[^`]*`/g, 'X').replace(/(\d)\.(\d)/g, '$1$2');
  const boundaries = flattened.match(/[.!?](\s|$)/g);
  return boundaries ? boundaries.length : 1;
}

function checkProse(finding, field, lang, problems) {
  const value = finding[field];
  if (value === undefined || value === null) return;

  const caps = CAPS[lang];
  const charCap = caps.chars[field];
  if (charCap && value.length > charCap) {
    problems.push(
      `${finding.id ?? '(no id)'} ${field}: ยาว ${value.length} ตัวอักษร เกินเพดาน ${charCap} ของภาษา ${lang} — ` +
        `ตัดให้สั้นลง หรือย้ายรายละเอียดการตรวจสอบไปที่ evidence`
    );
  }

  const sentenceCap = caps.sentences?.[field];
  if (sentenceCap) {
    const count = countSentences(value);
    if (count > sentenceCap) {
      problems.push(
        `${finding.id ?? '(no id)'} ${field}: ${count} ประโยค เกินเพดาน ${sentenceCap} ประโยค`
      );
    }
  }
}

const PATCH_CODE_CAP = 800;
const PATCH_MAX_HUNKS = 5;

function validatePatch(finding, label, problems) {
  const patch = finding.patch;
  if (patch === undefined || patch === null) return;

  if (!Array.isArray(patch)) {
    problems.push(`${label}: patch ต้องเป็น array`);
    return;
  }
  if (patch.length > PATCH_MAX_HUNKS) {
    problems.push(
      `${label}: patch มี ${patch.length} จุด เกิน ${PATCH_MAX_HUNKS} — ` +
        `ถ้าต้องแก้หลายที่ขนาดนั้น ให้ยกตัวอย่าง 1-2 จุดที่เป็นตัวแทน แล้วอธิบายที่เหลือใน suggestion`
    );
  }

  for (const [index, hunk] of patch.entries()) {
    const at = `${label} patch[${index}]`;
    if (!hunk.file) problems.push(`${at}: ขาด file`);
    if (!hunk.after) problems.push(`${at}: ขาด after (โค้ดที่ควรจะเป็น)`);

    for (const field of ['before', 'after']) {
      const value = hunk[field];
      if (value != null && value.length > PATCH_CODE_CAP) {
        problems.push(
          `${at} ${field}: ยาว ${value.length} ตัวอักษร เกิน ${PATCH_CODE_CAP} — ` +
            `ยกมาเฉพาะบรรทัดที่เกี่ยวข้อง ไม่ต้องยกทั้ง method`
        );
      }
    }

    if (hunk.before != null && hunk.before === hunk.after) {
      problems.push(`${at}: before กับ after เหมือนกัน — ไม่มีอะไรให้แก้`);
    }
  }
}

function validateFinding(finding, index, lang, problems) {
  const label = finding.id ?? `findings[${index}]`;

  for (const field of ['id', 'severity', 'category', 'title', 'message', 'impact', 'suggestion']) {
    if (!finding[field]) problems.push(`${label}: ขาดฟิลด์ ${field}`);
  }

  if (finding.id && !/^CR-\d{3,}$/.test(finding.id)) {
    problems.push(`${label}: id ต้องอยู่ในรูป CR-001`);
  }
  if (finding.severity && !SEVERITIES.includes(finding.severity)) {
    problems.push(`${label}: severity "${finding.severity}" ไม่ใช่ค่าที่อนุญาต (${SEVERITIES.join('/')})`);
  }
  if (finding.category && !CATEGORIES.includes(finding.category)) {
    problems.push(`${label}: category "${finding.category}" ไม่ใช่ค่าที่อนุญาต`);
  }
  if (finding.line != null && finding.file == null) {
    problems.push(`${label}: ระบุ line แต่ไม่ได้ระบุ file`);
  }
  if (finding.endLine != null && finding.line != null && finding.endLine < finding.line) {
    problems.push(`${label}: endLine น้อยกว่า line`);
  }

  // Prose only. `patch` is intentionally absent from this list: it carries code,
  // and applying a prose budget to code would truncate exactly the part that
  // makes a finding actionable.
  for (const field of ['title', 'message', 'impact', 'suggestion', 'evidence']) {
    checkProse(finding, field, lang, problems);
  }

  validatePatch(finding, label, problems);

  // The one exception to diff-awareness: a pre-existing committed secret is
  // reported, but it must never be the reason an author cannot merge.
  if (finding.preExisting && finding.severity === 'blocking') {
    problems.push(
      `${label}: finding ที่เป็น preExisting ห้ามเป็น blocking — ` +
        `คนเปิด PR แก้ของที่คนอื่น commit ไว้ก่อนไม่ได้`
    );
  }
}

/**
 * Validate a draft review result. Returns nothing; throws ValidationError with
 * every problem at once so the caller fixes them in one pass rather than
 * discovering them one at a time.
 */
export function validateDraft(draft, lang) {
  const problems = [];

  if (!LANGS.includes(lang)) {
    throw new ValidationError([`ภาษา "${lang}" ไม่รองรับ (${LANGS.join('/')})`]);
  }

  for (const field of ['summary', 'reviewTarget', 'repositoryContext', 'checks', 'findings', 'limitations']) {
    if (draft[field] === undefined) problems.push(`ขาดฟิลด์ระดับบนสุด: ${field}`);
  }

  if (draft.verdict && !VERDICTS.includes(draft.verdict)) {
    problems.push(`verdict "${draft.verdict}" ไม่ใช่ค่าที่อนุญาต (${VERDICTS.join('/')})`);
  }

  const target = draft.reviewTarget;
  if (target) {
    if (!TARGET_TYPES.includes(target.type)) {
      problems.push(`reviewTarget.type "${target.type}" ไม่ใช่ค่าที่อนุญาต`);
    }
    if (['git_diff', 'commit_range'].includes(target.type) && !(target.base && target.head)) {
      problems.push(`reviewTarget type ${target.type} ต้องมีทั้ง base และ head`);
    }
    if (target.type === 'files' && !(target.files?.length > 0)) {
      problems.push('reviewTarget type files ต้องมี files อย่างน้อย 1 รายการ');
    }
    if (target.type === 'path' && !target.path) {
      problems.push('reviewTarget type path ต้องระบุ path');
    }
  }

  for (const [index, check] of (draft.checks ?? []).entries()) {
    if (!check.name) problems.push(`checks[${index}]: ขาด name`);
    if (!CHECK_STATUSES.includes(check.status)) {
      problems.push(`checks[${index}]: status "${check.status}" ไม่ใช่ค่าที่อนุญาต (${CHECK_STATUSES.join('/')})`);
    }
    if ((check.status === 'skipped' || check.status === 'not_available') && !check.details) {
      problems.push(`checks[${index}] (${check.name}): status ${check.status} ต้องบอกเหตุผลใน details`);
    }
  }

  const findings = draft.findings ?? [];
  const seenIds = new Set();
  for (const [index, finding] of findings.entries()) {
    validateFinding(finding, index, lang, problems);
    if (finding.id) {
      if (seenIds.has(finding.id)) problems.push(`id ซ้ำ: ${finding.id}`);
      seenIds.add(finding.id);
    }
    if (index > 0) {
      const previous = findings[index - 1];
      if (severityRank(finding.severity) < severityRank(previous.severity)) {
        problems.push(
          `findings เรียงผิดลำดับที่ ${finding.id ?? index}: ต้องเรียงจากรุนแรงมากไปน้อย`
        );
      }
    }
  }

  if (draft.scope) {
    const { reviewedFileCount: reviewed, changedFileCount: changed } = draft.scope;
    if (typeof reviewed !== 'number' || typeof changed !== 'number') {
      problems.push('scope ต้องมี reviewedFileCount และ changedFileCount เป็นตัวเลข');
    } else if (reviewed > changed) {
      problems.push(`scope: reviewedFileCount (${reviewed}) มากกว่า changedFileCount (${changed})`);
    }
  }

  const derived = deriveVerdict(draft);
  if (draft.verdict && draft.verdict !== derived) {
    problems.push(
      `verdict "${draft.verdict}" ขัดกับ findings ที่มีอยู่ — ค่าที่ถูกต้องคือ "${derived}"`
    );
  }
  if (derived === 'unable_to_complete' && !(draft.limitations?.length > 0)) {
    problems.push('verdict unable_to_complete ต้องมี limitations อย่างน้อย 1 ข้อ');
  }

  if (problems.length) throw new ValidationError(problems);
}
