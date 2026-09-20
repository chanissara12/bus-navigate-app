import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig } from '../lib/config.mjs';
import { jiraFetch } from '../lib/client.mjs';
import { parseArgs } from '../lib/args.mjs';
import { normalizeIssue } from '../lib/format.mjs';
import { adfToMarkdown } from '../lib/adf.mjs';

function slugify(summary) {
  return summary
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/g, '');
}

export async function runPull(argv, cwd = process.cwd()) {
  const config = loadConfig(cwd);

  const args = parseArgs(argv, {
    id: { aliases: ['-id', '--id'], type: 'string', required: true },
  });

  const [rawIssue, commentsRes] = await Promise.all([
    jiraFetch(config, `/issue/${args.id}`, { query: { fields: '*all' } }),
    jiraFetch(config, `/issue/${args.id}/comment`, { query: { orderBy: 'created' } }),
  ]);

  const issue = await normalizeIssue(config, cwd, rawIssue);
  const f = rawIssue.fields;

  const subtasks = (f.subtasks || []).map(
    (s) => `- ${s.key}: ${s.fields.summary} (${s.fields.status.name})`
  );

  const links = (f.issuelinks || [])
    .map((link) => {
      const other = link.outwardIssue || link.inwardIssue;
      if (!other) return null;
      const relation = link.outwardIssue ? link.type.outward : link.type.inward;
      return `- ${relation} ${other.key}: ${other.fields.summary} (${other.fields.status.name})`;
    })
    .filter(Boolean);

  const attachments = (f.attachment || []).map((a) => `- ${a.filename}: ${a.content}`);

  const comments = (commentsRes.comments || []).map(
    (c) => `**${c.author?.displayName ?? 'Unknown'}** (${c.created}):\n${adfToMarkdown(c.body)}`
  );

  const sections = [
    `# ${issue.key}: ${issue.summary}`,
    '',
    `Status: ${issue.status}`,
    `Type: ${issue.type}`,
    `Priority: ${issue.priority}`,
    `Assignee: ${issue.assignee}`,
    `Reporter: ${f.reporter?.displayName ?? 'Unknown'}`,
    `Created: ${f.created}`,
    `Updated: ${f.updated}`,
    issue.parent ? `Parent: ${issue.parent}` : null,
    issue.sprint ? `Sprint: ${issue.sprint}` : null,
    issue.labels ? `Label: ${issue.labels}` : null,
    issue.dueDate ? `Due Date: ${issue.dueDate}` : null,
    issue.storyPoints !== null && issue.storyPoints !== undefined ? `Story Point: ${issue.storyPoints}` : null,
    `URL: ${issue.url}`,
    '',
    '## Description',
    issue.descriptionMarkdown || '(no description)',
    '',
    '## Subtasks',
    subtasks.length > 0 ? subtasks.join('\n') : '(none)',
    '',
    '## Linked Issues',
    links.length > 0 ? links.join('\n') : '(none)',
    '',
    '## Attachments',
    attachments.length > 0 ? attachments.join('\n') : '(none)',
    '',
    '## Comments',
    comments.length > 0 ? comments.join('\n\n') : '(none)',
    '',
  ].filter((line) => line !== null);

  const dir = join(cwd, '.jira', 'task');
  mkdirSync(dir, { recursive: true });
  const filename = `${issue.key}-${slugify(issue.summary)}.md`;
  writeFileSync(join(dir, filename), sections.join('\n'), 'utf-8');

  return `Pulled ${issue.key} -> .jira/task/${filename}`;
}
