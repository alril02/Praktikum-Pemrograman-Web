export function logger(req, res, next) {
  const mulai = performance.now();
  res.on("finish", () => {
    const ms = (performance.now() - mulai).toFixed(1);
    console.log(`${new Date().toISOString()}  ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms} ms)`);
  });
  next();
}
