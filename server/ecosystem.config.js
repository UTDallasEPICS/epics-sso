module.exports = {
    apps : [
        {
            name: "passport-uicshib",
            script: "server.js",
            watch: true,
            ignore_watch : ["node_modules", "vue"],
            env: {
                "DOMAIN": "sso1.upwardapp.io",
                "SHIBALIKE": true,
                "SECRET": "secret",
                "HTTPPORT": 3010,
                "HTTPSPORT": 3011
            }
        }
    ]
}
