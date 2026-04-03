/**
 * InsightsBarProps — intentionally empty.
 *
 * InsightsBar is now a zero-prop component: all state is sourced
 * from InsightsBarContext via useInsightsBarContext().
 *
 * Kept as a module so downstream imports of InsightsBarProps
 * remain valid (empty interface extends nothing — no breaking change
 * for any spread usage).
 */
export interface InsightsBarProps {}
