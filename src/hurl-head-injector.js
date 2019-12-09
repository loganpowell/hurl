import { log } from "./utils"

const create_fragment = str =>
  document.createRange().createContextualFragment(str)

const create_meta = (prop, content) => {
  return create_fragment(`<meta property="og:${prop}" content="${content}"/>`)
}

// const create_title = (
const create_title = title => {
  return create_fragment(`<title>${title}</title>`)
}

const example = {
  meta_image:
    "https://images.unsplash.com/photo-1575837705830-3fb219be0ddf?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1070&q=80",
  meta_description: "a website for something",
  meta_title: "todos page",
  meta_url:
    "https://lirc1bvijj.execute-api.us-east-1.amazonaws.com/staging/todos",
  title_NA: "Todos Page"
}
export const injectMeta = (type, prop, content) => {
  switch (type) {
    // case "image":
    // DOM = create_meta(prop, content)
    // width = create_meta("og:image:width", "1600")
    // height = create_meta("og:image:height", "900")
    // document.head.querySelector('meta[property="og:image"]').attr("content", content)
    // break
    case "meta":
      // DOM = create_meta(prop, content)
      document.head.querySelector(
        `meta[property="og:${prop}"]`
      ).content = content
      break
    case "title":
      // DOM = create_title(content)
      document.title = content
      break
  }
}

export const replaceMeta = (obj = example) => {
  Object.entries(obj).forEach(([key, val]) => {
    let [type, prop] = key.split("_")
    injectMeta(type, prop, val)
    // log([type, prop, val])
  })
}

// replaceMeta(example) //?
