This contains the basic setup for the SSO server that acts as the middleman for multiple clients, you can use this as a standalone microservice or integrate it with your server, however, setting up the server requires some approval from OIT office.

There are 5 files:

- index.ts
- middleware.ts
- config.ts
- authentication.ts
- routes.ts

index.ts

- It contains the high-level overview of the express application for the server

routes.ts

- It contains the routes for the express application
- /login: where you login into the sso server application
- /login/callback: after the successful login, this routes proccess the logic of what the server applicationn will do
- /check-auth: check whether if user is authenticated or not, this is used for route authentication
- /metadata.xml: generate a metadata for SP in which can communicate with the idP

config.ts

- contains the configuration for the express application

middlewares.ts

- contains the middlewares that will be used in the express application

authentication.ts

- contain the initialization of the UTDShib Strategy for passport and the logic to parse user information

Setting up the necessary credentials for SSO Server:

- run the command openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -sha256 -days 365 (make sure you modify the days to set the expiration for your SP certificate)
