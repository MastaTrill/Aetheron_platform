import crypto from 'node:crypto';

const MIN_OPERATOR_KEY_LENGTH = 32;

function configuredOperatorKey() {
  return (process.env.AETHERON_OPERATOR_API_KEY || '').trim();
}

function secureEqual(left, right) {
  const leftDigest = crypto.createHash('sha256').update(left).digest();
  const rightDigest = crypto.createHash('sha256').update(right).digest();
  return crypto.timingSafeEqual(leftDigest, rightDigest);
}

export function requireOperator(req, res, next) {
  const expected = configuredOperatorKey();
  if (expected.length < MIN_OPERATOR_KEY_LENGTH) {
    return res.status(503).json({
      error: 'Operator authentication is not configured.',
      code: 'OPERATOR_AUTH_NOT_CONFIGURED',
    });
  }

  const authorization = req.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Operator authentication required.',
      code: 'OPERATOR_AUTH_REQUIRED',
    });
  }

  const provided = authorization.slice('Bearer '.length).trim();
  if (!provided || !secureEqual(provided, expected)) {
    return res.status(401).json({
      error: 'Invalid operator credentials.',
      code: 'OPERATOR_AUTH_INVALID',
    });
  }

  return next();
}

export function requireSignerEnabled(req, res, next) {
  if (process.env.AETHERON_SIGNER_ROUTES_ENABLED !== 'true') {
    return res.status(503).json({
      error: 'Server-side signing routes are disabled.',
      code: 'SIGNER_ROUTES_DISABLED',
    });
  }

  return next();
}
