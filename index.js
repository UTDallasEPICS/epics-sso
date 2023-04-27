"use strict";

const fs = require('fs');
const SamlStrategy = require('@node-saml/passport-saml').Strategy;
var util = require('util');
// const fs = require('fs');
// const { SamlConfig } = require('@node-saml/passport-saml');

// const spOptions = {
//   entity_id: 'toolcribsso.surge.sh/metadata.xml',
//   assert_endpoint: 'https://idptest.utdallas.edu/idp/profile/SAML2/Redirect/SSO',
//   description: 'Service Provider Metadata',
// //   name_id_format: 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
// //   authn_context: ['urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport'],
// //   private_key: fs.readFileSync('./sp-key.pem', 'utf-8'),
// //   certificate: fs.readFileSync('./sp-cert.pem', 'utf-8')
// };

// const samlConfig = new SamlConfig(spOptions);
// const metadata = samlConfig.generateServiceProviderMetadata();

// console.log(metadata);

var samIdPCert = 'MIIDEjCCAfqgAwIBAgIVAMECQ1tjghafm5OxWDh9hwZfxthWMA0GCSqGSIb3DQEB\n'+
'CwUAMBYxFDASBgNVBAMMC3NhbWx0ZXN0LmlkMB4XDTE4MDgyNDIxMTQwOVoXDTM4\n' +
'MDgyNDIxMTQwOVowFjEUMBIGA1UEAwwLc2FtbHRlc3QuaWQwggEiMA0GCSqGSIb3\n' +
'DQEBAQUAA4IBDwAwggEKAoIBAQC0Z4QX1NFKs71ufbQwoQoW7qkNAJRIANGA4iM0\n' +
'ThYghul3pC+FwrGv37aTxWXfA1UG9njKbbDreiDAZKngCgyjxj0uJ4lArgkr4AOE\n' +
'jj5zXA81uGHARfUBctvQcsZpBIxDOvUUImAl+3NqLgMGF2fktxMG7kX3GEVNc1kl\n' +
'bN3dfYsaw5dUrw25DheL9np7G/+28GwHPvLb4aptOiONbCaVvh9UMHEA9F7c0zfF\n' +
'/cL5fOpdVa54wTI0u12CsFKt78h6lEGG5jUs/qX9clZncJM7EFkN3imPPy+0HC8n\n' +
'spXiH/MZW8o2cqWRkrw3MzBZW3Ojk5nQj40V6NUbjb7kfejzAgMBAAGjVzBVMB0G\n' +
'A1UdDgQWBBQT6Y9J3Tw/hOGc8PNV7JEE4k2ZNTA0BgNVHREELTArggtzYW1sdGVz\n' +
'dC5pZIYcaHR0cHM6Ly9zYW1sdGVzdC5pZC9zYW1sL2lkcDANBgkqhkiG9w0BAQsF\n' +
'AAOCAQEASk3guKfTkVhEaIVvxEPNR2w3vWt3fwmwJCccW98XXLWgNbu3YaMb2RSn\n' +
'7Th4p3h+mfyk2don6au7Uyzc1Jd39RNv80TG5iQoxfCgphy1FYmmdaSfO8wvDtHT\n' +
'TNiLArAxOYtzfYbzb5QrNNH/gQEN8RJaEf/g/1GTw9x/103dSMK0RXtl+fRs2nbl\n' + 
'D1JJKSQ3AdhxK/weP3aUPtLxVVJ9wMOQOfcy02l+hHMb6uAjsPOpOVKqi3M8XmcU\n' +
'ZOpx4swtgGdeoSpeRyrtMvRwdcciNBp9UZome44qZAYH1iqrpmmjsfI9pJItsgWu\n' +
'3kXPjhSfj1AJGR1l9JGvJrHki1iHTA=='

var samIdPEntryPoint = 'https://samltest.id/saml/idp'

var utdIdPCert = 'MIIDOzCCAiOgAwIBAgIUSwQBiQU7l2qsaU0XGxhXS1s0MgQwDQYJKoZIhvcNAQEL BQAwHzEdMBsGA1UEAwwUaWRwdGVzdC51dGRhbGxhcy5lZHUwHhcNMTgwNTE4MjA0 NjQ4WhcNMzgwNTE4MjA0NjQ4WjAfMR0wGwYDVQQDDBRpZHB0ZXN0LnV0ZGFsbGFz LmVkdTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMBjXWrG12/hfyxk 5l11ol45zMH2Lcunliex1UEiEgBR+i4vdebomf6rBc8M6aNUeO2SOybkmq0y4vej zRxZaeFq8gPAJuoK65BPQXxnUV3WVIdpzysB2DocLH5Zc2HhXIfezqmrYNMqEr23 DxbwAxqN5wzStHC71lVgGDf8gCxd/rXEAH4zO//kLMBBvx1o29E4vq1QCtdXgWp5 EbR2MYWGIJxQDoQsC0g++s46NyPrK/eSS4rnALsvga+FnqnSPvkxvbZiqVOOWANI DElLWvQf2bpkXfQHr4M3vS5xDPHqi3rf1Q8utV8DB17OxEcayUJ0WgPUGy9X1crt 2xKhfY0CAwEAAaNvMG0wHQYDVR0OBBYEFPee3rOrxiG+B6MYhLLQXEitQwt7MEwG A1UdEQRFMEOCFGlkcHRlc3QudXRkYWxsYXMuZWR1hitodHRwczovL2lkcHRlc3Qu dXRkYWxsYXMuZWR1L2lkcC9zaGliYm9sZXRoMA0GCSqGSIb3DQEBCwUAA4IBAQAC ZJMjP11ZuGeL6mAsUEthdxS1rvF2zkz5Z3pYVXx/L7zWPxrnBpabQr/0Kvv2cQ6y TAPerZmjWgj1vO9NXqpT3YlhO2ppN18suSW1gVteUizwxcxlqxTxAJuIPUQ16bZV U6r6ADW8qp1YCLqB/3cL2g2L4IX57HZ3qf5OKW1xrkvOjmk0HdDE3ljmjgrbWgwA MBxYkSc2v22K54iOV4TQe76nu4GEIqHzy6qx0SzCcY8C6XxIMC5/Ei1kEqG8Kc5n g5YLcRVlHNcSXgV4OZjzwFbWe0iTBowJGoEaDi3PNJYnpak0BE3D4LBMiPpwfPCI jKqHLsU+tGzjCoNN9hmu';
var utdIdPEntryPoint = 'https://idptest.utdallas.edu/idp/profile/SAML2/Redirect/SSO';
var strattName = 'utdsaml';

let profileAttrs = {
//for utd
// 'urn:mace:dir:attribute-def':'givenName',
// 'urn:mace:dir:attribute-def':'sn',
// 'urn:mace:dir:attribute-def':'mail'

//for SAMLtest testing
'urn:oasis:names:tc:SAML:2.0:attrname-format:uri' : 'givenName',
'urn:oasis:names:tc:SAML:2.0:attrname-format:uri' : 'sn',
'urn:oasis:names:tc:SAML:2.0:attrname-format:uri' :'mail'
};

function verifyProfile(profile, done) {
  if (!profile) {
      return done(new Error('Empty SAML profile returned!'));
  }
  return done(null, convertProfileToUser(profile));
}

function convertProfileToUser(profile) {
  let user = {};
  let niceName;
  let idx;
  let keys = Object.keys(profile);
  let key;

  for (idx = 0; idx < keys.length; ++idx) {
      key = keys[idx];
      niceName = profileAttrs[key];
      if (niceName) {
          user[niceName] = profile[key];
      }
  }

  return user;
}
/**
 * Passport Strategy for UIC Shibboleth Authentication
 *
 * This class extends passport-saml.Strategy, providing the necessary options for the UIC Shibboleth IdP
 * and converting the returned profile into a user object with sensible property names.
 *
 * @param {Object} options - Configuration options
 * @param {string} options.entityId - Your server's entity id (often same as domain name)
 * @param {string} options.domain - Your server's domain name
 * @param {string} options.callbackUrl - Relative URL for the login callback (we will add https:// and domain)
 * @param {string} options.privateKey - Optional private key for signing SAML requests
 * @constructor
 */
module.exports.Strategy = function (options) {
  options = options || {};
  options.entryPoint = options.entryPoint || samIdPEntryPoint/*utdIdPEntryPoint*/;
  options.cert = options.cert || samIdPCert /*utdIdPCert*/;
  options.identifierFormat = null;
  options.issuer = options.issuer || options.entityId || options.domain;
  options.callbackUrl = options.callbackUrl;
  options.decryptionPvk = options.privateKey;
  options.privateCert = options.privateKey;

  let strat = new saml.Strategy(options, verifyProfile);
  this._verify = verifyProfile;
  this._saml = strat._saml;
  this._passReqToCallback = strat._passReqToCallback;
  this.name = strattName;
};

util.inherits(module.exports.Strategy, saml.Strategy);

/**
 * Returns a route implementation for the standard Shibboleth metadata route.
 * common usage:
 *  var uwshib = reuqire('passport-uwshib');
 *  var myPublicCert = //...read public cert PEM file
 *  var strategy = new uwshib.Strategy({...});
 *  app.get(uwshib.urls.metadata, uwshib.metadataRoute(strategy, myPublicCert));
 *
 * @param strategy - The new Strategy object from this module
 * @param publicCert - Your server's public certificate (typically loaded from a PEM file)
 * @returns {Function} - Route implementation suitable for handing to app.get()
 */
module.exports.metadataRoute = function(strategy, publicCert) {
  return function(req, res) {
      res.type('application/xml');
      res.status(200).send(strategy.generateServiceProviderMetadata(publicCert));
  };
}; //metadataRoute

// const samlStrategy = new SamlStrategy({
//   issuer: 'https://sso1.uppwardapp.io',
//   callbackUrl: 'http://sso1.uppwardapp.io',
//   entryPoint: 'https://samltest.id/saml/idp',
//   cert: '/security/cert.pem',
//   privateCert: '/security/privateCert.pem',
//   //decryptionPvk: '/decryption.key',
// }, (profile, done) => {
//   // Handle the authenticated user profile here
// });

// // Generate the SP metadata
// const spMetadata = samlStrategy.generateServiceProviderMetadata();

// // Save the metadata to a file
// fs.writeFileSync('sp__metadata.xml', spMetadata);

// //http://industrious-beef.surge.sh/sp_metadata.xml