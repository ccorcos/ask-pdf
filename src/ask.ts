import "dotenv/config"
import { OpenAI } from "openai"
import readline from "readline"
import { pdf2txt } from "./pdf2txt"
import { retry } from "./retry"

const model: OpenAI.Chat.ChatModel = "gpt-3.5-turbo"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type Messages = OpenAI.Chat.Completions.ChatCompletionMessageParam[]

export async function chatWithGPT(messages: Messages, question: string) {
	messages.push({ role: "user", content: question })

	const response = await openai.chat.completions.create({
		model: model,
		messages: messages,
	})

	const answer = response.choices[0].message.content

	messages.push({ role: "assistant", content: answer })
}

export async function initializeWithPdf(
	pdfPath: string,
	messages: Messages,
	truncate = 10_000_000
): Promise<void> {
	// Extract text from PDF
	const pdfText = await pdf2txt(pdfPath)

	WHOLE_THING: {
		console.log("size:", pdfText.length)
		messages.push({
			role: "system",
			content: `Based on the following document:\n\n${pdfText}`,
		})
	}

	CHUNK: {
		// Split PDF text into manageable chunks
		// const chunks = splitTextIntoChunks(pdfText, 2_000) // Adjust chunk size if necessary
		// // Process each chunk separately
		// for (const chunk of chunks) {
		// 	// Add the document chunk to the conversation
		// 	messages.push({
		// 		role: "system",
		// 		content: `Based on the following document chunk:\n\n${chunk}`,
		// 	})
		// }
	}

	TRUNCATE: {
		// const max = 45_000
		// if (pdfText.length > max) {
		// 	console.log(
		// 		"WARNING: truncated to",
		// 		Math.round((max / pdfText.length) * 100) + "%"
		// 	)
		// }
		// messages.push({
		// 	role: "system",
		// 	content: `Based on the following document:\n\n${pdfText.slice(0, max)}`,
		// })
	}

	TOKEN: {
		// const enc = encoding_for_model(model)
		// const tokens = enc.encode(pdfText)
		// if (tokens.length <= truncate) {
		// 	messages.push({
		// 		role: "system",
		// 		content: `Based on the following document:\n\n${pdfText}`,
		// 	})
		// 	return
		// }
		// const truncatedText = enc.decode(tokens.slice(0, truncate))
		// console.log(
		// 	"WARNING: truncated to",
		// 	Math.round((truncatedText.length / pdfText.length) * 100) + "%"
		// )
		// messages.push({
		// 	role: "system",
		// 	content: `Based on the following document:\n\n${truncatedText}`,
		// })
	}
}

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

	const interactive = args.includes("-i")
	const [pdfPath, initialPrompt] = args.filter((arg) => arg !== "-i")

	// Initialize conversation messages
	const messages: Messages = []
	await retry(async () => {
		messages.splice(0, messages.length)
		await initializeWithPdf(pdfPath, messages, 50_000)
		await chatWithGPT(messages, initialPrompt)
	})
	printConvo(messages.slice(2))

	if (!interactive) {
		// console.log(messages.reverse()[0].content)
		process.exit(0)
	}

	// Interactive mode
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: "user> ",
	})

	rl.on("line", async (input) => {
		if (input.toLowerCase() === "exit") {
			rl.close()
			process.exit(0)
		}
		if (input.trim() === "") return

		await chatWithGPT(messages, input)
		printConvo(messages.slice(-1))
	})
}

export function printConvo(messages: Messages) {
	for (const message of messages) {
		console.log(message.role + "> " + message.content + "\n\n")
	}
}

if (require.main === module) {
	main()
}
