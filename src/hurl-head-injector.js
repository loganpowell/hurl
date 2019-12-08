const create_fragment = str =>
  document.createRange().createContextualFragment(str)

const inject_meta = (prop, content) => {
  return create_fragment(`<meta property="${prop}" content="${content}"/>`)
}

// const inject_title = (
const inject_title = title => {
  return create_fragment(`<title>${title}</title>`)
}

export const injectInHead = (type, content, prop) => {
  let DOM
  switch (type) {
    case "meta":
      DOM = inject_meta(prop, content)
      break
    case "title":
      DOM = inject_title(content)
      break
  }
  document.getElementsByTagName("head")[0].appendChild(DOM)
}
