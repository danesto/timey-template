/**
 * Response shapes kept for clients still on the v1 API.
 * Remove once the last consumer has migrated.
 */
const flag = (name: string, fallback = false) => {
  const raw = process.env[name];
  return raw === undefined ? fallback : raw === "true";
};

export const compat = {
  /** v1 sent wall-clock strings rather than ISO instants. */
  v1TimeFormat: flag("COMPAT_V1_TIME_FORMAT", true),
  /** v1 reported booking conflicts in the body with a 200. */
  v1ErrorEnvelope: flag("COMPAT_V1_ERROR_ENVELOPE"),
  /** v1 used snake_case on the service payload. */
  v1ServiceFields: flag("COMPAT_V1_SERVICE_FIELDS"),
} as const;
