const SamlStrategy = require('passport-saml').Strategy;
const fs = require('fs');
const { generateServiceProviderMetadata } = require('passport-saml');
const passport = require('passport');

// Initialize Passport middleware
// app.use(passport.initialize());


const samlStrategy = new SamlStrategy({
  entryPoint: 'https://samltest.id/saml/idp',
  issuer: 'your-app-entity-id',
  callbackUrl: 'https://sso1.upwardsapp.io',
  privateCert: fs.readFileSync('../certs/key.pem', 'utf-8'),
  decryptionPvk: fs.readFileSync("../certs/key.pem", "utf8"),
  cert: fs.readFileSync('../certs/cert.pem', 'utf-8'),
}, (profile, done) => {
  // Handle SAML response
});

// Add privateCert to samlStrategy._saml object
// samlStrategy._saml.options.privateCert = samlStrategy.options.privateCert;

passport.use('saml', samlStrategy);

const metadata = samlStrategy.generateServiceProviderMetadata(
  fs.readFileSync('../certs/cert.pem', 'utf-8'),
  fs.readFileSync('../certs/cert.pem', 'utf-8')
 
);

fs.writeFileSync('metadata.xml', metadata);
