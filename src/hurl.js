import {
  fromDOMEvent,
  merge,
  sidechainPartition,
  stream
} from "@thi.ng/rstream"
import * as xf from "@thi.ng/transducers"
import { parse_hurl } from "./hurl-parser"
import { hurl_dispatch } from "./hurl-router"
import { log, start, end } from "./utils"

// 📌 TODO: change to a component

const popstate_stream_BOM = fromDOMEvent(window, "popstate", "popstate-stream")
const load_stream_BOM = fromDOMEvent(window, "DOMContentLoaded", "load-stream")
const async_route = stream()
const nav_stream_BOM = merge({ src: [popstate_stream_BOM, load_stream_BOM] })

const async_nav_stream_BOM = nav_stream_BOM.subscribe(
  sidechainPartition(async_route)
)

async_nav_stream_BOM.subscribe(
  xf.map(x => {
    history.pushState(
      parse_hurl(x[0].target.location.href),
      null,
      x[0].target.location.href
    )
    document.dispatchEvent(new Event("page-ready"))
  })
)

// link clicking
export const hurl_link = e => {
  e.preventDefault()
  log(e.target.href)
  if (window.location.href === e.target.href) return

  popstate_stream_BOM.next({
    target: {
      location: e.target
    }
  })
  return e
  // history.pushState(parse_hurl(e.target.href), null, e.target.href)
}

//https://stackoverflow.com/questions/3163615/how-to-scroll-html-page-to-given-anchor
export const hash_handler = hash => (location.hash = "#" + hash)

// or
// someDOMNode.scrollIntoView();
export const trigger_async_route = arg => async_route.next(arg)
/**
 * takes a `hurl_router` (configured routing fn) and applies the router on
 * every emission of the browser navigation stream (a stream of nav events)
 * the returned dispatching function allows the user to hook into the data
 * emitted as per her router configuration and deploy some function thereupon
 * @returns hurl_dispatch - an event listener for dispatching
 * */
export const register_router_BOM = hurl_router => {
  nav_stream_BOM.subscribe(
    // trace("route"),
    xf.map(
      x => (
        start("dispatch"), hurl_router(x.target.location.href), end("dispatch")
      )
    )
  )
  return hurl_dispatch
}
