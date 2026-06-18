export function validateBody(validate) {
  return (req, res, next) => {
    try {
      const result = validate(req.body || {});
      if (result?.error) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: result.error } });
      if (result?.value) req.body = result.value;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function validateParams(validate) {
  return (req, res, next) => {
    try {
      const result = validate(req.params || {});
      if (result?.error) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: result.error } });
      if (result?.value) req.params = result.value;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function validateQuery(validate) {
  return (req, res, next) => {
    try {
      const result = validate(req.query || {});
      if (result?.error) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: result.error } });
      if (result?.value) req.query = result.value;
      next();
    } catch (err) {
      next(err);
    }
  };
}
