import "dotenv/config"
import fs from "fs"
import { OpenAI } from "openai"
import pdfParse from "pdf-parse"
import readline from "readline"

// Extract text from PDF
async function extractTextFromPDF(filePath: string): Promise<string> {
	const dataBuffer = fs.readFileSync(filePath)
	const pdfData = await pdfParse(dataBuffer)
	return pdfData.text
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

type Messages = OpenAI.Chat.Completions.ChatCompletionMessageParam[]

async function chatWithGPT(messages: Messages, question: string) {
	messages.push({ role: "user", content: question })

	const response = await openai.chat.completions.create({
		model: "gpt-4o",
		messages: messages,
	})

	const answer = response.choices[0].message.content

	messages.push({ role: "assistant", content: answer })
}

async function initializeWithPdf(
	pdfPath: string,
	messages: Messages
): Promise<void> {
	// Extract text from PDF
	const pdfText = await extractTextFromPDF(pdfPath)
	messages.push({
		role: "system",
		content: `Based on the following document:\n\n${pdfText}`,
	})
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
	await initializeWithPdf(pdfPath, messages)
	await chatWithGPT(messages, initialPrompt)

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

function printConvo(messages: Messages) {
	for (const message of messages) {
		console.log(message.role + "> " + message.content + "\n\n")
	}
}

main()
