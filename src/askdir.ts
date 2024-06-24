import { readdirSync } from "fs"
import * as path from "path"
import { Messages, chatWithGPT, initializeWithPdf } from "./ask"

async function main() {
	// Command-line interface setup
	const args = process.argv.slice(2)

	if (
		args.includes("help") ||
		args.includes("--help") ||
		args.includes("-h") ||
		args.length < 2
	) {
		console.error('Usage: ./ask.ts path/to/file.pdf "this is my prompt" [-i]')
		process.exit(1)
	}

	const [dirPath, initialPrompt] = args.filter((arg) => arg !== "-i")
	const files = readdirSync(dirPath)

	for (const fileName of files) {
		// Initialize conversation messages
		const messages: Messages = []
		const pdfPath = path.join(dirPath, fileName)
		await initializeWithPdf(pdfPath, messages)
		await retry(() => chatWithGPT(messages, initialPrompt))
		console.log("Regarding:", fileName)
		printConvo(messages.slice(2))
		await sleep(500)
	}
}

export function printConvo(messages: Messages) {
	for (const message of messages) {
		console.log(message.role + "> " + message.content + "\n\n")
	}
}

if (require.main === module) {
	main()
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const retry = async (fn: () => Promise<any>, tries = 5) => {
	try {
		await fn()
	} catch (error) {
		if (tries <= 0) throw error

		if (error.status === 429) {
			console.log("RATE LIMIT")
			// await sleep(15_000)
			// return retry(fn, tries - 1)
			return
		}

		if (error.status === 400) {
			console.log("REQUEST TOO LARGE")
			return
		}

		throw error
	}
}
