import { jiraFetch } from './client.mjs';

export class JqlError extends Error {
  constructor(message) {
    super(message);
    this.name = 'JqlError';
  }
}

export function escapeJqlString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function assertNoScopeConflict({ all, me }) {
  if (all && me) {
    throw new JqlError('ใส่ -a/--all และ -me/--me พร้อมกันไม่ได้ เลือกอย่างใดอย่างหนึ่ง');
  }
}

/**
 * Validates a user-supplied status name against the project's real statuses
 * (case-insensitive) and returns the canonical name. Throws JqlError listing
 * the valid statuses if there is no match — never guesses or silently drops it.
 */
export async function validateStatus(config, projectKey, statusName) {
  const statusesByType = await jiraFetch(config, `/project/${encodeURIComponent(projectKey)}/statuses`);
  const allStatuses = new Set();
  for (const type of statusesByType) {
    for (const s of type.statuses) allStatuses.add(s.name);
  }

  const match = [...allStatuses].find((s) => s.toLowerCase() === statusName.toLowerCase());
  if (!match) {
    throw new JqlError(
      `ไม่พบ status "${statusName}" ใน project ${projectKey}\n` +
      `status ที่มีจริง: ${[...allStatuses].sort().join(', ')}`
    );
  }
  return match;
}

/**
 * @param {{projectKey: string, scope: 'all'|'me', status?: string, sprintOnly?: boolean}} opts
 */
export function buildListJql({ projectKey, scope, status, sprintOnly }) {
  const clauses = [`project = "${escapeJqlString(projectKey)}"`];

  if (scope === 'me') {
    clauses.push('assignee = currentUser()');
  }

  if (status) {
    clauses.push(`status = "${escapeJqlString(status)}"`);
  } else {
    // No explicit status filter -> hide Done/Closed by default so "list" stays useful.
    clauses.push('statusCategory != Done');
  }

  if (sprintOnly) {
    clauses.push('sprint in openSprints()');
  }

  return `${clauses.join(' AND ')} ORDER BY priority DESC, updated DESC`;
}
