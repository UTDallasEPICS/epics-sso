import { v4 as uuidv4 } from "uuid"

const transactions = new Map()

const codes = new Map()

export const createTransaction = (data) => {
	const id = uuidv4()

	transactions.set(id, {
		...data,
		expires: Date.now() + 300000, // 5 minutes
	})

	return id
}

export const consumeTransaction = (id) => {
	const value = transactions.get(id)

	if (!value) return null

	transactions.delete(id)

	if (value.expires < Date.now()) return null

	return value
}

export const createCode = (data) => {
	const code = uuidv4()

	codes.set(code, {
		...data,
		expires: Date.now() + 300000, // 5 minutes
	})

	return code
}

export const consumeCode = (code) => {
	const value = codes.get(code)

	if (!value) return null

	codes.delete(code)

	if (value.expires < Date.now()) return null

	return value
}

export const peekCode = (code) => {
	const value = codes.get(code)

	if (!value) return null

	if (value.expires < Date.now()) return null

	return value
}
