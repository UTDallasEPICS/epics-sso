import passport from "passport";
import { Strategy } from "utdshib";
import { domain, loginCallbackUrl, privateKey } from "./config";

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

export { passport, strategy };
