const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 500 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many requests from this IP, please try again later.',
    });
  },
});

const conditionalLimiter = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  return limiter(req, res, next);
};

module.exports = conditionalLimiter;
