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
npx tsx src/openaiocr.ts examples/FORPD/0001.png > examples/FORPD-md/0001.md
```