import "dotenv/config"
import { zerox } from "zerox"

async function main() {
	const [imagePath] = process.argv.slice(2)

	if (!imagePath) {
		console.error("Please provide an image path")
		process.exit(1)
	}

	const result = await zerox({
		filePath: imagePath,
		openaiAPIKey: process.env.OPENAI_API_KEY,
	})
	console.log(result)
}

if (require.main === module) {
	main().catch((error) => {
		console.error("Failed to process image.\n", error)
		process.exit(1)
	})
}
