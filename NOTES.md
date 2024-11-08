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



Game plan...

- Get some example PDFs
- Compare different results.
	- pdfminer
	- custom pdf2txt
		- post-process into markdown?
	- tesseract ocr
	- openai ocr


# Convert PDFs to PNGs

This didnt work well. Ran out of memory. Doesn't look good.
```sh
sudo apt install imagemagick
mkdir out
convert -density 300 FORPD.pdf out/page-%03d.png
```

This worked great.
```sh
apt install ghostscript
mkdir out
gs -dNOPAUSE -dBATCH -sDEVICE=pngalpha -r600 -sOutputFile=out/page-%03d.png FORPD.pdf
```

Pull out the first page from a pdf
```sh
gs -sDEVICE=pdfwrite -dNOPAUSE -dBATCH -dSAFER -dFirstPage=1 -dLastPage=1 -sOutputFile="FORPD-001.pdf" "FORPD.pdf"
```

gs -dNOPAUSE -dBATCH -sDEVICE=png16m -r600 -dBackgroundColor=16#FFFFFF -dFirstPage=1 -dLastPage=2 -sOutputFile=out/page-%03d.png FORPD.pdf


gs -dNOPAUSE -dBATCH -sDEVICE=png16m -r400 -dBackgroundColor=16\#FFFFFF -dFirstPage=1 -dLastPage=1 -sOutputFile=out/page-%03d.png FORPD.pdf



White background is important...

TODO
- page by page -> png -> markdown


```sh
# pdf -> png pages
src/pdf2png examples/FORPD.pdf examples/FORPD

mkdir -p examples/FORPD-md
npx tsx src/png2md.ts examples/FORPD/0001.png > examples/FORPD-md/0001.md
```


```sh
time ./src/pdf2md examples/FORPD.pdf examples/FORPD.md
time ./src/pdf2md examples/SJUSD.pdf examples/SJUSD.md
```

```sh
time npx tsx askrecur.ts src/prompts.md examples/FORPD.md > examples/FORPD-summary.md
time npx tsx askrecur.ts src/prompts.md examples/SJUSD.md > examples/SJUSD-summary.md
```
