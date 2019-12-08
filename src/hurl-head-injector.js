const create_fragment = str =>
  document.createRange().createContextualFragment(str)

const inject_meta = (prop, content) => {
  return create_fragment(`<meta property="${prop}" content="${content}"/>`)
}

// const inject_title = (
const inject_title = title => {
  return create_fragment(`<title>${title}</title>`)
}

export const injectInHeadDOM = (type, content, prop) => {
  let DOM
  let width = null
  let height = null
  let head = document.getElementsByTagName("head")[0]
  switch (type) {
    case "meta-image":
      DOM = inject_meta(prop, content)
      width = inject_meta("og:image:width", "1600")
      height = inject_meta("og:image:height", "900")
      break
    case "meta":
      DOM = inject_meta(prop, content)
      break
    case "title":
      DOM = inject_title(content)
      break
  }
  if (width) {
    head.appendChild(DOM)
    head.appendChild(width)
    head.appendChild(height)
  } else {
    head.appendChild(DOM)
  }
}
