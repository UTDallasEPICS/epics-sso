import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { router } from "./routes";
import { sessionSecret, logFormat, serverPort } from "./config";
import { passport } from "./authentication";

const app = express();

app.use(morgan(logFormat));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: "application/json" }));
app.use(cookieParser());
app.use(cookieParser(sessionSecret));
app.use(
  session({
    secret: sessionSecret,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(router);

app.listen(serverPort, () => {
  console.log(`Server is running at http://localhost:${serverPort}`);
});
