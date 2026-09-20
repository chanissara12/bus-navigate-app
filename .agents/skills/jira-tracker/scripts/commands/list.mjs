import { loadConfig, ConfigError } from '../lib/config.mjs';
import { jiraFetch } from '../lib/client.mjs';
import { parseArgs } from '../lib/args.mjs';
import { assertNoScopeConflict, buildListJql, validateStatus } from '../lib/jql.mjs';
import { normalizeIssue, normalizeIssueSummary, renderIssueList, LIST_CAP } from '../lib/format.mjs';

export async function runList(argv, cwd = process.cwd()) {
  const config = loadConfig(cwd);

  const args = parseArgs(argv, {
    project: { aliases: ['-p', '--project'], type: 'string' },
    all: { aliases: ['-a', '--all'], type: 'boolean' },
    me: { aliases: ['-me', '--me'], type: 'boolean' },
    status: { aliases: ['-s', '--status'], type: 'string' },
    sprint: { aliases: ['-sp', '--sprint'], type: 'boolean' },
  });

  assertNoScopeConflict({ all: args.all, me: args.me });

  const projectKey = args.project || config.defaultProjectKey;
  if (!projectKey) {
    throw new ConfigError(
      'ไม่ได้ระบุ -p/--project และไม่มี defaultProjectKey ใน .jira/config.local.json — ระบุ -p/--project <projectKey>'
    );
  }

  // No -a/-me at all -> behaves like -me (issues assigned to me).
  const scope = args.all ? 'all' : 'me';
  const status = args.status ? await validateStatus(config, projectKey, args.status) : null;
  const jql = buildListJql({ projectKey, scope, status, sprintOnly: args.sprint });

  // /rest/api/3/search was removed by Atlassian (HTTP 410) in favor of the
  // cursor-based /search/jql endpoint. maxResults: 100, no pagination beyond
  // the first page — fine for a personal tracker; a project with more than
  // 100 matches at once is out of scope for this tool.
  const searchResult = await jiraFetch(config, '/search/jql', {
    method: 'POST',
    body: { jql, maxResults: 100, fields: ['*all'] },
  });

  const issues = searchResult.issues;
  const over = issues.length > LIST_CAP;

  const normalized = over
    ? issues.map(normalizeIssueSummary)
    : await Promise.all(issues.map((issue) => normalizeIssue(config, cwd, issue)));

  return renderIssueList(normalized, { over, total: issues.length });
}
