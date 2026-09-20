import { loadConfig, ConfigError } from '../lib/config.mjs';
import { jiraFetch } from '../lib/client.mjs';
import { parseArgs } from '../lib/args.mjs';
import { markdownToAdf } from '../lib/adf.mjs';
import { normalizeIssue, renderIssueBlock } from '../lib/format.mjs';

export async function runCreate(argv, cwd = process.cwd()) {
  const config = loadConfig(cwd);

  const args = parseArgs(argv, {
    project: { aliases: ['-p', '--project'], type: 'string' },
    topic: { aliases: ['-t', '--topic'], type: 'string', required: true },
    description: { aliases: ['-d', '--desc', '--description'], type: 'string' },
    type: { aliases: ['-it', '--type'], type: 'string' },
  });

  const projectKey = args.project || config.defaultProjectKey;
  if (!projectKey) {
    throw new ConfigError(
      'ไม่ได้ระบุ -p/--project และไม่มี defaultProjectKey ใน .jira/config.local.json — ระบุ -p/--project <projectKey>'
    );
  }

  // Status is never set here — Jira doesn't allow it on create; the project's
  // workflow default (typically "To Do"/"Not Started") applies automatically.
  const body = {
    fields: {
      project: { key: projectKey },
      summary: args.topic,
      issuetype: { name: args.type || 'Task' },
      ...(args.description ? { description: markdownToAdf(args.description) } : {}),
    },
  };

  const created = await jiraFetch(config, '/issue', { method: 'POST', body });
  const rawIssue = await jiraFetch(config, `/issue/${created.key}`, { query: { fields: '*all' } });
  const issue = await normalizeIssue(config, cwd, rawIssue);
  return renderIssueBlock(issue);
}
