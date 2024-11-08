export async function retry<T>(fn: () => Promise<T>, tries = 0) {
	try {
		// console.error("running")
		return await fn()
	} catch (error) {
		if (tries >= 10) throw error

		if (error.status === 429) {
			// message: 'Rate limit reached for gpt-4o-mini in organization org-zt8czUs8Thn5aBD4n2Jf1kve on tokens per min (TPM): \
			// Limit 200000, Used 163084, Requested 62318. Please try again in 7.62s."
			const match = error.message.match(/try again in (\d+\.\d+)s/)
			const waitTimeMs = match
				? parseFloat(match[1]) * 1000 + 300 // 300ms more than recommended in the error.
				: 10 + 2 ** tries * 10 // Or 10ms + 2^n * 10ms backoff.

			console.error(error)
			console.error(`RATE LIMIT, sleeping for ${waitTimeMs}ms`)
			await sleep(waitTimeMs)
			return retry(fn, tries + 1)
		}

		throw error
	}
}

export const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms))
