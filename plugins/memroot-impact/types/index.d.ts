// State contract of the Memroot impact mod: what it counted in this session,
// held by Claude Code in `$.state` only (never stored or uploaded).

/** One memory a Memroot memory_retrieve pack returned in this session. */
export type MemrootImpactRecalled = {
  id: string;
  title: string;
  kind: string;
  /** How many packs returned it. */
  returned: number;
  /** Ordering stamp: higher is more recent (the top of the latest pack highest). */
  seen: number;
};

/** One successful Memroot memory_create in this session. */
export type MemrootImpactSaved = {
  /** The call's idempotency_key, so a retried save is counted once. */
  key: string;
  title: string;
  kind: string;
};

export type MemrootImpactTally = {
  /** Successful memory_retrieve calls, empty packs included. */
  checks: number;
  /** Of those, the ones a subagent's loop made (`tool.call` carried `agentId`). */
  subagentChecks: number;
  /** The last ordering stamp handed out. */
  order: number;
  recalled: MemrootImpactRecalled[];
  saved: MemrootImpactSaved[];
  /** Distinct memory_ids a successful memory_feedback marked `helped`. */
  helped: string[];
  /** Distinct memory_ids a successful memory_feedback marked `verified`. */
  verified: string[];
};

declare module "claude-code" {
  interface PluginState {
    "memroot-impact": {
      tally: Shaped<MemrootImpactTally>;
    };
  }
}
