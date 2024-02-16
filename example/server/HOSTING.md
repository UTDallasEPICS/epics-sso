## Checklist for files in server
- [ ] authentication.ts
- [ ] config.ts
- [ ] index.ts
- [ ] middlewares.ts
- [ ] package.json
- [ ] .env
- [ ] cert.pem
- [ ] key.pem
- [ ] decrypted_key.pem 

# How to host the server
we are using `pm2` as the process manager to keep the server running and `nginx` to route then server port to domain address.

1. run npm pack on the library to convert it into `.tgz` files which can be used in the server
2. update the dependency in `package.json` for `utdshib`
3. generate `cert.pem` and `key.pem` using
```
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -sha256 -days 365
```
4. generate `decrypted_key.pem` using
```
openssl rsa -in key.pem -out decrypted_key.pem
```
5. run `npm i`
6. run `tsc`
7. copy `cert.pem`, `decrypted_key.pem` and `.env` to `dist` directory
8. run `node dist/index.js`

