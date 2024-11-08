# Ask PDF

A simple tool for asking ChatGPT about a pdf document.

```sh
./node_modules/.bin/tsx src/ask.ts path/to/file.pdf "Whatever prompt / question you have" [-i]
```

Optional `-i` paramter if you want to interactively ask more questions.


Run it on a bunch of files.
```sh
./node_modules/.bin/tsx src/askdir.ts path/to/dir "Whatever prompt / question you have"
```


# Data Extraction

PDF data extraction is painful.

Currently what claude-sonnet uses is pdfminer

```sh
pip install pdfminer.six
pdf2txt.py /Users/chet/Downloads/FORPD/20230816Plus.pdf
```

My version preserves layout a lot better

```sh
./node_modules/.bin/tsx src/pdf2txt.ts /Users/chet/Downloads/FORPD/20230816Plus.pdf
```

But it doesn't handle images inside pdfs very well.

`pdf2imgs` is an experiment with extracting images for ocr.
`pdfocr` is an experiment with using ocr on the entire pdf.

None of this is perfect.

[Zerox looks promising](https://github.com/getomni-ai/zerox).

```sh
brew install graphicsmagick
```



