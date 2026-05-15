/**
 * InsightsBarProps — intentionally empty.
 *
 * InsightsBar is now a zero-prop component: shared values are sourced
 * from focused InsightsBar action/state contexts by the controls that need them.
 *
 * Kept as a module so downstream imports of InsightsBarProps
 * remain valid (empty interface extends nothing — no breaking change
 * for any spread usage).
 */
export interface InsightsBarProps {}
