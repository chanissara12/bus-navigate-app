export const VERDICTS = ['pass', 'pass_with_warnings', 'changes_required', 'unable_to_complete'];
export const SEVERITIES = ['blocking', 'warning', 'suggestion'];

/**
 * Derive the verdict from the findings. This is a pure function of the data —
 * the reviewer never chooses it, which is the whole point of computing it here
 * rather than asking a model to stay consistent.
 *
 * `unable_to_complete` is the one verdict that cannot be derived: it says the
 * review did not happen, which no set of findings can express. The caller
 * declares it explicitly and it is honoured as-is.
 */
export function deriveVerdict(draft) {
  if (draft.verdict === 'unable_to_complete') return 'unable_to_complete';

  const findings = draft.findings ?? [];
  if (findings.some((f) => f.severity === 'blocking')) return 'changes_required';
  if (findings.some((f) => f.severity === 'warning')) return 'pass_with_warnings';
  return 'pass';
}

const RANK = { blocking: 0, warning: 1, suggestion: 2 };

export function severityRank(severity) {
  return RANK[severity] ?? 99;
}

/** Findings grouped by severity, preserving the order within each group. */
export function groupBySeverity(findings) {
  const groups = { blocking: [], warning: [], suggestion: [] };
  for (const finding of findings) {
    if (groups[finding.severity]) groups[finding.severity].push(finding);
  }
  return groups;
}

/** Renumber findings CR-001.. in severity order, keeping relative order within a severity. */
export function renumber(findings) {
  const ordered = [...findings].sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
  return ordered.map((finding, index) => ({
    ...finding,
    id: `CR-${String(index + 1).padStart(3, '0')}`,
  }));
}
