import { strings } from '../../../code-review/scripts/lib/i18n.mjs';
import { groupBySeverity } from '../../../code-review/scripts/lib/verdict.mjs';
import {
  assertNoHtml,
  escapeBareTags,
  renderFinding,
  renderScopeLine,
} from '../../../code-review/scripts/lib/render.mjs';
import { buildMarker } from './state.mjs';
import { fingerprint } from './compare.mjs';

// Findings are `####` headings, so the resolved/unresolved split folds into the
// `###` line rather than nesting another level under it.
function severityBlock(heading, findings, lang, split) {
  if (!findings.length) return [];

  if (!split) {
    const out = [`### ${heading}`, ''];
    findings.forEach((finding, index) => out.push(renderFinding(finding, index, lang), ''));
    return out;
  }

  const t = strings(lang);
  const out = [];
  const groups = [
    [t.sections.stillUnresolved, findings.filter((f) => f.__group === 'stillUnresolved')],
    [t.sections.newlyIntroduced, findings.filter((f) => f.__group !== 'stillUnresolved')],
  ];

  for (const [label, group] of groups) {
    if (!group.length) continue;
    out.push(`### ${heading} · ${label}`, '');
    group.forEach((finding, index) => out.push(renderFinding(finding, index, lang), ''));
  }
  return out;
}

/**
 * Render the review result as a provider comment.
 *
 * Presentation only. Nothing here may lengthen, reword or re-severity what
 * `code-review` produced — the finding bodies come straight from its renderer.
 */
export function renderComment(result, options) {
  const {
    lang = 'en',
    reviewVersion = 1,
    headSha,
    baseBranch,
    previousSha = null,
    fullRerunReason = null,
    comparison = null,
    dismissed = [],
    provider = 'github',
  } = options;

  const t = strings(lang);
  const title =
    reviewVersion > 1 ? `${t.commentTitle} ${t.updateSuffix(reviewVersion)}` : t.commentTitle;
  const out = [`## ${title}`, ''];

  out.push(`**${t.labels.status}:** ${t.commentStatus[result.verdict]}  `);
  out.push(`**${t.labels.reviewedCommit}:** \`${headSha}\`  `);
  if (previousSha) out.push(`**${t.labels.previouslyReviewed}:** \`${previousSha}\`  `);
  if (baseBranch) out.push(`**${t.labels.base}:** \`${baseBranch}\`  `);
  const scopeLine = renderScopeLine(result.scope, lang);
  if (scopeLine) out.push(`**${t.labels.scope}:** ${scopeLine}  `);
  out.push('');

  if (fullRerunReason) out.push(`_${t.fullRerunNote(fullRerunReason)}_`, '');
  if (comparison?.resolved?.length) {
    out.push(`_${t.resolvedNote(comparison.resolved.map((f) => f.id))}_`, '');
  }

  const findings = comparison
    ? [
        ...comparison.stillUnresolved.map((f) => ({ ...f, __group: 'stillUnresolved' })),
        ...comparison.newlyIntroduced.map((f) => ({ ...f, __group: 'newlyIntroduced' })),
      ]
    : (result.findings ?? []);

  const groups = groupBySeverity(findings);
  const split = Boolean(comparison);
  out.push(...severityBlock(t.sections.blocking, groups.blocking, lang, split));
  out.push(...severityBlock(t.sections.warning, groups.warning, lang, split));
  out.push(...severityBlock(t.sections.suggestion, groups.suggestion, lang, split));

  const checks = result.checks ?? [];
  if (checks.length) {
    out.push(`### ${t.sections.commentChecks}`, '');
    for (const check of checks) {
      const detail = check.details ? ` — ${escapeBareTags(check.details)}` : '';
      out.push(`- \`${check.name}\` — ${t.checkStatus[check.status]}${detail}`);
    }
    out.push('');
  }

  const limitations = result.limitations ?? [];
  if (limitations.length) {
    out.push(`### ${t.sections.limitations}`, '');
    for (const limitation of limitations) out.push(`- ${escapeBareTags(limitation)}`);
    out.push('');
  }

  out.push('---', '', t.disclaimer, '');

  // Checked before the marker is appended: the GitHub/GitLab marker is an HTML
  // comment on purpose, and it is the only HTML allowed anywhere in the output.
  assertNoHtml(out.join('\n'), 'renderComment');

  out.push(
    buildMarker(
      {
        reviewedHeadSha: headSha,
        reviewVersion,
        findings: (result.findings ?? []).map((f) => ({
          fp: fingerprint(f),
          id: f.id,
          sev: f.severity,
        })),
        dismissed: dismissed.map((d) => ({ fp: d.fp ?? fingerprint(d), why: d.why })),
      },
      provider
    )
  );

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}
