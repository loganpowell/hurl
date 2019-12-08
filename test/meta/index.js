import { injectInHeadDOM } from "../../src"

injectInHeadDOM("meta", "just a test content injection", "og:title")
injectInHeadDOM("meta", "https://i.imgur.com/BOdIBQz.gif", "og:image")
injectInHeadDOM("title", "A new title")

console.log("navigator.userAgent:", navigator.userAgent)
