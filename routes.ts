import { Router, Request, Response } from "express";
import passport from "passport";
import { isAuthenticated } from "./middlewares";
import { strategy } from "./authentication";
import { urls, backToUrl, ensureAuth, metadataRoute } from "utdshib";
import { publicCert } from "./config";

const router = Router();

router.get("/login", passport.authenticate(strategy.name), backToUrl());
router.post(
  "/login/callback",
  passport.authenticate(strategy.name),
  (req: Request, res: Response) => {
    // Your login callback implementation
    if (req.isAuthenticated()) {
      req.session.authenticated = true;
      if (req.body.RelayState) return res.redirect(req.body.RelayState);
      else return res.redirect("/");
    } else {
      return res.status(401).send("Authentication Failed.");
    }
  }
);
router.get(urls.metadata, metadataRoute(strategy, publicCert));
router.get("/check-auth", isAuthenticated, (req: Request, res: Response) => {
  res.status(200).json({
    authenticated: true,
  });
});

router.use(ensureAuth("/login"));

router.get("/", (req: Request, res: Response) => {
  const user: any = req.user;
  res.send(`Hello ${JSON.stringify(user)}!`);
});

export { router };
