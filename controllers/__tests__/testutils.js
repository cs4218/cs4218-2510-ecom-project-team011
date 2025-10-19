import express from "express";

/**
 * 
 * @param {[string, string, (req, res) => Promise<any>][]} controllers
 * @param {*} options 
 * @returns app
 */
export function createExpressTestController(controllers, options = {}) {
  const {
    user = null,
    role = null,
  } = options;

  const app = express();
  app.use(express.json());

  // Fake auth middleware
  app.use((req, res, next) => {
    if (user) req.user = user;
    if (role) req.user = { ...(req.user || {}), role };
    next();
  });

  for (const [method, path, handler] of controllers) {
    app[method](path, handler);
  }


  return app;
}
