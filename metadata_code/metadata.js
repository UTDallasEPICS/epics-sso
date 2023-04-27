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
  privateCert: fs.readFileSync('./security/privateCert.pem', 'utf-8'),
  cert: fs.readFileSync('./security/cert.pem', 'utf-8'),
}, (profile, done) => {
  // Handle SAML response
});

// Add privateCert to samlStrategy._saml object
// samlStrategy._saml.options.privateCert = samlStrategy.options.privateCert;

passport.use('saml', samlStrategy);

const metadata = generateServiceProviderMetadata(
  samlStrategy.privateCert,
  samlStrategy.cert,
  samlStrategy.issuer,
  samlStrategy.callbackUrl
);

fs.writeFileSync('metadata.xml', metadata);
