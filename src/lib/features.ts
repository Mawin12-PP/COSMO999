// Feature switches. Live Session is still in development: all its code stays in
// the project, but nothing is shown or loaded unless it is switched on with
// NEXT_PUBLIC_ENABLE_LIVE_SESSION=true (e.g. in .env.local).
export const ENABLE_LIVE_SESSION =
  process.env.NEXT_PUBLIC_ENABLE_LIVE_SESSION === "true";
