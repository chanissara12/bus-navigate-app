import { loadConfig } from '../lib/config.mjs';
import { jiraFetch } from '../lib/client.mjs';
import { parseArgs } from '../lib/args.mjs';
import {
  getTransitions,
  findTransitionByName,
  checkRequiredFields,
  executeTransition,
} from '../lib/transitions.mjs';
import { normalizeIssue, renderIssueBlock } from '../lib/format.mjs';

export async function runMove(argv, cwd = process.cwd()) {
  const config = loadConfig(cwd);

  const args = parseArgs(argv, {
    id: { aliases: ['-id', '--id'], type: 'string', required: true },
    transition: { aliases: ['-t', '--transition'], type: 'string', required: true },
  });

  const transitions = await getTransitions(config, args.id);
  const transition = findTransitionByName(transitions, args.transition);
  checkRequiredFields(transition);

  await executeTransition(config, args.id, transition.id);

  const rawIssue = await jiraFetch(config, `/issue/${args.id}`, { query: { fields: '*all' } });
  const issue = await normalizeIssue(config, cwd, rawIssue);
  return renderIssueBlock(issue);
}
