# PR #9 review and fixes

Reviewed `da350aab76813ba0e1fccf3fd599349af2959d08` against merge base `ba560d74070a6cc4e28cea41a93da471b3d01c64` and [issue #10](https://github.com/bonus414/software-factory-project/issues/10). Standards and spec were reviewed independently using `.agents/skills/code-review/SKILL.md`.

## Standards

1. **Private Note disclosure (hard violation, fixed).** The Instructor roster queried and returned Student Note bodies, violating `GLOSSARY.md`'s private-Note contract. Removed the query, loader data and UI completely; the roster is restored to its base implementation.
2. **Returned failure shapes (hard violation, fixed).** The Note action returned errors for invalid input and missing Lessons, violating `CODING_STANDARDS.md`'s thrown-response rule. It now throws 400/404 responses. Shared schema validation in the editor keeps an overlong draft on screen with a clear message before submission.
3. **Duplicated enrichment (judgment smell, addressed).** The Saved route repeated per-record Lesson/Module/Course lookups. The service now joins those tables in each list query and shares the reference-field definition.

## Spec

1. **Private Notes exposed to staff (P1, fixed).** Stories 19–22 and 36–37 prohibit Instructor or Platform Admin views. Both roster queries and display are removed.
2. **Write access bypass (P1, fixed).** Stories 31 and 39 require the discussion's content-access check on each action. Both new intents now call `requireContentAccess`, and verify that the Lesson belongs to the requested Course before writing.
3. **Wrong length limit (P2, fixed).** Story 18 requires 2,000 characters; the original allowed 5,000. A shared Zod schema trims and validates form input and service writes, rejecting rather than truncating.
4. **Retained Notes reachable without access (P2, fixed).** Story 34 requires loss of access after Refund. The Lesson loader withholds private data without content access. Saved filters both lists using the existing access resolver, including PPP restrictions, without deleting retained rows. Controls use that same content-access result.
5. **Editor carries text between Lessons (P2, fixed).** Stories 9–10 require the destination's Note or an empty editor. The editor is keyed by Student and Lesson identity.
6. **Missing last-edited display (P2, fixed).** Story 15 requires a visible timestamp. The Lesson editor now shows relative time with the exact timestamp available on the time element.
7. **Missing behavioral coverage (P2, fixed).** Six service tests use fresh SQLite databases built from real migrations. They cover toggling, one Note after repeated saves, creation/edit times, trimming/plain text, exact limit and rejected writes preserving saved text, clearing, private ordered lists with Lesson/Course references, and retention after actual Refund approval. Writes use a transactional toggle and an upsert; the existing unique indexes retain the database-level one-per-pair guarantee.
8. **Control placement (P2, fixed).** Stories 2 and 8 place the toggle beside the title and the editor under the video. Both now occupy those positions.

## Verification and limits

- `npm run typecheck`: passed.
- `npm run test`, run after typecheck on the final code: passed, 22 files / 504 tests.
- The length-limit test failed against the extracted original implementation before the fix, then passed.
- Reviewed Note consumers: only the owning person's Lesson and Saved routes read the new Notes service.
- No browser interaction test was run. Per issue #10, automated feature coverage uses the service seam; route access checks and UI placement/state were reviewed in code.
- Typecheck emits an existing environment warning: Node v22.19.0 is below React Router's required version (>22.22.0). The command still exits successfully. This review does not change the local Node installation.

No known unresolved code finding. Human review remains required; this work does not merge PR #9.

Initial review totals: Standards 3 findings (2 hard violations, 1 judgment smell), worst private Note disclosure; Spec 8 findings, worst private Note disclosure and action access bypass. All addressed.
