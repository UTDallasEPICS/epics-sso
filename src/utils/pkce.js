import crypto from "crypto"

export const verifyPKCE = (verifier, challenge) => {
	const hash = crypto.createHash("sha256").update(verifier).digest("base64url")
	return hash === challenge
}
