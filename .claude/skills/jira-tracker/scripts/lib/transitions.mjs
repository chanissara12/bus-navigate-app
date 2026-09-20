import { jiraFetch } from './client.mjs';

export class TransitionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TransitionError';
  }
}

export async function getTransitions(config, issueKey) {
  const res = await jiraFetch(config, `/issue/${issueKey}/transitions`, {
    query: { expand: 'transitions.fields' },
  });
  return res.transitions;
}

/** Case-insensitive match. Throws (listing what's actually available) rather than guessing. */
export function findTransitionByName(transitions, name) {
  const match = transitions.find((t) => t.name.toLowerCase() === name.toLowerCase());
  if (!match) {
    const available = transitions.map((t) => t.name).join(', ') || '(ไม่มี transition ที่ทำได้จากสถานะนี้)';
    throw new TransitionError(
      `ไม่พบ transition "${name}" จากสถานะปัจจุบัน\nที่ทำได้จริง: ${available}`
    );
  }
  return match;
}

/**
 * Some workflow transitions require extra fields (e.g. "resolution" moving to Done).
 * Fail loudly before calling the API instead of letting Jira 400 on us.
 */
export function checkRequiredFields(transition, providedFields = {}) {
  const missing = [];
  for (const [fieldId, field] of Object.entries(transition.fields || {})) {
    if (field.required && providedFields[fieldId] === undefined) {
      missing.push(field.name || fieldId);
    }
  }
  if (missing.length > 0) {
    throw new TransitionError(
      `transition "${transition.name}" ต้องการข้อมูลเพิ่ม: ${missing.join(', ')}\n` +
      `Jira workflow บังคับให้กรอก field เหล่านี้ตอนเปลี่ยนสถานะ ไม่สามารถย้ายให้อัตโนมัติได้`
    );
  }
}

export async function executeTransition(config, issueKey, transitionId, fields) {
  await jiraFetch(config, `/issue/${issueKey}/transitions`, {
    method: 'POST',
    body: {
      transition: { id: transitionId },
      ...(fields ? { fields } : {}),
    },
  });
}
