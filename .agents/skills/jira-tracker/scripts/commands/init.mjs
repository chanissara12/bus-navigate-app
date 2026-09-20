import { parseArgs } from '../lib/args.mjs';
import { initConfig } from '../lib/config.mjs';

export async function runInit(argv, cwd = process.cwd()) {
  const args = parseArgs(argv, {
    force: { aliases: ['-f', '--force'], type: 'boolean' },
  });

  return initConfig(cwd, { force: args.force });
}
