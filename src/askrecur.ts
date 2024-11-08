import "dotenv/config"
import fs from "fs/promises"
import { OpenAI } from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type Message = OpenAI.Chat.Completions.ChatCompletionMessageParam

async function loadPrompts(promptsPath: string): Promise<string[]> {
	const promptsFile = await fs.readFile(promptsPath, "utf-8")
	return promptsFile.split("\n---\n").map((p) => p.trim())
}

export async function askrecur(
	promptsPath: string,
	filePath: string
): Promise<Message[]> {
	const fileContents = await fs.readFile(filePath, "utf-8")
	const prompts = await loadPrompts(promptsPath)

	const messages: Message[] = []

	for (let i = 0; i < prompts.length; i++) {
		const prompt = prompts[i]

		if (i === 0) {
			messages.push({
				role: "system",
				content: prompt,
			})
			messages.push({
				role: "user",
				content: fileContents,
			})
		} else {
			messages.push({
				role: "user",
				content: prompt,
			})
		}

		const response = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: messages,
		})

		const result = response.choices[0].message.content!
		messages.push({
			role: "assistant",
			content: result,
		})

		console.error("ASSISTANT> ", result, "\n\n")
	}

	return messages
}

async function main() {
	const [promptsPath, filePath] = process.argv.slice(2)

	if (!promptsPath || !filePath) {
		console.error(
			"Usage: tsx askrecur.ts <prompts.md> <input.md>\n" +
				"  prompts.md: Path to markdown file containing prompts separated by '---'\n" +
				"  input.md: Path to markdown file to askrecur"
		)
		process.exit(1)
	}

	try {
		const messages = await askrecur(promptsPath, filePath)
		console.log(messages.reverse()[0].content)
		// console.log(JSON.stringify(messages.slice(2), null, 2))
	} catch (error) {
		console.error("Failed to askrecur document.\n", error)
		process.exit(1)
	}
}

if (require.main === module) {
	main()
}
