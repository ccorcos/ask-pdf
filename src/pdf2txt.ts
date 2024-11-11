/*

Simple PDF text extractor.

npx tsx src/pdf2txt.ts path/to/pdf

*/

import pdfType, { PDFPageProxy } from "pdfjs-dist"
const pdfjsLib = require("pdfjs-dist") as typeof pdfType

// Define a character width (in pixels)
// A smaller character with larger page width allows more space for tables to render well.
const CHAR_WIDTH_PX = 4
const PAGE_WIDTH_CHARS = 300

const PAGE_LABELS = true

async function convertPdfToPlaintext(pdfUrl) {
	// Hide pdfjs-dist warnings
	const log = console.log
	console.log = () => {}

	const pdf = await pdfjsLib.getDocument(pdfUrl).promise

	const pages: string[] = []

	for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
		const page = await pdf.getPage(pageNum)
		const pageText = await processPage(page)
		pages.push(pageText)
	}

	console.log = log

	return pages
		.map((page, i) => {
			const spaces = getMinLeadingSpaces(page)
			const lines = page.split("\n").map((line) => line.slice(spaces).trimEnd())
			const maxLen = Math.max(...lines.map((line) => line.length))
			return (
				// (PAGE_LABELS ? `PAGE ${i + 1} `.padEnd(maxLen, "-") + "\n" : "") +
				(PAGE_LABELS ? `--- PAGE ${i + 1} ---` + "\n" : "") +
				"\n" +
				lines.join("\n") +
				"\n"
			)
		})
		.join("\n")
		.trim()
}

function getMinLeadingSpaces(text: string) {
	const lines = text.split("\n")
	let minSpaces = Infinity

	for (const line of lines) {
		if (line.trim().length === 0) continue // Skip empty lines

		const leadingSpaces = line.length - line.trimStart().length
		minSpaces = Math.min(minSpaces, leadingSpaces)

		if (minSpaces === 0) break // No need to continue if we find a line with no leading spaces
	}

	return minSpaces === Infinity ? 0 : minSpaces
}

async function processPage(page: PDFPageProxy) {
	const textContent = await page.getTextContent({ disableNormalization: true })
	const pageText = textContent.items.map((item) => {
		if (!("transform" in item)) {
			console.error("item missing transform", item)
			return {
				text: "str" in item ? (item.str as string) : "",
				x: 0,
				y: 0, // We'll sort these to the top
			}
		}

		return {
			text: item.str,
			x: Math.floor(item.transform[4] / CHAR_WIDTH_PX),
			y: Math.round(item.transform[5]),
		}
	})

	pageText.sort((a, b) => b.y - a.y || a.x - b.x)

	if (pageText.length === 0) return ""

	let lines: string[] = []
	let currentY = pageText[0].y
	let currentLine = ""
	let currentX = 0

	for (const item of pageText) {
		if (item.y !== currentY) {
			// New line detected
			lines.push(wrapLine(currentLine))
			currentLine = " ".repeat(item.x) + item.text
			currentX = item.x + item.text.length
			currentY = item.y
		} else {
			// Same line
			const spacesToAdd = Math.max(0, item.x - currentX)
			if (spacesToAdd > 0) {
				currentLine += " ".repeat(spacesToAdd)
				currentX += spacesToAdd
			}
			currentLine += item.text
			currentX += item.text.length
		}
	}
	// Add the last line of the page
	lines.push(wrapLine(currentLine))

	return lines.join("\n")
}

function wrapLine(line: string) {
	if (line.length <= PAGE_WIDTH_CHARS) {
		return line
	}

	let wrappedLine = ""
	let currentLineLength = 0
	const words = line.split(" ")

	for (const word of words) {
		if (currentLineLength + word.length + 1 > PAGE_WIDTH_CHARS) {
			if (currentLineLength > 0) {
				wrappedLine += "\n"
			}
			wrappedLine += word
			currentLineLength = word.length
		} else {
			if (currentLineLength > 0) {
				wrappedLine += " "
				currentLineLength += 1
			}
			wrappedLine += word
			currentLineLength += word.length
		}
	}

	return wrappedLine
}

export const pdf2txt = convertPdfToPlaintext

if (require.main === module) {
	const pdfPath = process.argv.slice(2)[0]

	pdf2txt(pdfPath).then((plaintext) => {
		if (plaintext) {
			console.log(plaintext)
		} else {
			console.error("Failed to convert PDF to plaintext")
			process.exit(1)
		}
	})
}
