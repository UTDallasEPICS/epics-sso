'use strict';

/*
    Example script for the passport-utdshib module

    This should be run on a server that will be or
    already has been registered with the UIC Shibboleth
    Identity Provider (IdP).
*/

const preAuthUrl = ''; // appended to beginning of authentication routes, optional, ex: '/shibboleth'
const loginUrl = '/login'; // where we will redirect if the user is not logged in
const loginCallbackUrl = 'https://sso2.upwardapp.io/'; // where shibboleth should redirect upon successful auth
const logoutUrl = '/logout'; // url endpoint that will log a user out
const userUrl = '/api/user'; // url endpoint that will return user details

let http = require('http');                     // http server
let https = require('https');                   // https server
let fs = require('fs');                         // file system
let express = require("express");               // express middleware
let morgan = require('morgan');                 // logger for express
let bodyParser = require('body-parser');        // body parsing middleware
let cookieParser = require('cookie-parser');    // cookie parsing middleware
let session = require('express-session');       // express session management
let passport = require('passport');             // authentication middleware
let utdshib = require('passport-uwshib');      // UIC Shibboleth auth strategy
let passLocal = require('passport-local');      // Passport local auth strategy

///////////////////////////////////////////////////////////////////////////////
// load files and read environment variables
//

// get server's domain name from environment variable
// this is necessary as the passport-saml library requires
// this when we create the Strategy
let domain = process.env.DOMAIN;
if (!domain || domain.length === 0)
    throw new Error('You must specify the domain name of this server via the DOMAIN environment variable!');

let appSecret = process.env.SECRET;
console.log(process.env.SECRET);
if (!appSecret || appSecret.length === 0)
    throw new Error('You must specify an application secret for this server via the SECRET environment variable!');

//let shibalike = process.env.SHIBALIKE === "true";
let httpPort = process.env.HTTPPORT || 80;
let httpsPort = process.env.HTTPSPORT || 443;

let publicRoot = './vue/dist'; // absolute path to vue compiled dist
// let shibaUsers = require('./shibalike-users.json');

// load public certificate and private key
// used for HTTPS and for signing SAML requests
// put these in a /security subdirectory with the following names,
// or edit the paths used in the following lines
let publicCert, privateKey;

    publicCert = fs.readFileSync('../certs/cert.pem', 'utf-8');
    privateKey = fs.readFileSync('../certs/key.pem', 'utf-8');


///////////////////////////////////////////////////////////////////////////////
// setup express application and register middleware
//
let app = express();
app.use(morgan({
    format: process.env.LOGFORMAT || 'dev'
}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({type: 'application/json'}));
app.use(cookieParser());
app.use(session({
    secret: appSecret,
    cookie: {secret: true}
}));
app.use(express.static(publicRoot))
app.use(passport.initialize());
app.use(passport.session());

// Declare UIC Shibboleth Strategy
let utdshibStrategy = new utdshib.Strategy({
    // UIC Shibboleth wants the full website URL as the entity ID
    // so add the `https://` protocol to your domain name
    entityId: 'https://' + domain + preAuthUrl,
    privateKey: privateKey,
    callbackUrl: loginCallbackUrl,
    domain: domain + preAuthUrl
    // If your server is not using the same authoritative
    // time-server as the Shibboleth's (including if your
    // server is running within the NetID domain!), add
    // the following property setting. This will allow
    // for a small amount of skew between the clocks of
    // the client and the server.
    //
    // acceptedClockSkewMs: 200
});

// Declare Passport Local Strategy
passport.use(utdshibStrategy);

// Choose which strategy we are using
// shibalike for testing or utdshib for production
// if (shibalike) {
//     passport.use(shibalikeStrategy);
// } else {
//     passport.use(utdshibStrategy);
// }

// These functions are called to serialize the user
// to session state and reconstitute the user on the
// next request. Normally, you'd save only the netID
// and read the full user profile from your database
// during deserializeUser, but for this vite-example, we
// will save the entire user just to keep it simple
passport.serializeUser(function(user, done){
    done(null, user);
});

passport.deserializeUser(function(user, done){
    done(null, user);
});

///////////////////////////////////////////////////////////////////////////////
// login, login callback, and metadata routes
//
// TODO: potentially we just need to provide a convinient wrapper for adding these specific handlers
// to a webserver???
    // UIC Shibboleth authentication routes
app.get(loginUrl, passport.authenticate(utdshibStrategy.name), utdshib.backToUrl());
app.post(preAuthUrl + loginCallbackUrl, passport.authenticate(utdshibStrategy.name), utdshib.backToUrl());
app.get(utdshib.urls.metadata, utdshib.metadataRoute(utdshibStrategy, publicCert));


// Universal logout route
// app.get(logoutUrl, (req, res) => {
//     req.logout(function(err) {
//         if (err) { return next(err); }
//         res.redirect('/login');
//     });
// });
app.use(utdshib.ensureAuth(loginUrl));

///////////////////////////////////////////////////////////////////////////////
// application routes
//

// User details route
app.get('/', 
    function(req, res) {
        //req.user will contain the user object sent on by the
        //passport.deserializeUser() function above
        res.send('Hello ' + req.user.displayName + '!');
    }
);

// general error handler
// if any route throws, this will be called
app.use(function(err, req, res, next){
    console.error(err.stack || err.message);
    res.send(500, 'Server Error! ' + err.message);
});

///////////////////////////////////////////////////////////////////////////////
// web server creation and startup
//

// Create https and http server variables
let httpsServer, httpServer;

// Set configurations based on Shibalike/Shibboleth
    // Setup https server with declared certs
httpsServer = https.createServer({
    key: privateKey,
    cert: publicCert
}, app);

// Start https server
httpsServer.listen(httpsPort, function(){
    console.log('Listening for HTTPS requests on port ' + httpsServer.address().port);
});

// Setup http server that redirects to https
httpServer = http.createServer(function(req, res) {
    let redirUrl = 'https://' + domain;
    if (httpsPort != 443)
        redirUrl += ':' + httpsPort;
    redirUrl += req.url;

    res.writeHead(301, {'Location': redirUrl});
    res.end();
});


// Start http server
httpServer.listen(httpPort, function() {
    console.log('Listening for HTTP requests on port ' + httpServer.address().port);
});



// http://terrific-wealth.surge.sh/metadata.xml