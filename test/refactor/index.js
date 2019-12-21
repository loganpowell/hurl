const fetch = require("node-fetch")

const {
  stream,
  sidechainPartition,
  pubsub,
  fromAtom
} = require("@thi.ng/rstream")
const { scan, map } = require("@thi.ng/transducers")
const { fsm } = require("@thi.ng/transducers-fsm")
const { Atom, Cursor, Transacted } = require("@thi.ng/Atom")
const { isArray, isObject } = require("@thi.ng/checks")

const fs = require("fs")

const {
  hurl_link,
  register_router_BOM,
  replaceMeta,
  parse_hurl
} = require("../../src")

require("dotenv").config()

const fake_fetch = fileName =>
  new Promise((resolve, reject) =>
    fs.readFile(fileName, "utf8", (err, data) =>
      err ? reject(err) : resolve({ json: () => data })
    )
  )

fake_fetch("./test/refactor/todos.json").then(r => r.json()) //?

const state = new Atom({})

const in_router = new Cursor(state, "router")
in_router.deref() //?
in_router.swap(x => "old: " + x)

state.deref() //?

const states_stream = fromAtom(state)

/**
 * TBD:
 * - xf.scan((pre, cur) => ...passing vals between triggers (one step at a time)
 * - transducer_fsm = create (with all steps) -> use -> trash
 * - ctx.states_stream
 * */

// 📌 TODO: make composable, e.g.: make triggers that are composed of other triggers (RECURSION)

let preload_n_route = (fetch_args, ev) => [
  {
    id: "fetch",
    payload: fetch_args // -> stored as state
  },
  {
    id: "state",
    // data from fetch/DB needs to contain metadata to power <head>
    path: "content",
    // functions take any data resolved from previous trigger
    payload: data => ({ data })
  },
  {
    // this would replace the popstate_stream_BOM.next injection
    // could this replace head injection?
    id: "route",
    path: "route",
    payload: ev
  }
]

// let inject = {
//   meta_image: `https://picsum.photos/${
//     !isNaN(page_ID) ? `id/${page_ID}/` : ""
//   }1000/600.jpg`,
//   meta_description: `${
//     path[0] === "todos" ? data[0].title : data[0].company.catchPhrase
//   }`,
//   meta_title: `${path.join(" ")} page`,
//   meta_url: [domain, ...path, ""].join("/"),
//   title_NA: `${path.map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(" ")}`
// }
// replaceMeta(inject)

let example_json = {
  head: {
    title: "based on route/API endpoint",
    "og:title": "based on route/API endpoint", // if og -> val = `content=${val}`
    "og:image": "based on first image of data or route/params",
    "og:description": "based on some function of data",
    "og:type": "website"
  },
  body: {} // payload
}
/*
{ subdomain: [],
  domain: [ 'github', 'com' ],
  path: [ 'thi-ng', 'umbrella', 'tree', 'master', 'packages', 'paths' ],
  query: {},
  hash: '' }
*/

// fetch(...pic_fetch_args("random?query=cross walk")).then(r => r.json()) //?
// .then(d => d["urls"]["regular"]) //?

// fetch(...pic_fetch_args())
//   .then(r => r.json())
//   .then(d => d["urls"]["regular"]) //?

let trigger_fetch = args => (isArray(args) ? fetch(...args) : fetch(args))

// ↕ polyfill Headers (node)
global.Headers = fetch.Headers

const do_some_tweaking = async (data, ev) => {
  let href = ev.target.href
  let {
    subdomain,
    domain,
    path,
    query: { search },
    hash
  } = parse_hurl(href)

  const unsplash_base_URL = "https://api.unsplash.com/photos/"
  const unsplash_headers = new Headers({
    Authorization: `Client-ID ${process.env.UNSPLASH_KEY}`
  })

  const pic_fetch_opts = {
    method: "GET",
    headers: unsplash_headers
  }

  const pic_fetch_args = (qualifier = "acNPOikiDRw") => [
    `${unsplash_base_URL}${qualifier}`,
    pic_fetch_opts
  ]
  let pic_args = search
    ? pic_fetch_args(`random?query=${search}`)
    : pic_fetch_args()

  let pic = await trigger_fetch(pic_args)
    .then(r => r.json())
    .then(d => d["urls"]["regular"])

  let default_meta = {
    title: `Hyperlocals ${search && "Search Results for: " + search}`,
    "og:description": "social media for people who hate social media",
    "og:type": "website",
    "og:url": href,
    "og:image": pic,
    "og:image:width": 1200,
    "og:image:height": 1200
  }

  let page_ID = path.slice(-1)

  if (!isNaN(page_ID)) {
    return {
      ...default_meta,
      "og:image": `https://picsum.photos/id/${page_ID}/1000/600.jpg`,
      title: `${path
        .slice(-1)
        .map(x => x.charAt(0).toUpperCase() + x.slice(1))
        .join(" ")}`
    }
  } else if (isObject(data)) {
    // `https://picsum.photos/${
    //   !isNaN(page_ID) ? `id/${page_ID}/` : ""
    // }1000/600.jpg`
    return {
      ...default_meta,
      title: "based on route/API endpoint",
      "og:title": "based on route/API endpoint", // if og -> val = `content=${val}
      "og:image": "based on first image of data or route/params",
      "og:description": "based on some function of data"
    }
  }
}

// higher-order triggers can be composed of lower-order triggers
let route = (ctx, ev) => [
  {
    id: "head",
    path: "head",
    payload: do_some_tweaking(ev)
  },
  {
    id: "FLIP",
    payload: "classname to apply flip animation to"
  },
  {
    id: "popstate",
    payload: ev.target.href
  }
]

parse_hurl(
  "https://github.com/thi-ng/umbrella/tree/master/packages/paths?search=cross walk"
) //?

export const preload_link = fetch_args => ev => {
  ev.preventDefault()
  if (window.location.href === ev.target.href) return

  // popstate_stream_BOM.next({
  //   target: {
  //     location: e.target
  //   }
  // })
  preload_n_route(fetch_args, ev)
  return ev
}

// link clicking (before refactor)
// export const hurl_link = e => {
//   e.preventDefault()
//   log(e.target.href)
//   if (window.location.href === e.target.href) return

//   popstate_stream_BOM.next({
//     target: {
//       location: e.target
//     }
//   })
//   return e
//   // history.pushState(parse_hurl(e.target.href), null, e.target.href)
// }

"todos".split(".") //?
