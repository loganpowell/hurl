import { stream, fromDOMEvent, trace, merge } from "@thi.ng/rstream"
import * as xf from "@thi.ng/transducers"
import qs from "querystring"
import { parse_href } from "./parse-href"
import { dispatch_w_config } from "./dispatcher"

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

const pushToWindowHistory = (...args) => (log("pushed:", args), history.pushState(...args))

// dispatch should take config data and then be "activated"

//
//                                                 d8
//   e88~~8e  Y88b  /  888-~88e   e88~-_  888-~\ _d88__  d88~\
//  d888  88b  Y88b/   888  888b d888   i 888     888   C888
//  8888__888   Y88b   888  8888 8888   | 888     888    Y88b
//  Y888    ,   /Y88b  888  888P Y888   ' 888     888     888D
//   "88___/   /  Y88b 888-_88"   "88_-~  888     "88_/ \_88P
//                     888
//

// navigation bar
const route_stream_DOM = fromDOMEvent(window, "popstate", "route-stream")
const load_stream_DOM = fromDOMEvent(window, "load", "load-stream")

// addEventListener("load", e =>
//   pushToWindowHistory(parse_href(e.target.location.href), null, e.target.location.href))

const nav_stream_DOM = merge({ src: [route_stream_DOM, load_stream_DOM] })

// link clicking
const href_handler = e => {
  e.preventDefault()
  log(e)
  if (window.location.href === e.target.href) {
    return
  }

  route_stream_DOM.next({
    target: {
      location: e.target
    }
  })
  pushToWindowHistory(parse_href(e.target.href), null, e.target.href)
}

// just an example use
document.querySelectorAll("a").forEach(a => a.addEventListener("click", href_handler))

const start = console.time
const end = console.timeEnd
nav_stream_DOM.subscribe(
  // trace("route"),
  xf.map(x => (start("dispatch"), dispatch_w_config(x.target.location.href), end("dispatch")))
)

/* TBD/TOD:
- nav_stream_SRV
- memoization/caching strategy
- async support in config
- decouple all the things

*/
