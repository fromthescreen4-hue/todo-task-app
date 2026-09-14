/**
 * Simple In-Memory Rate Limiter Middleware for Auth Routes
 * Prevents brute force login & registration abuse.
 */

const requestCounts = new Map();

// Clean up old IP entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now - data.resetTime > 0) {
      requestCounts.delete(ip);
    }
  }
}, 10 * 60 * 1000);

export function authRateLimiter(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
  const maxRequests = options.max || 30; // max requests per window per IP

  return function (req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    let record = requestCounts.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      requestCounts.set(ip, record);
      return next();
    }

    record.count++;
    if (record.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        error: `Too many authentication attempts. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.`
      });
    }

    next();
  };
}
