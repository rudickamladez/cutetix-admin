[SKILL.md](https://github.com/user-attachments/files/33225703/SKILL.md)
---
name: code-review
description: Review pull requests and code changes in the Cutetix Angular administration frontend for correctness, regressions, permissions, routing, reactive state, accessibility, and maintainability. Use when reviewing a GitHub PR, branch diff, or proposed frontend patch in rudickamladez/cutetix-admin.
---

# Cutetix frontend code review

Review the **changed code**, its callers, and only the surrounding code necessary to validate a finding. Follow the repository's `AGENTS.md` and existing conventions. Prioritize actionable bugs over stylistic preferences.

## Review workflow

1. Read the PR description, diff, and relevant changed files. Inspect route configuration, services, types, and templates only when needed to establish actual behavior.
2. Compare changes against the base branch. Identify concrete regressions introduced by this change; do not report unrelated pre-existing problems as new findings.
3. Check each suspected bug against call sites and lifecycle. Explain a reproducible scenario or precise failure path. Avoid speculative warnings without evidence.
4. Review these Cutetix-specific risk areas:
   - **Authorization:** effective global and event-local scopes; `*:edit` versus `*:read`; guards and disabled UI must not replace backend authorization. Never expose other events' data through local views.
   - **Routing:** `/events`, `/my-events`, and global Tickets paths; distinguish `:event-id` from entity `:id`; preserve context across edit, refresh, direct URL, and denied navigation.
   - **Reactive state:** Angular signals, `computed`, `effect`, `httpResource`, RxJS subscriptions; ensure injection context, cleanup, no stale state, and no competing writes to shared state.
   - **HTTP resources:** prevent duplicate requests when sharing event data; avoid race conditions; refresh only when necessary after mutations; handle missing IDs, errors, and loading states.
   - **Forms and types:** strict TypeScript, nullable data, resource values, form initialization and update paths; check API response shape and `HttpErrorResponse` narrowing.
   - **Tables and UI:** search filters only loaded rows, stable sorting of filtered results without mutation, responsive controls, keyboard access, labels and `aria-sort`.
   - **Notifications:** use existing toastr service; preserve accessible announcements; avoid visible duplicate live-region text.
5. Distinguish confirmed bugs from potential improvements. Check whether a newer commit already fixes a comment before repeating it.
6. Do not edit files, run tests/builds, install dependencies, or create commits unless explicitly asked. Do not request broad refactors for a narrow PR.

## Output format

- Start with actionable findings ordered by severity: **P1** blocking, **P2** important, **P3** minor.
- For each finding, give **file and precise line/range**, failure scenario, and the smallest practical fix.
- Only report findings grounded in the inspected code. If none are found, say **No actionable findings identified**, followed by brief residual risks or verification gaps.
- Keep the review concise. Do not repeat the PR description, praise routine changes, or generate a large generic checklist.
- Clearly state whether tests/builds were actually run; never imply validation that did not occur.
