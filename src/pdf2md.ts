import "dotenv/config"
import { zerox } from "zerox"

export async function pdf2md(filePath: string) {
	const result = await zerox({
		filePath: filePath,
		openaiAPIKey: process.env.OPENAI_API_KEY,
	})

	return result.pages
		.map(({ content, page }) => {
			return `<!-- Page ${page} -->\n${content}`
		})
		.join("\n")
}

if (require.main === module) {
	const pdfPath = process.argv.slice(2)[0]

	pdf2md(pdfPath).then((plaintext) => {
		if (plaintext) {
			console.log(plaintext)
		} else {
			console.error("Failed to convert PDF to plaintext")
			process.exit(1)
		}
	})
}

// TODO: pull out page by page to work through the pdf and cache the results. store in sqlite maybe.
//
