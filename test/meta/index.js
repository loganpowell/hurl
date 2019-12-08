export const inject_meta = (prop, content) => {
  let meta = document
    .createRange()
    .createContextualFragment(`<meta property="${prop}" content="${content}"/>`)
  document.getElementsByTagName("head")[0].appendChild(meta)
}

inject_meta("og:title", "just a test content injection")
inject_meta("og:image", "https://i.imgur.com/BOdIBQz.gif")

console.log("navigator.userAgent:", navigator.userAgent)
