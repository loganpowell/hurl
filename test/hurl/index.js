// import * as xf from "@thi.ng/transducers"
import { hurl_link, register_router_BOM, injectInHead } from "../../src/"
import { router } from "./router"

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

// exports two things, a route_stream and a route function that can push events to the route_stream

// just an example use
document
  .querySelectorAll("a")
  .forEach(a => a.addEventListener("click", hurl_link))

const on_hurl = register_router_BOM(router)

on_hurl(data => {
  const el = document.createElement("pre") // expose to plug
  el.innerText = JSON.stringify(data, null, 2)
  if (el !== "404") document.body.appendChild(el)
  injectInHead("meta", "just a test content injection", "og:title")
  injectInHead("meta", "https://i.imgur.com/BOdIBQz.gif", "og:image")
  injectInHead("title", "A new title")
})

// data_stream.subscribe(
//   xf.map(({ hurl_data }) => {
//     // -> return tuple [ { state }, fn(EquivMap) ] ?
//     // END: THIS MAY BE BEST HANDLED OUTSIDE /////////
//     // this is used by importing dispatch_w_config into the server config.
//     // if (state.domain.length < 1) return hurl_data // embed
//     // this would be an hdom + spec -> page
//     const el = document.createElement("pre") // expose to plug
//     el.innerText = JSON.stringify(hurl_data, null, 2)
//     if (el !== "404") document.body.appendChild(el)
//   })
// )

// nav_stream_DOM.subscribe(
//   // trace("route"),
//   xf.map(x => (start("dispatch"), router(x.target.location.href), end("dispatch")))
// )

/* TBD/TOD:
- nav_stream_SRV
- memoization/caching strategy
- async support in config
- decouple all the things

*/
