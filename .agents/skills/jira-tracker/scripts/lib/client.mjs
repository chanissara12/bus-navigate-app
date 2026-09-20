export class JiraApiError extends Error {
  constructor(message, { status, detail } = {}) {
    super(message);
    this.name = 'JiraApiError';
    this.status = status;
    this.detail = detail;
  }
}

function authHeader(config) {
  const token = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
  return `Basic ${token}`;
}

function parseErrorBody(rawText) {
  if (!rawText) return '(no response body)';
  try {
    const json = JSON.parse(rawText);
    const messages = [
      ...(json.errorMessages || []),
      ...Object.entries(json.errors || {}).map(([field, msg]) => `${field}: ${msg}`),
    ];
    return messages.length > 0 ? messages.join('; ') : rawText;
  } catch {
    return rawText;
  }
}

/**
 * @param {{baseUrl: string, email: string, apiToken: string}} config
 * @param {string} path - path under /rest/api/3, e.g. "/issue/TL-1"
 */
export async function jiraFetch(config, path, { method = 'GET', body, query } = {}) {
  const url = new URL(`${config.baseUrl}/rest/api/3${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: authHeader(config),
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new JiraApiError(`เชื่อมต่อ ${config.baseUrl} ไม่ได้: ${err.message}`);
  }

  if (res.status === 204) return null;

  const text = await res.text();

  if (!res.ok) {
    throw new JiraApiError(
      `Jira API ${method} ${path} ล้มเหลว (HTTP ${res.status}): ${parseErrorBody(text)}`,
      { status: res.status, detail: text }
    );
  }

  if (!text) return null;
  return JSON.parse(text);
}
