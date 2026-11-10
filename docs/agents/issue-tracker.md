# GitHub issue tracker

Issues, specs, and tickets live in GitHub Issues for `tinkerologie/ha-wattpilot`.
Follow the issue governance in `AGENTS.md`.

- Publish through the repository's GitHub issue form. Use
  `01-bug-report.yml` for bugs and `02-enhancement-request.yml` for
  enhancements. Complete the required fields and keep the form's title prefix.
- Fetch a ticket with `gh issue view <number> --json number,title,body,labels,comments`.
- Use `gh issue list` to find issues and `gh issue edit`, `gh issue comment`,
  or `gh issue close` to update them. Use the label mapping in `triage-labels.md`.
- Link tickets to parent issues with `gh issue edit <parent> --add-sub-issue <child>`.
  Use GitHub issue dependencies to record blockers.

**PRs as a request surface: no.**

## Wayfinding

Use a parent issue labeled `wayfinder:map` and link tickets as sub-issues.
Use `wayfinder:<type>` for child tickets. Pick the first open, unassigned
child with no open blockers in map order. Assign it to yourself to claim it.
Record the outcome on the child issue, close it, and link the decision
from the map.
