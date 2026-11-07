# Building a memory_create request

One memory per call, in your own words, readable without this conversation. Keep `"assertion_type": "descriptive"` with `"predicate": "has_property"` for every kind, also a decision or a rule (`normative` goes only with `requires`, `forbids` and `recommends`). Change only `memory.kind`, `memory.title`, `memory.summary`, the `statement`, the literal `value` and `qualifier`, the evidence `kind` and `summary`, and the `idempotency_key`, new for each save.

`memory.kind`: `architecture_decision` (a choice that constrains future work, and why), `invariant`, `convention`, `bug`, `root_cause`, `fix`, `failed_approach`, `preference` (stated by the user for future work), `code_landmark`, `ownership_boundary` or `procedure`.

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
        "evidence_refs": ["e1"]
      }
    ],
    "assertion_relations": [],
    "memory_relations": [],
    "evidence": [
      { "ref": "e1", "kind": "agent_initiated", "locator_version": 1, "locator": {}, "summary": "Found while fixing the failing deploy; the smoke check passed once migrations ran first." }
    ]
  }
}
```

- `project_id`: the selected project; if it is unavailable, stop.
- `idempotency_key`: 16 to 128 printable characters you compose; keep it when retrying the same save. Leave `valid_time` and `provenance` out.
- `qualifier`: lowercase snake_case starting with a letter; the literal `value` is a short string, at most 512 bytes.
- `evidence`: one item, `locator` `{}` (name files in the summary or statement); use `user_attestation` only when the user explicitly asked to save that lesson. Summarize truthfully what the lesson rests on: what you saw, ran or read, or what the user said and why; not that they asked to save it.
- `memory_relations`: empty, or `{ "type": "supersedes", "target_memory_id": "<older memory_id>", "evidence_refs": ["e1"] }` to replace an older memory.

Errors: `project_not_found`: tell the user and stop. After `graph_conflict`, `valid_time_in_future` or invalid input, fix and retry once with the same `idempotency_key`. After `idempotency_conflict`, retry with a new key. After `usage_limit_exceeded`, tell the user once and stop saving. If a retry fails, tell the user nothing was saved.
