import fetch from "node-fetch"

import { dispatcher, trace_stream, command$ } from "../../src/"

//
//    d8                      d8
//  _d88__  e88~~8e   d88~\ _d88__
//   888   d888  88b C888    888
//   888   8888__888  Y88b   888
//   888   Y888    ,   888D  888
//   "88_/  "88___/  \_88P   "88_/
//
//

let testicular = [
  {
    sub$: "init", // sets initial state of FSM
    args: { href: "https://jsonplaceholder.typicode.com/users/" }
  },
  {
    sub$: "filter", // another way to handle noops -> only emit if passes predicate
    args: ({ href }) => ({ href: href + "1" })
  },
  {
    // if the xf returns a promise, it is resolved before passing
    sub$: "fetch",
    args: ({ href }) => fetch(href).then(r => r.json()),
    // splitting behavior
    // dispatch to next (invoker .next triggers)
    reso: (state, res) => ({ data: res }),
    // dispatched to alternative stream (invoker .next errors) and triggers.cancel()
    // also consider just `throw`ing:
    // https://github.com/thi-ng/umbrella/tree/master/packages/rstream#conceptual-differences-to-rxjs
    erro: (state, err) => ({ sub$: "cancel", args: err })
  },
  state => route(state)
]
// Lower Order Trigger (on triggers.next("route") )
let route = state => [
  {
    sub$: "FLIP",
    // options (1): https://github.com/davidkpiano/flipping#new-flippingoptions
    // options (2): https://github.com/aholachek/react-flip-toolkit/tree/7382f9380200f5a85296621db852ea2513cc5eec/packages/flip-toolkit
    args: "start"
  },
  {
    sub$: "state",
    path: ["head"],
    // 📌 have to create a function that generates/overwrites these defaults...
    args: ({ href }) => ({
      meta: {
        // title: `Hyperlocals ${search && "Search Results for: " + search}`,
        "og:description": "social media for people who hate social media",
        "og:type": "website",
        "og:url": href,
        // "og:image": pic,
        "og:image:width": 1200,
        "og:image:height": 1200
      }
    })
  },
  {
    sub$: "state",
    path: ["body", "content"],
    args: { data: state.data }
  },
  {
    sub$: "state",
    path: ["body", "loading"],
    args: false
  },
  {
    sub$: "state",
    path: ["route"],
    args: { state: "parse_URL(href)" }
  },
  {
    sub$: "pushstate",
    args: { state: "route state overwritten 🔥" }
  },
  {
    sub$: "FLIP",
    args: "end"
  }
]

//
//           d8                      d8
//   d88~\ _d88__   /~~~8e  888-~\ _d88__
//  C888    888         88b 888     888
//   Y88b   888    e88~-888 888     888
//    888D  888   C888  888 888     888
//  \_88P   "88_/  "88_-888 888     "88_/
//
//
trace_stream("commands->", command$)

dispatcher(testicular) //?
