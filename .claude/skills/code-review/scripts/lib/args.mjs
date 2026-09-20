export class ArgsError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ArgsError';
  }
}

/**
 * Minimal flag parser, same shape as jira-tracker's.
 * @param {string[]} argv - flag tokens (command name already stripped off)
 * @param {Record<string, {aliases: string[], type: 'boolean'|'string', required?: boolean}>} spec
 */
export function parseArgs(argv, spec) {
  const result = {};
  const aliasMap = {};

  for (const [name, def] of Object.entries(spec)) {
    result[name] = def.type === 'boolean' ? false : undefined;
    for (const alias of def.aliases) aliasMap[alias] = name;
  }

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    const name = aliasMap[token];
    if (!name) {
      throw new ArgsError(`ไม่รู้จัก flag: ${token}`);
    }

    const def = spec[name];
    if (def.type === 'boolean') {
      result[name] = true;
      continue;
    }

    const value = argv[i + 1];
    if (value === undefined) {
      throw new ArgsError(`flag ${token} ต้องมีค่าตามหลัง`);
    }
    result[name] = value;
    i++;
  }

  for (const [name, def] of Object.entries(spec)) {
    if (def.required && result[name] === undefined) {
      throw new ArgsError(`ต้องระบุ ${def.aliases.join('/')}`);
    }
  }

  return result;
}
