import { EquivMap } from "@thi.ng/associative"
import { stream, fromDOMEvent, trace, merge } from "@thi.ng/rstream"
import * as xf from "@thi.ng/transducers"
import qs from "querystring"
import { parse_href } from "./parse-href"

//  FRIVOLOUS
//           d8                      d8
//   d88~\ _d88__   /~~~8e  888-~\ _d88__
//  C888    888         88b 888     888
//   Y88b   888    e88~-888 888     888
//    888D  888   C888  888 888     888
//  \_88P   "88_/  "88_-888 888     "88_/
//
//

let link1 = Object.assign(document.createElement("a"), {
  href: "/todos",
  innerText: " todos "
})
let link2 = Object.assign(document.createElement("a"), {
  href: "/users",
  innerText: " users "
})
let link3 = Object.assign(document.createElement("a"), {
  href: "/users/2",
  innerText: " user 2"
})
let link4 = Object.assign(document.createElement("a"), {
  href: "/todos/2",
  innerText: " todos 2"
})
document.body.appendChild(link1)
document.body.appendChild(link2)
document.body.appendChild(link3)
document.body.appendChild(link4)

// 📌 TODO: change to a component

const log = console.log
log("JS Loaded!")

// log("routing once")
// route({ state: "01" }, "title: 01", "/title")
// log("routing twice")
// route({ state: "03" }, "title: 02", "/rand")

//
//                           888
//   e88~~8e  888-~88e  e88~\888
//  d888  88b 888  888 d888  888
//  8888__888 888  888 8888  888
//  Y888    , 888  888 Y888  888
//   "88___/  888  888  "88_/888
//
//  FRIVOLOUS

// exports two things, a route_stream and a route function that can push events to the route_stream

let preloadForPage = async (query, path, b) => {
  let base = "https://jsonplaceholder.typicode.com/"
  let data = b
    ? await fetch(`${base}${path}/${b}`).then(r => r.json())
    : await fetch(`${base}${path}/`).then(r => r.json())
  let el = document.createElement("pre")
  el.innerText = JSON.stringify(data, null, 2)
  return el
}

const route = (...args) => history.pushState(...args)

// dispatch should take config data and then be "activated"
let config = config => async x => {
  log(x)
  let href = x.target.location.href
  let route_obj = parse_href(href)
  // log(route_obj)
  let { domain, hash, path, query } = route_obj
  let [a, b, c, d] = path
  let el =
    (await new EquivMap([
      [{ ...parse_href(href), path: ["todos"] }, preloadForPage(query, "todos", null)],
      [{ ...parse_href(href), path: ["todos", b] }, preloadForPage(query, "todos", b)],
      [{ ...parse_href(href), path: ["users"] }, preloadForPage(query, "users", null)],
      [{ ...parse_href(href), path: ["users", b] }, preloadForPage(query, "users", b)]
    ]).get(route_obj)) || "404"
  // this would be an hdom + spec -> page
  // log(el)
  if (el !== "404") document.body.appendChild(el)
  route({}, null, href)
}

let router_config = new EquivMap([
  [["users"], { preload: "https://jsonplaceholder.typicode.com/users", then: "" }],
  [
    ["users", "?"],
    [{ preload: "https://jsonplaceholder.typicode.com/users", with: "?" }, { then: "" }]
  ]
])
//
//                                                 d8
//   e88~~8e  Y88b  /  888-~88e   e88~-_  888-~\ _d88__  d88~\
//  d888  88b  Y88b/   888  888b d888   i 888     888   C888
//  8888__888   Y88b   888  8888 8888   | 888     888    Y88b
//  Y888    ,   /Y88b  888  888P Y888   ' 888     888     888D
//   "88___/   /  Y88b 888-_88"   "88_-~  888     "88_/ \_88P
//                     888
//

const route_stream = fromDOMEvent(window, "popstate", "route-stream")
const load_stream = fromDOMEvent(window, "load", "load-stream")

const nav_stream_DOM = merge({ src: [route_stream, load_stream] })

let href_handler = e => {
  e.preventDefault()
  if (window.location.href === e.target.href) {
    return
  }

  load_stream.next({
    target: {
      location: e.target
    }
  })
}

// just an example use
document.querySelectorAll("a").forEach(a => a.addEventListener("click", href_handler))

let dispatch = config()
nav_stream_DOM.subscribe(
  // trace("route"),
  xf.map(x => dispatch(x))
)

/* TBD/TOD:
- nav_stream_SRV
- memoization/caching strategy
- async support in config
- decouple all the things

*/
