// Express 4 doesn't catch rejected promises from async route
// handlers/middleware on its own — wrap every one that awaits the (now
// async, Turso-backed) db calls so a failure reaches the error middleware
// in index.js instead of hanging the request or crashing the process.
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
