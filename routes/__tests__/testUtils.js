import express from "express";
import JWT from "jsonwebtoken";

/**
 * Gives pre-authenticated server, assuming that user already exists.
 * @param {[string, (req, res, next) => Promise<any>][]} routes
 * @param {*} options 
 * @returns app
 */
export function createExpressTestRoutes(routes, options = {}) {
  const {
    user = null,
  } = options;

  const app = express();
  app.use(express.json());

  if (user) {
    const token = JWT.sign({_id: user._id}, process.env.JWT_SECRET)
    app.use((req, res, next) => {
      req.headers.authorization = token
      next()
    })
  }

  for (const [path, route] of routes) {
    app.use(path, route);
  }


  return app;
}
