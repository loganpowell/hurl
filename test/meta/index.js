import { injectInHead } from "../../src"

injectInHead("meta", "just a test content injection", "og:title")
injectInHead("meta", "https://i.imgur.com/BOdIBQz.gif", "og:image")
injectInHead("title", "A new title")

console.log("navigator.userAgent:", navigator.userAgent)
