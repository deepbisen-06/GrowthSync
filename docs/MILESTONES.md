# Milestone map

This map is inferred from source files and their comments. Confirm deliverables
against your mentor's actual rubric; no rubric was included in the ZIP.

| Stage | Code present | Remaining evidence/work |
| --- | --- | --- |
| Milestone 1: collection | Auth, profiles, finance/study/habit entry, expense tracking, activity, CSV export | Run API tests on disposable PostgreSQL; capture working screens; review export permissions |
| Milestone 2: analytics | Preprocessing, engineered features, regression forecasts, rule-based productivity and risk scores, simulator | Validate chronological evaluation, minimum history and year-boundary cases; distinguish rules from learned models |
| Proposed next stage: external-data experiment | CSV validation/preparation script added in this cleanup | Download verified real data; define a compatible academic target; train, compare and document an offline model |
| Proposed later stage: integration | No external trained model loading added | Add model artifact/version handling, matching input schema and inference endpoint only after evaluation |

Do not delete analytics or simulator code just because the old README said
Milestone 1. Those modules are connected to routes and screens.

## Review checklist for each milestone

1. Record the objective and input/output contracts.
2. Implement only the agreed deliverable, keeping earlier functionality working.
3. Capture actual tests, screenshots and metrics; never invent accuracy values.
4. Update this file with the result and unresolved limitations.
5. Commit in the existing repository, then tag the reviewed milestone if desired.

Copy this cleaned source into a backup of your existing checkout to retain its
Git history. The delivered source ZIP deliberately has no embedded Git database.
