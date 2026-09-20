#!/usr/bin/env node
import { runInit } from './commands/init.mjs';
import { runList } from './commands/list.mjs';
import { runCreate } from './commands/create.mjs';
import { runView } from './commands/view.mjs';
import { runMove } from './commands/move.mjs';
import { runPull } from './commands/pull.mjs';
import { ConfigError } from './lib/config.mjs';
import { JiraApiError } from './lib/client.mjs';
import { JqlError } from './lib/jql.mjs';
import { TransitionError } from './lib/transitions.mjs';
import { ArgsError } from './lib/args.mjs';

const COMMANDS = {
  init: runInit,
  list: runList,
  create: runCreate,
  view: runView,
  move: runMove,
  pull: runPull,
};

const KNOWN_ERRORS = [ConfigError, JiraApiError, JqlError, TransitionError, ArgsError];

async function main() {
  const [, , command, ...rest] = process.argv;
  const run = COMMANDS[command];

  if (!run) {
    console.error(
      `Unknown command: ${command ?? '(none)'}\nAvailable: ${Object.keys(COMMANDS).join(', ')}`
    );
    process.exitCode = 1;
    return;
  }

  try {
    const output = await run(rest, process.cwd());
    console.log(output);
  } catch (err) {
    if (KNOWN_ERRORS.some((ErrClass) => err instanceof ErrClass)) {
      console.error(err.message);
      process.exitCode = 1;
      return;
    }
    throw err;
  }
}

main();
