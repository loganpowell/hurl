// import { log } from "./utils"

const base_cfg = {
  meta_image: "https://picsum.photos/1000/600.jpg",
  meta_description: "a website for something",
  meta_title: "some page",
  meta_url: "https://somewebsite.com/home",
  title_NA: "Some Page"
}
const injectMeta = (type, prop, content) => {
  switch (type) {
    case "meta":
      document.head.querySelector(
        `meta[property="og:${prop}"]`
      ).content = content
      break
    case "title":
      document.title = content
      break
  }
}

export const replaceMeta = (obj = base_cfg) => {
  Object.entries(obj).forEach(([key, val]) => {
    let [type, prop] = key.split("_")
    injectMeta(type, prop, val)
  })
}
