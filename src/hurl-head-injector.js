export const inject_meta = (prop, content) => {
  let meta = document
    .createRange()
    .createContextualFragment(`<meta property="${prop}" content="${content}"/>`)
  document.getElementsByTagName("head")[0].appendChild(meta)
}

// export const inject_title = (
