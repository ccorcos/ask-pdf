/*

Uses OpenAI's OCR to convert an image to markdown, similar to zerox.

tsx src/png2md.ts path/to/image.png > path/to/output.md

*/

import "dotenv/config"
import * as fs from "fs/promises"
import { OpenAI } from "openai"
import { retry } from "./retry"

const model: OpenAI.Chat.ChatModel = "gpt-4o-mini"
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type Messages = OpenAI.Chat.Completions.ChatCompletionMessageParam[]

export async function png2md(imageBuffer: Buffer) {
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
		.then((imageBuffer) => png2md(imageBuffer))
		.then((result) => {
			console.log(result)
			process.exit(0)
		})
		.catch((error) => {
			console.error("Failed to process image.\n", error)
			process.exit(1)
		})
}
