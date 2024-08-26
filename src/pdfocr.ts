/*

./node_modules/.bin/tsx src/pdfocr.ts path/to/pdf

*/

import { Canvas, createCanvas } from "canvas"
import * as fs from "fs"
import pdfType from "pdfjs-dist"
import { createWorker } from "tesseract.js"
const pdfjsLib = require("pdfjs-dist") as typeof pdfType

// Set up the Node.js canvas factory for pdfjs-dist
const nodeCanvasFactory = {
	create(width: number, height: number) {
		const canvas = createCanvas(width, height)
		const context = canvas.getContext("2d")
		return {
			canvas,
			context,
		}
	},
	reset(
		canvasAndContext: { canvas: Canvas; context: CanvasRenderingContext2D },
		width: number,
		height: number
	) {
		canvasAndContext.canvas.width = width
		canvasAndContext.canvas.height = height
	},
	destroy(canvasAndContext: {
		canvas: Canvas
		context: CanvasRenderingContext2D
	}) {
		// We don't need to do anything here
	},
}

async function* processPDF(pdfPath: string): AsyncGenerator<string[]> {
	const data = new Uint8Array(fs.readFileSync(pdfPath))
	const loadingTask = pdfjsLib.getDocument({
		data,
		canvasFactory: nodeCanvasFactory,
	})
	const pdf = await loadingTask.promise
	const worker = await createWorker("eng")

	for (let i = 1; i <= pdf.numPages; i++) {
		console.log("Page", i)
		const page = await pdf.getPage(i)
		const scale = 1.5
		const viewport = page.getViewport({ scale })
		const canvasAndContext = nodeCanvasFactory.create(
			viewport.width,
			viewport.height
		)
		const renderContext = {
			canvasContext: canvasAndContext.context,
			viewport: viewport,
		}

		await page.render(renderContext as any).promise

		const { data } = await worker.recognize(
			canvasAndContext.canvas.toBuffer("image/png")
		)
		console.log(data)
		throw new Error("Stop")
		const bitmap = createTextBitmap(data.text)
		yield bitmap
	}

	await worker.terminate()
}

function createTextBitmap(text: string): string[] {
	const lines = text.split("\n")
	const maxLineLength = Math.max(...lines.map((line) => line.length))

	// Initialize bitmap with spaces
	const bitmap: string[] = Array(lines.length)
		.fill("")
		.map(() => " ".repeat(maxLineLength))

	// Write characters into bitmap
	lines.forEach((line, y) => {
		line.split("").forEach((char, x) => {
			bitmap[y] = bitmap[y].substring(0, x) + char + bitmap[y].substring(x + 1)
		})
	})

	return bitmap
}

export async function pdfocr(pdfPath: string) {
	// Print or process the text bitmaps
	for await (const bitmap of processPDF(pdfPath)) {
		console.log(bitmap.join("\n"))
	}
	// textBitmaps.forEach((bitmap, pageIndex) => {
	// 	console.log(`Page ${pageIndex + 1}:`)
	// 	bitmap.forEach((line) => console.log(line))
	// 	console.log("\n")
	// })
}

if (require.main === module) {
	const pdfPath = process.argv.slice(2)[0]

	pdfocr(pdfPath).then((plaintext) => {
		// if (plaintext) {
		// 	console.log(plaintext)
		process.exit(0)
		// } else {
		// 	console.error("Failed to convert PDF to plaintext")
		// 	process.exit(1)
		// }
	})
}
