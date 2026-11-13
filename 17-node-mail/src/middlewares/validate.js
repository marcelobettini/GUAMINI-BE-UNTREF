// Valida req[source] con un esquema zod. El resultado limpio (ya normalizado:
// email en minúsculas, etc.) queda en req.validated[source].
// No reasignamos req.query/req.body: en Express 5 req.query es de sólo lectura.
export default (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  req.validated = { ...req.validated, [source]: result.data };
  next();
};
