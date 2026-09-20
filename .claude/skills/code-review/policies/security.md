# Security

Second only to correctness. Report a vulnerability only when there is a plausible
path from untrusted input to the vulnerable sink — trace it and state it. Speculative
hardening advice with no reachable path is a `suggestion`, not `blocking`.

## Authentication and authorization

- A new endpoint, handler, route, or command with no authentication attribute or
  middleware where siblings have one. Compare against neighboring code.
- Authorization checked at the UI layer only, with the API left open.
- Missing **object-level** authorization: the caller is authenticated but the code
  never verifies the record belongs to them (IDOR). Very common in
  `GetById(id)` handlers — check for a tenant/owner predicate.
- Role or permission checks weakened, or a check moved behind an early return.
- Tenant isolation: a query in a multi-tenant system missing its tenant filter is
  `blocking` and a data-integrity issue as well.

## Injection

- SQL built by string concatenation or interpolation with any non-constant value —
  `blocking`. Parameterize.
- Raw SQL passed to an ORM escape hatch (`FromSqlRaw`, `query()`, `$queryRawUnsafe`)
  with interpolated input.
- Command injection: shell invocation assembled from request data.
- Path traversal: user-supplied filename joined into a path without normalization
  and a containment check.
- XSS: unescaped rendering (`innerHTML`, `dangerouslySetInnerHTML`,
  `bypassSecurityTrustHtml`, unescaped template output).
- Deserialization of untrusted payloads into polymorphic or arbitrary types.
- SSRF: a URL taken from input and fetched server-side without an allowlist.

## Input validation

- Trusting client-supplied values that determine authority: role, price, discount,
  status, `isAdmin`, user id.
- Mass assignment / over-posting: binding a request body straight onto an entity.
- Missing validation on required fields, ranges, lengths, or enums where repository
  convention (FluentValidation, DataAnnotations, zod, etc.) applies it elsewhere.
- Unbounded input: no page size cap, no upload size limit, no request body limit.

## Secrets and sensitive data

- Any credential, API key, connection string, private key, or token committed in
  source, config, test fixture, or a comment — `blocking`, and say it must be
  rotated, not merely deleted from the file.
- Secrets logged, put into error responses, exception messages, or telemetry.
- PII, tokens, passwords, card data, or full request bodies written to logs.
- Sensitive data returned in an API response beyond what the client needs.

## Crypto and transport

- Hand-rolled crypto, or a broken primitive (MD5, SHA-1, DES, ECB) used for a
  security purpose.
- Passwords stored with anything other than a modern password hash (bcrypt, scrypt,
  Argon2, PBKDF2 with sane parameters).
- Certificate or hostname validation disabled; HTTP where the repo uses HTTPS.
- Predictable randomness (`Math.random`, `Random`) for tokens, ids, or secrets.

## Web and dependency surface

- CORS widened to `*` or reflecting arbitrary origins, especially with credentials.
- CSRF protection removed from a state-changing endpoint.
- Cookies losing `HttpOnly`, `Secure`, or `SameSite`.
- Authorization or rate-limit middleware removed or reordered.
- A new dependency that is unmaintained, typosquat-adjacent, or duplicates something
  already in the repo — `warning`, ask for justification.

## Committed secrets are the one exception to diff-awareness

Everywhere else, a pre-existing problem outside the diff is out of scope. Committed
credentials are not: a live secret in the repository is exploitable today, and burying
it in `limitations` where nobody reads it is a worse outcome than a slightly
out-of-scope finding.

When you encounter a committed credential while reviewing — even in a file this change
never touches — report it as a finding with `category: "security"`. Set the severity to
`warning`, state plainly in the `message` that it is pre-existing and not introduced by
this change, and say it needs rotation, not just deletion. Being pre-existing, it must
**not** drive the verdict to `changes_required`; the author cannot fix someone else's
committed secret as a condition of merging their own work.

If the change *introduces* the secret, none of the above applies — that is `blocking`.

## Reporting

State the untrusted source, the sink, and the impact. Do not include a working
exploit payload; describe the vector and the fix. Never print a discovered secret's
value in the finding — cite the file and line only.
