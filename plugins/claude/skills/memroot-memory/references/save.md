# Building a memory_create request

One memory per call, in your own words, readable without this conversation. Save only what outlives the current task.

Use this template for every kind. Keep `"assertion_type": "descriptive"` with `"predicate": "has_property"`: a decision or a rule is still `descriptive` here (`normative` goes only with `requires`, `forbids` and `recommends`). Change only `memory.kind`, `memory.title`, `memory.summary`, the `statement`, the literal `value` and `qualifier`, the evidence `kind` and `summary`, and the two ids.

`memory.kind`: `architecture_decision` (a choice that constrains future work, and why), `invariant`, `convention`, `bug`, `root_cause`, `fix`, `failed_approach`, `preference` (stated by the user for future work, not a request about this task), `code_landmark`, `ownership_boundary` or `procedure`. Any other value is refused; only `decision` is mapped to `architecture_decision`.

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
      { "ref": "p1", "origin": "direct_api", "adapter": "claude_code", "source_id": "op-8a2d5f0c9e1b4a7d" }
    ]
  }
}
```

- `project_id`: the selected project from the session context; if it is unavailable, stop. Never rely on a connection default.
- `idempotency_key`: 16 to 128 printable characters you compose; no command is needed to generate it. Keep it when retrying the same save.
- Leave `valid_time` out.
- `confidence` at most 0.8 and `importance` at most 4 with `agent_initiated` evidence.
- `qualifier`: lowercase snake_case starting with a letter; the literal `value` is a short string, at most 512 bytes.
- `evidence`: one item, empty `locator`; `agent_initiated` when you save on your own, use `user_attestation` only when the user explicitly asked to save that lesson. Summarize truthfully what the lesson rests on; don't add other evidence.
- `memory_relations`: empty, or `{ "type": "supersedes", "target_memory_id": "<older memory_id>", "evidence_refs": ["e1"] }` to replace an older memory.
- `provenance`: keep `"origin": "direct_api"`; `source_id` is a fresh opaque id per save (`op-` plus 16 hex digits), not a session, commit or file id.

Errors: `project_not_found`: tell the user and stop. After `graph_conflict`, `valid_time_in_future` or invalid input, compare with the template, fix and retry once with the same `idempotency_key`. After `idempotency_conflict`, retry with a new key. After `usage_limit_exceeded`, tell the user once and stop saving. If a retry fails, tell the user nothing was saved.
