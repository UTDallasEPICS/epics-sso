"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backToUrl = exports.ensureAuth = exports.metadataRoute = exports.Strategy = exports.urls = void 0;
const passport_saml_1 = require("passport-saml");
const sync_request_1 = __importDefault(require("sync-request"));
const url = "https://idptest.utdallas.edu/idp/shibboleth"; // Replace with your desired URL
const utdIdPEntryPoint = "https://idptest.utdallas.edu/idp/profile/SAML2/Redirect/SSO";
const strategyName = "utdsaml";
const profileAttrs = {
    // ... (same as provided)
    givenName: "urn:mace:dir:attribute-def:givenName",
    sn: "urn:mace:dir:attribute-def:surname",
    mail: "urn:mace:dir:attribute-def:mail",
};
// we are using sync-request instead of async request for performance
function getIdPCertificate() {
    const response = (0, sync_request_1.default)("GET", url);
    const keyDescriptor = '<KeyDescriptor use="signing">';
    const certificateStart = "<ds:X509Certificate>";
    const certificateEnd = "</ds:X509Certificate>";
    if (response.statusCode === 200) {
        const responseData = response.getBody("utf8");
        const fileEndIndex = responseData.length;
        const keyDescriptorStartIndex = responseData.indexOf(keyDescriptor);
        const substring = responseData.substring(keyDescriptorStartIndex, fileEndIndex);
        const certificate = substring
            .substring(substring.indexOf(certificateStart) + certificateStart.length, substring.indexOf(certificateEnd))
            .trim();
        const utdIdPCert = `-----BEGIN CERTIFICATE-----\n` +
            certificate +
            `\n-----END CERTIFICATE-----\n`;
        return utdIdPCert;
    }
    else {
        console.error("Error:", `Status Code: ${response.statusCode}`);
        return "";
    }
}
function verifyProfile(profile, done) {
    if (!profile)
        done(new Error("Empty SAML profile returned!"));
    else
        done(null, convertProfileToUser(profile));
}
function convertProfileToUser(profile) {
    console.log(profile);
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
