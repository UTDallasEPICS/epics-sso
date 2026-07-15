import { XMLParser } from "fast-xml-parser"

export const extractIdPSigningCert = (metadataXml) => {
	const parser = new XMLParser({
		ignoreAttributes: false,
		removeNSPrefix: true,
	})

	const metadata = parser.parse(metadataXml)

	const keyDescriptors = Array.isArray(metadata.EntityDescriptor.IDPSSODescriptor.KeyDescriptor)
		? metadata.EntityDescriptor.IDPSSODescriptor.KeyDescriptor
		: [metadata.EntityDescriptor.IDPSSODescriptor.KeyDescriptor]

	const signing = keyDescriptors.find((key) => key["@_use"] === "signing")

	if (!signing) {
		throw new Error("No signing certificate found")
	}

	return signing.KeyInfo.X509Data.X509Certificate.replace(/\s+/g, "")
}

export const getEnvVar = (name) => {
	const value = process.env[name]
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`)
	}
	return value
}
