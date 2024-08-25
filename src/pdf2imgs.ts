/*

./node_modules/.bin/tsx src/pdf2imgs.ts path/to/pdf path/to/dir

*/

import pdfType from "pdfjs-dist"
const pdfjsLib = require("pdfjs-dist") as typeof pdfType
const sharp = require("sharp")

const fs = require("fs")
const path = require("path")

export async function pdf2imgs(pdfPath: string, outputDir: string) {
	console.log(pdfPath, outputDir)
	// Create the output directory if it doesn't exist
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir)
	}

	// Load the PDF document
	const doc = await pdfjsLib.getDocument(pdfPath).promise
	console.log(`PDF loaded. Number of pages: ${doc.numPages}`)

	// Iterate through each page
	for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
		const page = await doc.getPage(pageNum)

		// Get the images on the page
		const ops = await page.getOperatorList()
		if (pageNum === 48) console.log(ops)

		for (let i = 0; i < ops.fnArray.length; i++) {
			if (ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
				const imgIndex = ops.argsArray[i][0]
				console.log(imgIndex)
				try {
					const img = await page.objs.get(imgIndex) // error here. do we need to call page.objs.resolve()?

					console.log(img)

					if (img && img.data) {
						// Use sharp to convert the image data to PNG
						const imgFileName = `image_page${pageNum}_${i}.png`
						const imgFilePath = path.join(outputDir, imgFileName)

						// // Extract the CTM (current transformation matrix) for the image
						// const imgTransform = ops.argsArray[i][1] // This is usually the transformation matrix

						// let rotationAngle = 0
						// if (imgTransform) {
						// 	// Calculate rotation angle
						// 	rotationAngle =
						// 		Math.atan2(imgTransform[1], imgTransform[0]) * (180 / Math.PI)
						// }

						// Save the image data to a file
						const sharpImage = await convertRawImageData(img)
						// // Apply the detected rotation
						// if (rotationAngle !== 0 && !isNaN(rotationAngle)) {
						// 	await sharpImage.rotate(rotationAngle).png().toFile(imgFilePath)
						// } else {
						await sharpImage.rotate().png().toFile(imgFilePath)
						// }
						console.log(`Extracted and converted: ${imgFileName}`)
					}
				} catch (error) {
					console.warn(error)
				}
			}
		}
	}
}

function expand1BPPTo8BPP(data, width, height) {
	const expandedBuffer = Buffer.alloc(width * height)

	for (let i = 0; i < data.length; i++) {
		for (let bit = 0; bit < 8; bit++) {
			const value = (data[i] >> (7 - bit)) & 1
			expandedBuffer[i * 8 + bit] = value * 255 // Convert 0/1 to 0/255
		}
	}

	return expandedBuffer
}

async function convertRawImageData(imgObj) {
	const { data, width, height, kind } = imgObj

	let rawBuffer
	let channels

	switch (kind) {
		case 1: // ImageKind.GRAYSCALE_1BPP
			rawBuffer = expand1BPPTo8BPP(data, width, height)
			channels = 1
			break
		case 2: // ImageKind.RGB_24BPP
			rawBuffer = Buffer.from(data)
			channels = 3
			break
		case 3: // ImageKind.RGBA_32BPP
			rawBuffer = Buffer.from(data)
			channels = 4
			break
		default:
			throw new Error(`Unsupported image kind: ${kind}`)
	}

	return sharp(rawBuffer, {
		raw: {
			width,
			height,
			channels,
		},
	})
}

if (require.main === module) {
	let [pdfPath, outputDir] = process.argv.slice(2)

	outputDir = outputDir || "."

	pdf2imgs(pdfPath, outputDir)
		.then(() => {
			process.exit(0)
		})
		.catch((error) => {
			console.error("Failed to extract images from pdf.\n", error)
			process.exit(1)
		})
}
