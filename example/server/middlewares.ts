import { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    authenticated?: boolean;
  }
}

export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.session && req.session.authenticated) {
    return next();
  } else {
    return res.status(200).json({
      authenticated: false,
    });
  }
}
