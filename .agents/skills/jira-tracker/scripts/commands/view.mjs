import { loadConfig } from '../lib/config.mjs';
import { jiraFetch } from '../lib/client.mjs';
import { parseArgs } from '../lib/args.mjs';
import { normalizeIssue, renderIssueBlock } from '../lib/format.mjs';

export async function runView(argv, cwd = process.cwd()) {
  const config = loadConfig(cwd);

  const args = parseArgs(argv, {
    id: { aliases: ['-id', '--id'], type: 'string', required: true },
  });

  const rawIssue = await jiraFetch(config, `/issue/${args.id}`, { query: { fields: '*all' } });
  const issue = await normalizeIssue(config, cwd, rawIssue);
  return renderIssueBlock(issue);
}
