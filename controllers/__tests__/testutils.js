import express from "express";
import formidable from "express-formidable";
import JWT from "jsonwebtoken"

/**
* 
* @param {[string, string, (req, res) => Promise<any>, any[]?][]} controllers
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
  // Enable multipart/form-data parsing so req.fields/req.files are available
  // app.use(formidable());
  
  // Fake auth middleware
  app.use((req, res, next) => {
    if (user != null) {
      req.user = user;
      const token = JWT.sign({_id: user._id}, process.env.JWT_SECRET)
      req.headers.authorization = token
    }
    if (role) req.user = { ...(req.user || {}), role };
    next();
  });
  
  for (const controller of controllers) {
    const [method, path, handler, middlewares = []] = controller;
    if (middlewares.length > 0) {
      app[method](path, ...middlewares, handler);
    } else {
      app[method](path, handler);
    }
  }
  
  
  return app;
}

/**
* For compatibility
*/
export const createExpressTestServer = createExpressTestController