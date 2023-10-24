"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backToUrl = exports.ensureAuth = exports.metadataRoute = exports.Strategy = exports.urls = void 0;
const passport_saml_1 = require("passport-saml");
const utdIdPCert = `-----BEGIN CERTIFICATE-----
MIIDOzCCAiOgAwIBAgIUSwQBiQU7l2qsaU0XGxhXS1s0MgQwDQYJKoZIhvcNAQEL
BQAwHzEdMBsGA1UEAwwUaWRwdGVzdC51dGRhbGxhcy5lZHUwHhcNMTgwNTE4MjA0
NjQ4WhcNMzgwNTE4MjA0NjQ4WjAfMR0wGwYDVQQDDBRpZHB0ZXN0LnV0ZGFsbGFz
LmVkdTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMBjXWrG12/hfyxk
5l11ol45zMH2Lcunliex1UEiEgBR+i4vdebomf6rBc8M6aNUeO2SOybkmq0y4vej
zRxZaeFq8gPAJuoK65BPQXxnUV3WVIdpzysB2DocLH5Zc2HhXIfezqmrYNMqEr23
DxbwAxqN5wzStHC71lVgGDf8gCxd/rXEAH4zO//kLMBBvx1o29E4vq1QCtdXgWp5
EbR2MYWGIJxQDoQsC0g++s46NyPrK/eSS4rnALsvga+FnqnSPvkxvbZiqVOOWANI
DElLWvQf2bpkXfQHr4M3vS5xDPHqi3rf1Q8utV8DB17OxEcayUJ0WgPUGy9X1crt
2xKhfY0CAwEAAaNvMG0wHQYDVR0OBBYEFPee3rOrxiG+B6MYhLLQXEitQwt7MEwG
A1UdEQRFMEOCFGlkcHRlc3QudXRkYWxsYXMuZWR1hitodHRwczovL2lkcHRlc3Qu
dXRkYWxsYXMuZWR1L2lkcC9zaGliYm9sZXRoMA0GCSqGSIb3DQEBCwUAA4IBAQAC
ZJMjP11ZuGeL6mAsUEthdxS1rvF2zkz5Z3pYVXx/L7zWPxrnBpabQr/0Kvv2cQ6y
TAPerZmjWgj1vO9NXqpT3YlhO2ppN18suSW1gVteUizwxcxlqxTxAJuIPUQ16bZV
U6r6ADW8qp1YCLqB/3cL2g2L4IX57HZ3qf5OKW1xrkvOjmk0HdDE3ljmjgrbWgwA
MBxYkSc2v22K54iOV4TQe76nu4GEIqHzy6qx0SzCcY8C6XxIMC5/Ei1kEqG8Kc5n
g5YLcRVlHNcSXgV4OZjzwFbWe0iTBowJGoEaDi3PNJYnpak0BE3D4LBMiPpwfPCI
jKqHLsU+tGzjCoNN9hmu
-----END CERTIFICATE-----
`;
const utdIdPEntryPoint = "https://idptest.utdallas.edu/idp/profile/SAML2/Redirect/SSO";
const strategyName = "utdsaml";
const profileAttrs = {
    // ... (same as provided)
    givenName: "urn:mace:dir:attribute-def:givenName",
    sn: "urn:mace:dir:attribute-def:surname",
    mail: "urn:mace:dir:attribute-def:mail",
};
function verifyProfile(profile, done) {
    if (!profile)
        done(new Error("Empty SAML profile returned!"));
    else
        done(null, convertProfileToUser(profile));
}
function convertProfileToUser(profile) {
    const user = {};
    const keys = Object.keys(profile);
    console.log(`convertProfileToUser - variable - profiel: ${JSON.stringify(profile)}`);
    for (const key of keys) {
        const niceName = profileAttrs[key];
        if (niceName) {
            user[niceName] = profile[key];
        }
    }
    return user;
}
exports.urls = {
    metadata: "/metadata.xml",
};
class Strategy extends passport_saml_1.Strategy {
    constructor(options) {
        options = options || {};
        options.entryPoint = options.entryPoint || utdIdPEntryPoint;
        options.cert = options.cert || utdIdPCert;
        options.identifierFormat = null;
        options.issuer = options.issuer || options.entityId || options.domain;
        options.callbackUrl = `https://${options.domain}/login/callback`;
        options.decryptionPvk = options.privateKey;
        options.privateCert = options.privateKey;
        super(options, verifyProfile);
        this.name = strategyName;
    }
}
exports.Strategy = Strategy;
function metadataRoute(strategy, publicCert) {
    return (req, res) => {
        res.type("application/xml");
        res
            .status(200)
            .send(strategy.generateServiceProviderMetadata(publicCert, publicCert));
    };
}
exports.metadataRoute = metadataRoute;
function ensureAuth(loginUrl) {
    return (req, res, next) => {
        if (req.isAuthenticated())
            return next();
        else {
            if (req.session) {
                console.log(`ensureAuth - variable - url: ${req.url}`);
                req.session.authRedirectUrl = req.url; // Type assertion here
                console.log(`ensureAth - variable - req.session: ${JSON.stringify(req.session)}`);
            }
            else {
                console.warn("passport-utdshib: No session property on request!" +
                    " Is your session store unreachable?");
            }
            console.log(`ensureAuth - variable - loginUrl: ${loginUrl}`);
            res.redirect(loginUrl);
        }
    };
}
exports.ensureAuth = ensureAuth;
function backToUrl(defaultUrl) {
    return (req, res) => {
        let url = defaultUrl || "/";
        if (req.session) {
            url = req.session.authRedirectUrl; // Type assertion here
            console.log(`backToUrl - variable - req.session: ${JSON.stringify(req.session)}`);
            delete req.session.authRedirectUrl; // Type assertion here
        }
        console.log(`backToUrl - variable - url: ${url}`);
        res.redirect(url);
    };
}
exports.backToUrl = backToUrl;