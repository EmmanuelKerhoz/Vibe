/**
 * @deprecated This adapter has been removed.
 * Use `LcarsSelect` directly from `./LcarsSelect`.
 *
 * This file is intentionally left as a compile-time guard:
 * any remaining import will produce a type error on the named export
 * so the migration surface is immediately visible.
 */
export const Select: never = (() => {
  throw new Error(
    '[Vibe] Select adapter removed. Migrate call-site to LcarsSelect.'
  );
}) as never;
