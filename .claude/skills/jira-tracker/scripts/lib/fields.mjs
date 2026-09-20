import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { jiraFetch } from './client.mjs';

const CACHE_PATH = '.jira/.cache.json';

// Sprint has no native REST field; Epic Link only exists on company-managed
// (classic) projects — team-managed projects use the native "parent" field
// instead. Both custom field ids vary per Jira instance, so they're detected
// once via the field metadata endpoint and cached.
function loadCache(cwd) {
  const path = join(cwd, CACHE_PATH);
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return {};
  }
}

function saveCache(cwd, cache) {
  writeFileSync(join(cwd, CACHE_PATH), `${JSON.stringify(cache, null, 2)}\n`, 'utf-8');
}

async function findFieldIdByNames(config, candidateNames) {
  const fields = await jiraFetch(config, '/field');
  for (const name of candidateNames) {
    const match = fields.find((f) => f.name?.toLowerCase() === name.toLowerCase());
    if (match) return match.id;
  }
  return null;
}

async function getCachedFieldId(config, cwd, cacheKey, candidateNames) {
  const cache = loadCache(cwd);
  if (cache[cacheKey] !== undefined) return cache[cacheKey];

  const id = await findFieldIdByNames(config, candidateNames);
  cache[cacheKey] = id; // cache null too, so a "not found" instance doesn't re-query every call
  saveCache(cwd, cache);
  return id;
}

export function getEpicLinkFieldId(config, cwd = process.cwd()) {
  return getCachedFieldId(config, cwd, 'epicLinkFieldId', ['Epic Link']);
}

export function getSprintFieldId(config, cwd = process.cwd()) {
  return getCachedFieldId(config, cwd, 'sprintFieldId', ['Sprint']);
}

// Field name differs by instance/template ("Story Points" vs "Story point estimate").
export function getStoryPointFieldId(config, cwd = process.cwd()) {
  return getCachedFieldId(config, cwd, 'storyPointFieldId', ['Story point estimate', 'Story Points']);
}

/**
 * Resolve a human-readable "KEY: Summary" string for an issue's parent,
 * whether it comes from the native `parent` field (team-managed) or the
 * Epic Link custom field (company-managed).
 */
export async function resolveParentDisplay(config, cwd, issueFields) {
  const parent = issueFields.parent;
  if (parent) {
    const summary = parent.fields?.summary;
    return summary ? `${parent.key}: ${summary}` : parent.key;
  }

  const epicLinkFieldId = await getEpicLinkFieldId(config, cwd);
  const epicKey = epicLinkFieldId ? issueFields[epicLinkFieldId] : null;
  if (!epicKey) return null;

  try {
    const epic = await jiraFetch(config, `/issue/${epicKey}`, { query: { fields: 'summary' } });
    return `${epicKey}: ${epic.fields.summary}`;
  } catch {
    return epicKey;
  }
}

/**
 * Resolve the active sprint name for an issue, if any.
 */
export async function resolveSprintDisplay(config, cwd, issueFields) {
  const sprintFieldId = await getSprintFieldId(config, cwd);
  if (!sprintFieldId) return null;

  const value = issueFields[sprintFieldId];
  if (!Array.isArray(value) || value.length === 0) return null;

  // Sprint field returns all sprints the issue has ever been in; the active/most
  // recent one is last. Each entry may be a pre-parsed object or a greenhopper string.
  const last = value[value.length - 1];
  if (typeof last === 'object' && last.name) return last.name;
  if (typeof last === 'string') {
    const match = last.match(/name=([^,\]]+)/);
    return match ? match[1] : null;
  }
  return null;
}

export async function resolveStoryPoints(config, cwd, issueFields) {
  const fieldId = await getStoryPointFieldId(config, cwd);
  if (!fieldId) return null;
  const value = issueFields[fieldId];
  return value === undefined || value === null ? null : value;
}
