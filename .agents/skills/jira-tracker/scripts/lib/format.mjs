import { resolveParentDisplay, resolveSprintDisplay, resolveStoryPoints } from './fields.mjs';
import { adfToMarkdown } from './adf.mjs';

export const LIST_CAP = 30;

/** Full field set — used for view/create/move and list results at or under the cap. */
export async function normalizeIssue(config, cwd, rawIssue) {
  const f = rawIssue.fields;
  const [parent, sprint, storyPoints] = await Promise.all([
    resolveParentDisplay(config, cwd, f),
    resolveSprintDisplay(config, cwd, f),
    resolveStoryPoints(config, cwd, f),
  ]);

  return {
    key: rawIssue.key,
    summary: f.summary,
    status: f.status?.name ?? '',
    type: f.issuetype?.name ?? '',
    priority: f.priority?.name ?? '',
    assignee: f.assignee?.displayName ?? 'Unassigned',
    parent,
    sprint,
    labels: f.labels && f.labels.length > 0 ? f.labels.join(', ') : null,
    dueDate: f.duedate ?? null,
    storyPoints,
    url: `${config.baseUrl}/browse/${rawIssue.key}`,
    hasAttachment: Array.isArray(f.attachment) && f.attachment.length > 0,
    descriptionMarkdown: f.description ? adfToMarkdown(f.description) : '',
  };
}

/** Minimal field set — used only for the >LIST_CAP summary table, to avoid N extra API calls. */
export function normalizeIssueSummary(rawIssue) {
  const f = rawIssue.fields;
  return {
    key: rawIssue.key,
    summary: f.summary,
    status: f.status?.name ?? '',
    assignee: f.assignee?.displayName ?? 'Unassigned',
  };
}

export function renderIssueBlock(issue) {
  const lines = [
    '| Task | Status |',
    '| --- | --- |',
    `| ${issue.key}: ${issue.summary} | ${issue.status} |`,
    '',
    `Type: ${issue.type}`,
    `Priority: ${issue.priority}`,
    `Assignee: ${issue.assignee}`,
  ];

  if (issue.parent) lines.push(`Parent: ${issue.parent}`);
  if (issue.sprint) lines.push(`Sprint: ${issue.sprint}`);
  if (issue.labels) lines.push(`Label: ${issue.labels}`);
  if (issue.dueDate) lines.push(`Due Date: ${issue.dueDate}`);
  if (issue.storyPoints !== null && issue.storyPoints !== undefined) {
    lines.push(`Story Point: ${issue.storyPoints}`);
  }

  lines.push(`URL: ${issue.url}`);
  if (issue.hasAttachment) lines.push('Attachment: (click URL to see attachment)');
  lines.push(`Description: ${issue.descriptionMarkdown || '(no description)'}`);

  return lines.join('\n');
}

function renderSummaryTable(issues, total) {
  const header =
    `พบ ${total} issue (เกิน ${LIST_CAP} ตัว) — แสดงแบบสรุปเท่านั้น ` +
    `กรองเพิ่มด้วย -s/-me/--sprint เพื่อดูรายละเอียดเต็ม\n`;
  const rows = [
    '| Task | Status | Assignee |',
    '| --- | --- | --- |',
    ...issues.map((issue) => `| ${issue.key}: ${issue.summary} | ${issue.status} | ${issue.assignee} |`),
  ];
  return header + rows.join('\n');
}

/**
 * Renders a list of already-normalized issues. Pass full `normalizeIssue` results
 * when issues.length <= LIST_CAP, or `normalizeIssueSummary` results above the cap.
 */
export function renderIssueList(issues, { over = false, total } = {}) {
  if (issues.length === 0) return '(ไม่พบ issue ที่ตรงเงื่อนไข)';
  if (over) return renderSummaryTable(issues, total ?? issues.length);
  return issues.map(renderIssueBlock).join('\n\n---\n\n');
}
