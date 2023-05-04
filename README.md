# Passport UTD - epics-sso

## to run metadata.js metadata_code

```
cd metadata_code
run metadata.js file
```

## To run program

Before running, make sure to configure the ecosystem file.

In the ecosystem.config.js file, SHIBALIKE is set to true. This is a test server, just for display to show that the system works. For production,
make SHIBALIKE false.

```
cd server
pm2 start ecosystem.config.js --env env
pm2 logs
```

### In the event you chnage anyting in the ecosystem.config.js, run the below command

```
 pm2 delete passport-utdshib
```

#### If you made multiple instances, and want to delete all

```
pm2 delete all
```

## To run frontend

```
cd server
cd vue
npm install
npm run dev
```
