# Building a memory_create request

Save one memory per call, a few sentences at most, in your own words. Write the summary so it makes sense to a future reader without this conversation.

Use the template below for every kind of memory. Keep `"assertion_type": "descriptive"` with `"predicate": "has_property"` whatever the `memory.kind` is; the server requires that pair to match, and it does not follow the kind. Only `memory.kind`, `memory.title`, `memory.summary`, the assertion `statement`, the literal `value` and `qualifier`, the evidence `summary`, the date, and the two ids change. Other predicates (`requires`, `prefers`, `avoids`, `located_in`, ...) have entity role rules that are easy to get wrong, and some clients show only "Invalid or sensitive tool input" without the failing field, so stay with this form.

## Choosing `memory.kind`

| What the user wants remembered | kind |
|---|---|
| A design or technology choice and why | `architecture_decision` |
| Something that must always hold ("never call X without Y") | `invariant` |
| How the team does things (naming, layout, patterns) | `convention` |
| A known defect or gotcha that is still present | `bug` |
| Why a failure happens | `root_cause` |
| What resolved a failure | `fix` |
| Something that was tried and didn't work | `failed_approach` |
| A personal or team preference (tools, style) | `preference` |
| Where something important lives in the code | `code_landmark` |
| Who owns or maintains a component | `ownership_boundary` |
| Steps to do a recurring task (release, migration) | `procedure` |

## Template

Example for "Remember that the deploy fails if migrations run after wrangler deploy":

```json
{
  "project_id": "<selected project UUID>",
  "idempotency_key": "mr-20261002-deploy-order-7f3a9c2e",
  "memory_request": {
    "schema_version": 1,
    "memory": {
      "kind": "root_cause",
      "title": "Deploy smoke check fails because migrations run after deploy",
      "summary": "scripts/deploy.sh runs wrangler deploy before pnpm db:migrate, so new code briefly sees the old schema. Run migrations first.",
      "valid_time": { "from": "2026-10-02T12:00:00Z", "to": null }
    },
    "entities": [],
    "assertions": [
      {
        "ref": "a1",
        "assertion_type": "descriptive",
        "predicate": "has_property",
        "statement": "Deploys fail intermittently because migrations run after wrangler deploy; running pnpm db:migrate first fixes it.",
        "subject": { "context_entity": "project" },
        "object": { "literal": { "type": "string", "value": "run pnpm db:migrate before wrangler deploy" }, "qualifier": "deploy_order" },
        "confidence": 0.9,
        "importance": 4,
        "valid_time": { "from": "2026-10-02T12:00:00Z", "to": null },
        "git_applicability": { "rule": "all_commits" },
        "evidence_refs": ["e1"],
        "provenance_refs": ["p1"]
      }
    ],
    "assertion_relations": [],
    "memory_relations": [],
    "evidence": [
      { "ref": "e1", "kind": "user_attestation", "locator_version": 1, "locator": {}, "summary": "User asked to remember this root cause." }
    ],
    "provenance": [
      { "ref": "p1", "origin": "direct_api", "source_id": "op-8a2d5f0c9e1b4a7d" }
    ]
  }
}
```

Field notes:

- `project_id`: include the explicit ID confirmed by project status in this session. If unavailable or revoked, stop; never select another project as a fallback.
- `idempotency_key`: any unique string of 16 to 128 printable characters that you compose yourself (date, short slug, a few random characters). No command is needed to generate it or the other values. Reuse the same key with the identical request if you retry.
- `valid_time.from` (in both places): the current UTC time, ending in `Z`.
- `qualifier`: lowercase snake_case, starting with a letter, such as `package_manager` or `deploy_order`. The literal `value` is a short string, at most 512 bytes.
- `evidence`: keep exactly one `user_attestation` item with an empty `locator`, and summarize what the user said. Don't add other evidence. If the user agreed to your offer, say so, for example "User agreed to save this root cause after the agent offered."
- `provenance.source_id`: an opaque id you make up (for example `op-` plus 16 hex digits); it is not a session, commit, or file id. Leave out `adapter`; it has no Grok value.

If the call fails with `project_not_found`, tell the user the selected project is unavailable and stop. If the call is rejected for any other reason, compare your request with the template field by field and retry once with the same `idempotency_key`. If it still fails, tell the user nothing was saved.

Always include the explicit top-level `project_id` confirmed by the session project status command. If no project is selected, ask the user to select or create one first. Never rely on a connection default.
