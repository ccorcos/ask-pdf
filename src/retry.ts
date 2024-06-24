export const retry = async <T>(fn: (arg: T) => Promise<any>, args: T[]) => {
	try {
		const arg = args.shift()
		if (arg === undefined) return
		await fn(arg)
	} catch (error) {
		if (args.length === 0) {
			console.error(error)
			return
		}

		if (error.status === 429) {
			// console.error("RATE LIMIT", error)
			console.error("RATE LIMIT")
			await sleep(10_000)
			return retry(fn, args)
		}

		if (error.status === 400) {
			// console.error("BAD REQUEST", error)
			console.error("BAD REQUEST")
			return retry(fn, args)
		}

		throw error
	}
}

export const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms))
