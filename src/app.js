import "dotenv/config"
import express from "express"
import passport from "passport"
import { Strategy as SamlStrategy } from "passport-saml"
import { readFileSync } from "fs"
import { getEnvVar, extractIdPSigningCert } from "./utils/helper.js"
import { validateQuery } from "./utils/validate.js"
import { verifyPKCE } from "./utils/pkce.js"
import { createTransaction, consumeTransaction, createCode, consumeCode } from "./store.js"
import { z } from "zod"

import { allowed_clients } from "./allowed_clients.js"

const IdPSigningCert = extractIdPSigningCert(readFileSync("./metadata/utd-shibboleth.xml", "utf-8"))
const signingCert = readFileSync(getEnvVar("SIGNING_CERTIFICATE_PATH"), "utf-8")
// const decryptionCert = readFileSync(getEnvVar("DECRYPTION_CERTIFICATE_PATH"), "utf-8")
const decryptionCert = readFileSync(getEnvVar("SIGNING_CERTIFICATE_PATH"), "utf-8")

const app = express()
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(passport.initialize())

passport.use(
	new SamlStrategy(
		{
			callbackUrl: `${getEnvVar("EPICS_SSO_URL")}/api/sso/callback`,
			entryPoint: `${getEnvVar("IDP_ENTRY_POINT")}`,
			issuer: getEnvVar("EPICS_SSO_URL"),
			audience: getEnvVar("EPICS_SSO_URL"),
			cert: IdPSigningCert,
			// decryptionPvk: readFileSync(getEnvVar("DECRYPTION_PRIVATE_KEY_PATH"), "utf-8"),
			decryptionPvk: readFileSync(getEnvVar("SIGNING_PRIVATE_KEY_PATH"), "utf-8"),
			privateKey: readFileSync(getEnvVar("SIGNING_PRIVATE_KEY_PATH"), "utf-8"),
			signingCert: signingCert,
			signatureAlgorithm: "sha256",
			digestAlgorithm: "sha256",
			wantAssertionsSigned: true,
			identifierFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
		},

		(profile, done) => {
			// console.log("SAML PROFILE")
			// console.log(JSON.stringify(profile, null, 2))

			const user = {
				id: profile.nameID,
				email: profile.mail,
				name: profile.displayName,
				firstName: profile.givenName,
				lastName: profile.sn,
				attributes: profile,
			}

			done(null, user)
		},
	),
)

const pendingRedirects = new Map()

app.get("/api/sso/metadata", (req, res) => {
	const strategy = passport._strategy("saml")
	const metadata = strategy.generateServiceProviderMetadata(decryptionCert, signingCert)
	res.type("application/xml")
	res.send(metadata)
})

const loginQuerySchema = z.object({
	client_id: z.string().min(1),
	redirect_get_callback: z.url(),
	state: z.string().min(1),
	code_challenge: z.string().min(1),
})

app.get("/api/sso/login", validateQuery(loginQuerySchema), (req, res, next) => {
	const { client_id, redirect_get_callback, state, code_challenge } = req.validatedQuery

	const client = allowed_clients[client_id]

	if (!client) return res.status(400).send("Client ID does not match any registered clients")
	if (client.redirectGetCallback !== redirect_get_callback) return res.status(400).send("Redirect GET callback does not match registered redirect GET callback")

	const transaction = createTransaction({
		clientID: client_id,
		redirectGetCallback: redirect_get_callback,
		state: state,
		codeChallenge: code_challenge,
	})

	passport.authenticate("saml", {
		additionalParams: {
			RelayState: transaction,
		},
	})(req, res)
})

// Assertion Consumer Service, Shibboleth POSTs here
app.post(
	"/api/sso/callback",
	passport.authenticate("saml", {
		session: false,
		failureRedirect: "/api/sso/failure",
	}),

	(req, res) => {
		const relayState = req.body.RelayState

		const transaction = consumeTransaction(relayState)

		if (!transaction) return res.status(400).send("Invalid transaction. Please try logging in again.")

		const code = createCode({
			clientID: transaction.clientID,

			redirectGetCallback: transaction.redirectGetCallback,

			codeChallenge: transaction.codeChallenge,

			user: req.user,
		})

		res.redirect(`${transaction.redirectGetCallback}` + `?code=${code}` + `&state=${transaction.state}`)
	},
)

const tokenRequestSchema = z.object({
	client_id: z.string().min(1),
	redirect_get_callback: z.url(),
	code: z.string().min(1),
	code_verifier: z.string().min(1),
})

app.post("/api/sso/token", (req, res) => {
	const { client_id, redirect_get_callback, code, code_verifier } = req.body

	const auth = consumeCode(code)

	if (!auth) return res.status(400).json({ error: "Invalid authorization code" })
	if (auth.clientID !== client_id || auth.redirectGetCallback !== redirect_get_callback) return res.status(400).json({ error: "Invalid client or redirect GET callback" })
	if (!verifyPKCE(code_verifier, auth.codeChallenge)) return res.status(400).json({ error: "Invalid code verifier" })

	const user = auth.user
	const displayName = user.attributes.attributes["urn:oid:2.16.840.1.113730.3.1.241"] ?? ""
	const firstName = user.attributes.attributes["urn:oid:2.5.4.42"] ?? ""
	const lastName = user.attributes.attributes["urn:oid:2.5.4.4"] ?? ""
	const email = user.attributes.attributes["urn:oid:0.9.2342.19200300.100.1.3"] ?? ""
	res.json({ displayName, firstName, lastName, email })
})

app.get("/api/sso/failure", (req, res) => {
	res.status(401).send("Authentication failed. If this error persists, please contact UTDesign EPICS regarding EPICS SSO.")
})

app.listen(process.env.PORT ?? 3000, () => {
	console.log(`SAML gateway listening on port ${process.env.PORT ?? 3000}`)
})
