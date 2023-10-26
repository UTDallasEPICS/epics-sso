import http, { IncomingMessage, ServerResponse } from "http";
import https from "https";
import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import session from "express-session";
import passport from "passport";
import cookieParser from "cookie-parser";
import fs from "fs";
import dotenv from "dotenv";
import { Strategy, backToUrl, ensureAuth, metadataRoute, urls } from "utdshib";

dotenv.config();
const loginUrl = "/login";
const loginCallbackUrl = "/login/callback";

function getServerPort(server: http.Server | https.Server): number | null {
  const address = server.address();

  if (typeof address === "object" && address !== null) {
    return address.port;
  }

  return null;
}

// Check environment variable for domain
const domain: string = process.env.DOMAIN as string;
if (!domain) {
  throw new Error(
    "You must specify the domain name of this server via the DOMAIN environment variable!"
  );
}

const httpPort: number = Number(process.env.HTTPPORT) || 80;
const httpsPort: number = Number(process.env.HTTPSPORT) || 443;

const publicCert: string = fs.readFileSync("./cert.pem", "utf-8");
const privateKey: string = fs.readFileSync("./key.pem", "utf-8");

const app = express();

app.use(morgan(process.env.LOGFORMAT || "dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: "application/json" }));
app.use(cookieParser());
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
  })
);
app.use(passport.initialize());
app.use(passport.session());

const strategy = new Strategy({
  entityId: `https://${domain}`,
  privateKey: privateKey,
  callbackUrl: loginCallbackUrl,
  domain: domain,
});

passport.use(strategy);

passport.serializeUser((user: any, done: any) => {
  try {
    done(null, user);
  } catch (error) {
    console.error("Serialization Error:", error);
    done(error);
  }
});

passport.deserializeUser((user: any, done: any) => {
  try {
    done(null, user);
  } catch (error) {
    console.error("Deserialization Error:", error);
    done(error);
  }
});

declare module 'express-session' {
    interface SessionData {
    authenticated?: boolean;
    }
}

function isAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.session && req.session.authenticated) {
      return next();
    } else {
      return res.status(401).send('User is not authenticated');
    }
}

app.get(
  loginUrl,
  (req, res, next) => {
    if (req.query.redirect_url) {
      console.log(req.query.redirect_url);
      passport.use(
        new Strategy({
          entityId: `https://${domain}`,
          privateKey: privateKey,
          callbackUrl: loginCallbackUrl,
          domain: domain,
          additionalParams: { RelayState: req.query.redirect_url },
        })
      );
    }
    return next();
  },
  passport.authenticate(strategy.name, { successRedirect: "/" })
);
// app.get(loginUrl, passport.authenticate(strategy.name), backToUrl());
app.post(loginCallbackUrl,passport.authenticate(strategy.name), (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    req.session.authenticated = true;

    if (req.body.RelayState) return res.redirect(req.body.RelayState);
    else return res.redirect("/");
  } else {
    return res.status(401).send('Authentication failed');
  }
});

app.get(urls.metadata, metadataRoute(strategy, publicCert));

app.get('/check-auth', isAuthenticated, (req: Request, res: Response) => {
  res.send('The user is authenticated');
});

app.use(ensureAuth(loginUrl));

// function getCookie(tabs) {
//   let getting = browser.cookies.get({
//     url: tabs[0].url,
//     name: "connect.sid",
//   });
//   getting.then(logCookie);
// }

app.get("/", (req: Request, res: Response) => {
  const user: any = req.user;
  res.send(`Hello ${JSON.stringify(user)}!`);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack || err.message);
  res.status(500).send(`Server Error! ${err.message}`);
});

app.listen(process.env.PORT, () => {
  if (!process.env.PORT)
    console.error("You must specify the port via PORT environment variable!");

  console.log(`Server is running at http://localhost:${process.env.PORT}`);
});
