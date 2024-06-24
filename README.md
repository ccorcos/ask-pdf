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
