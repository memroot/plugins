# Building a memory_create request

Save one Memroot memory per call, a few sentences at most, in your own words. Write the summary so it makes sense to a future reader without this conversation.

Use the template below for every kind of memory. Keep `"assertion_type": "descriptive"` with `"predicate": "has_property"` whatever the `memory.kind` is; the server requires that pair to match, and it does not follow the kind. Only `memory.kind`, `memory.title`, `memory.summary`, the assertion `statement`, the literal `value` and `qualifier`, the evidence `kind` and `summary`, and the two ids change. Other predicates (`requires`, `prefers`, `avoids`, `located_in`, ...) have entity role rules that are easy to get wrong, and some clients show only "Invalid or sensitive tool input" without the failing field, so stay with this form.

## Choosing `memory.kind`

| What the lesson is | kind |
|---|---|
| A design or technology choice and why | `architecture_decision` |
| Something that must always hold ("never call X without Y") | `invariant` |
| How the project does things (naming, layout, patterns) | `convention` |
| A known defect or gotcha that is still present | `bug` |
| Why a failure happens | `root_cause` |
| What resolved a failure | `fix` |
| Something that was tried and didn't work | `failed_approach` |
| A preference of the user (tools, style) | `preference` |
| Where something important lives in the code | `code_landmark` |
| Who owns or maintains a component | `ownership_boundary` |
| Steps to do a recurring task (release, migration) | `procedure` |

Use exactly one of these eleven values; any other is refused as `memory.kind` `invalid_value` (the server maps only `decision` to `architecture_decision`, and reports that in `adjusted`).

## Template

Example for a root cause found while fixing a failing deploy (migrations ran after wrangler deploy):

```json
{
  "project_id": "<selected project UUID>",
  "idempotency_key": "mr-20261002-deploy-order-7f3a9c2e",
  "memory_request": {
    "schema_version": 2,
    "memory": {
      "kind": "root_cause",
      "title": "Deploy smoke check fails because migrations run after deploy",
      "summary": "scripts/deploy.sh runs wrangler deploy before pnpm db:migrate, so new code briefly sees the old schema. Run migrations first."
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
        "confidence": 0.8,
        "importance": 4,
        "git_applicability": { "rule": "all_commits" },
        "evidence_refs": ["e1"],
        "provenance_refs": ["p1"]
      }
    ],
    "assertion_relations": [],
    "memory_relations": [],
    "evidence": [
      { "ref": "e1", "kind": "agent_initiated", "locator_version": 1, "locator": {}, "summary": "Found while fixing the failing deploy; the smoke check passed once migrations ran first." }
    ],
    "provenance": [
      { "ref": "p1", "origin": "direct_api", "source_id": "op-8a2d5f0c9e1b4a7d" }
    ]
  }
}
```

Field notes:

- `project_id`: the ID of the project selected on this computer, as the session context names it. If unavailable or revoked, stop; never select another project as a fallback.
- `idempotency_key`: any unique string of 16 to 128 printable characters that you compose yourself (date, short slug, a few random characters). No command is needed to generate it or the other values. Keep the same key when you retry the same save; use a new one after `idempotency_conflict`.
- `valid_time`: leave it out in both places; the server records the current time.
- `confidence` and `importance`: keep the template's 0.8 and 4 or lower; a save with `agent_initiated` evidence is refused above them (confidence at most 0.8, importance at most 4).
- `qualifier`: lowercase snake_case, starting with a letter, such as `package_manager` or `deploy_order`. The literal `value` is a short string, at most 512 bytes.
- `evidence`: exactly one item with an empty `locator`. Use `agent_initiated` when you save on your own, which is the usual case; use `user_attestation` only when the user explicitly asked to save that lesson. Summarize truthfully what the lesson rests on: what the user said, or what the work showed, for example "Found while fixing the failing deploy; the smoke check passed once migrations ran first." Don't add other evidence.
- `memory_relations`: keep it empty, except when the new memory replaces an older one: then add `{ "type": "supersedes", "target_memory_id": "<the older memory_id>", "evidence_refs": ["e1"] }` instead of archiving the older memory.
- `provenance`: keep `"origin": "direct_api"`. `source_id` is a fresh opaque id you make up for each save (for example `op-` plus 16 hex digits); it is not a session, commit, or file id. Leave out `adapter`; it has no Grok value.

If the call fails with `project_not_found`, tell the user the selected project is unavailable and stop. After `graph_conflict`, `valid_time_in_future` or invalid input, compare your request with the template field by field, fix it and retry once with the same `idempotency_key`. After `idempotency_conflict`, retry with a new key. After `usage_limit_exceeded`, tell the user once and don't save again in this session; the limit resets later. If a retry still fails, tell the user nothing was saved.

Always include the explicit top-level `project_id` of the project selected on this computer. If no project is selected, run the exact command the session context gives. Never rely on a connection default.
