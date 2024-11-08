# Ask PDF

A simple tool for asking ChatGPT about a pdf document.

```sh
npx tsx src/ask.ts <input.pdf> <prompt> [-i]
```

Optional `-i` paramter if you want to interactively ask more questions.


Run it on a bunch of files.
```sh
npx tsx src/askdir.ts path/to/dir <input.pdf> <prompt>
```

Turn a pdf into a markdown file using OCR.
```sh
./src/pdf2md <input.pdf> <output.md>
```

Ask back to back prompts to refine and answer, useful for summarizing. Prompts should be separated by `---`.
```sh
npx tsx src/askrecur.ts <prompts.md> <input.md>
```