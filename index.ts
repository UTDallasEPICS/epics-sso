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
app.use(
  session({
    secret: fs.readFileSync("./session-secret.txt", "utf-8"),
    cookie: { secure: true },
    resave: false, // Add this line
    saveUninitialized: true, // Add this line
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
  done(null, user);
});

passport.deserializeUser((user: any, done: any) => {
  done(null, user);
});

app.get(loginUrl, passport.authenticate(strategy.name), backToUrl());
app.post(loginCallbackUrl, passport.authenticate(strategy.name), backToUrl());
app.get(urls.metadata, metadataRoute(strategy, publicCert));

app.use(ensureAuth(loginUrl));

app.get("/", (req: Request, res: Response) => {
  const user: any = req.user;
  res.send(`Hello ${user.displayName}!`);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack || err.message);
  res.status(500).send(`Server Error! ${err.message}`);
});

const httpsServer = https.createServer(
  {
    key: privateKey,
    cert: publicCert,
  },
  app
);

httpsServer.listen(httpsPort, () => {
  console.log(
    `Listening for HTTPS requests on port ${getServerPort(httpServer)}`
  );
});

const httpServer = http.createServer(
  (req: IncomingMessage, res: ServerResponse) => {
    const redirUrl = `https://${domain}${
      httpsPort !== 443 ? `:${httpsPort}` : ""
    }${req.url}`;
    res.writeHead(301, { Location: redirUrl });
    res.end();
  }
);

httpServer.listen(httpPort, () => {
  console.log(
    `Listening for HTTP requests on port ${getServerPort(
      httpServer
    )}, but will auto-redirect to HTTPS`
  );
});
