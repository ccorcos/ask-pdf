import { readdirSync } from "fs"
import * as path from "path"
import { Messages, chatWithGPT, initializeWithPdf } from "./ask"
import { retry, sleep } from "./retry"

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
		if (fileName.startsWith(".")) continue
		// Initialize conversation messages
		const messages: Messages = []
		const pdfPath = path.join(dirPath, fileName)
		await retry(async () => {
			await initializeWithPdf(pdfPath, messages, 50_000)
			await chatWithGPT(messages, initialPrompt)
		})
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
