// validate({ body, params, query }) with zod schemas. Unknown keys are stripped,
// which also blocks mass-assignment (e.g. a client sending role: "admin").
module.exports = (schemas) => (req, res, next) => {
  try {
    for (const key of ['params', 'query', 'body']) {
      if (schemas[key]) req[key] = schemas[key].parse(req[key] ?? {});
    }
    next();
  } catch (err) {
    next(err);
  }
};
