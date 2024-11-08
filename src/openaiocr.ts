import "dotenv/config"
import * as fs from "fs/promises"
import { OpenAI } from "openai"

const model: OpenAI.Chat.ChatModel = "gpt-4o-mini"
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type Messages = OpenAI.Chat.Completions.ChatCompletionMessageParam[]

async function retry<T>(fn: () => Promise<T>, tries = 0) {
	try {
		// console.error("running")
		return await fn()
	} catch (error) {
		if (tries >= 10) throw error

		if (error.status === 429) {
			const ms = 10 + 2 ** tries * 10
			console.error(error)
			console.error(`RATE LIMIT, sleeping for ${ms}ms`)
			await sleep(ms)
			return retry(fn, tries + 1)
		}

		throw error
	}
}

export const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms))

export async function openaiocr(imageBuffer: Buffer) {
	// Default system message.
	const messages: Messages = [
		{
			role: "system",
			content: `
Convert the following image to markdown.
Return only the markdown with no explanation text. Do not include deliminators like \`\`\`markdown.
You must include all information on the page.
`.trim(),
		},
	]

	// Add Image to request
	const base64Image = imageBuffer.toString("base64")
	messages.push({
		role: "user",
		content: [
			{
				type: "image_url",
				image_url: { url: `data:image/png;base64,${base64Image}` },
			},
		],
	})

	const response = await retry(() =>
		openai.chat.completions.create({
			model: model,
			messages: messages,
			frequency_penalty: 0,
			presence_penalty: 0,
			temperature: 0,
			top_p: 1,
			// max_tokens: 2000,
		})
	)

	const answer = response.choices[0].message.content

	return answer
}

if (require.main === module) {
	const [imagePath] = process.argv.slice(2)

	if (!imagePath) {
		console.error("Please provide an image path")
		process.exit(1)
	}

	fs.readFile(imagePath)
		.then((imageBuffer) => openaiocr(imageBuffer))
		.then((result) => {
			console.log(result)
			process.exit(0)
		})
		.catch((error) => {
			console.error("Failed to process image.\n", error)
			process.exit(1)
		})
}
