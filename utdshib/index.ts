import { Request, Response, NextFunction } from "express";
import { Strategy as SAMLStrategy } from "passport-saml";
import request from "sync-request";
const url = "https://idptest.utdallas.edu/idp/shibboleth"; // Replace with your desired URL

const utdIdPEntryPoint: string =
  "https://idptest.utdallas.edu/idp/profile/SAML2/Redirect/SSO";

const strategyName: string = "utdsaml";

const profileAttrs: Record<string, string> = {
  // ... (same as provided)
  givenName: "urn:mace:dir:attribute-def:givenName",
  sn: "urn:mace:dir:attribute-def:surname",
  mail: "urn:mace:dir:attribute-def:mail",
};

// we are using sync-request instead of async request for performance
function getIdPCertificate(): string {
  const response = request("GET", url);
  const keyDescriptor = '<KeyDescriptor use="signing">';
  const certificateStart = "<ds:X509Certificate>";
  const certificateEnd = "</ds:X509Certificate>";

  if (response.statusCode === 200) {
    const responseData = response.getBody("utf8");
    const fileEndIndex = responseData.length;
    const keyDescriptorStartIndex = responseData.indexOf(keyDescriptor);
    const substring = responseData.substring(
      keyDescriptorStartIndex,
      fileEndIndex
    );
    const certificate = substring
      .substring(
        substring.indexOf(certificateStart) + certificateStart.length,
        substring.indexOf(certificateEnd)
      )
      .trim();
    const utdIdPCert: string =
      `-----BEGIN CERTIFICATE-----\n` +
      certificate +
      `\n-----END CERTIFICATE-----\n`;
    return utdIdPCert;
  } else {
    console.error("Error:", `Status Code: ${response.statusCode}`);
    return "";
  }
}

function verifyProfile(profile: any, done: any): void {
  if (!profile) done(new Error("Empty SAML profile returned!"));
  else done(null, convertProfileToUser(profile));
}

function convertProfileToUser(profile: any): any {
  const user: any = {};
  const keys: string[] = Object.keys(profile);

  console.log(
    `convertProfileToUser - variable - profiel: ${JSON.stringify(profile)}`
  );

  for (const key of keys) {
    const niceName = profileAttrs[key];
    if (niceName) {
      user[niceName] = profile[key];
    }
  }

  return user;
}

export const urls = {
  metadata: "/metadata.xml",
};

export class Strategy extends SAMLStrategy {
  constructor(options: any) {
    options = options || {};
    options.entryPoint = options.entryPoint || utdIdPEntryPoint;
    options.cert = options.cert || getIdPCertificate();
    options.identifierFormat = null;
    options.issuer = options.issuer || options.entityId || options.domain;
    options.callbackUrl = `https://${options.domain}/login/callback`;
    options.decryptionPvk = options.privateKey;
    options.privateCert = options.privateKey;

    super(options, verifyProfile);
    this.name = strategyName;
  }
}

export function metadataRoute(strategy: any, publicCert: string) {
  return (req: Request, res: Response): void => {
    res.type("application/xml");
    res
      .status(200)
      .send(strategy.generateServiceProviderMetadata(publicCert, publicCert));
  };
}

export function ensureAuth(loginUrl: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.isAuthenticated()) return next();
    else {
      if (req.session) {
        console.log(`ensureAuth - variable - url: ${req.url}`);
        (req.session as any).authRedirectUrl = req.url; // Type assertion here
        console.log(
          `ensureAth - variable - req.session: ${JSON.stringify(req.session)}`
        );
      } else {
        console.warn(
          "passport-utdshib: No session property on request!" +
            " Is your session store unreachable?"
        );
      }
      console.log(`ensureAuth - variable - loginUrl: ${loginUrl}`);
      res.redirect(loginUrl);
    }
  };
}

export function backToUrl(defaultUrl?: string) {
  return (req: Request, res: Response): void => {
    let url: string = defaultUrl || "/";
    if (req.session) {
      url = (req.session as any).authRedirectUrl; // Type assertion here
      console.log(
        `backToUrl - variable - req.session: ${JSON.stringify(req.session)}`
      );
      delete (req.session as any).authRedirectUrl; // Type assertion here
    }
    console.log(`backToUrl - variable - url: ${url}`);
    res.redirect(url);
  };
}
