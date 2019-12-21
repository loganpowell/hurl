import { isObject, isArray, isFunction, isPromise, isString, isNull } from "@thi.ng/checks"
import { scan, map } from "@thi.ng/transducers"
import { fsm } from "@thi.ng/transducers-fsm"
import { stream, pubsub, bisect, resolve, trace } from "@thi.ng/rstream"
import { EquivMap } from "@thi.ng/associative"

import fetch from "node-fetch"

/**
 * PSEUDO:
 * - create some test payloads for dispatcher: single obj & array
 * - create a handler that handles a single obj (O)
 * - create a handler that uses O on every elem of array
 * - async reducer that resolves intermediary values to be assoc'ed to accumulator
 * - use `scan` to pass the accumulator
 *
 * DIAGRAM:
 *
 *    9   8  7  6      5  4  3  2  1
 * >--*--[*, *, *]----[*, *, *, *]-*--->
 *    |  |            |            |
 *    A  B            B            A      <== ctx.run.next()'s
 *    E  rE rE rE     rE rE rE rE  E
 *
 * A: single emmission   : x => form_1(x)
 * B: sequence emmission : form_2 = [x, x, x].scan((a,c) => form_1(x)).subscribe(resolve()).subscribe...
 *
 * HOF (A|B): x => isArray(x) ? form_2(x) : form_1(x)
 *
 * A) Description:
 * - takes any promises and passes them through as-is,
 * - wraps any non-promise in Promise.resolve(x)
 *
 * Canceling 🤔:
 * - enable ctx.run.cancel() via external or internal events (e.g., popstate / { $sub:  "cancel" })
 *
 *
 * */
// Higher Order Trigger (used in-situ)
let prefetch_link = (ctx, ev) => {
  ev.preventDefault()

  if (window.location.href === ev.target.href) return // one way of handling noops

  // single event object just directly pushes to the triggers stream in the stream xf
  // first set state.loading = true
  ctx.run.next({
    $sub: "state",
    path: ["body", "loading"],
    args: true
  })

  // an array triggers the fsm to pass data between events and batch state updates
  // run/batch up a sequence of events
  ctx.run.next([
    {
      $sub: "init", // sets initial state of FSM
      args: { href: ev.target.href }
    },
    {
      $sub: "filter", // another way to handle noops -> only emit if passes predicate
      args: ({ href }) =>
        window.location.href === href
          ? { $sub: "cancel", args: "window.location.href === href" }
          : { href }
    },
    {
      // if the xf returns a promise, it is resolved before passing
      $sub: "fetch",
      args: ({ href }) => fetch("api" + href).then(r => r.json()),
      // splitting behavior
      // dispatch to next (invoker .next triggers)
      reso: (state, res) => ({ ...state, data: res.json() }),
      // dispatched to alternative stream (invoker .next errors) and triggers.cancel()
      // also consider just `throw`ing:
      // https://github.com/thi-ng/umbrella/tree/master/packages/rstream#conceptual-differences-to-rxjs
      erro: (state, err) => ({ $sub: "cancel", args: err })
    },
    state => route(state, ev.target.href)
  ])
}

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
    $sub: "init", // sets initial state of FSM
    args: { href: "https://jsonplaceholder.typicode.com/todos/" }
  },
  {
    $sub: "filter", // another way to handle noops -> only emit if passes predicate
    args: ({ href }) => ({ href: href + "1" })
  },
  {
    // if the xf returns a promise, it is resolved before passing
    $sub: "fetch",
    args: ({ href }) => fetch(href).then(r => r.json()),
    // splitting behavior
    // dispatch to next (invoker .next triggers)
    reso: (state, res) => ({ data: res }),
    // dispatched to alternative stream (invoker .next errors) and triggers.cancel()
    // also consider just `throw`ing:
    // https://github.com/thi-ng/umbrella/tree/master/packages/rstream#conceptual-differences-to-rxjs
    erro: (state, err) => ({ $sub: "cancel", args: err })
  },
  state => route(state)
]
// Lower Order Trigger (on triggers.next("route") )
let route = state => [
  {
    $sub: "FLIP",
    // options (1): https://github.com/davidkpiano/flipping#new-flippingoptions
    // options (2): https://github.com/aholachek/react-flip-toolkit/tree/7382f9380200f5a85296621db852ea2513cc5eec/packages/flip-toolkit
    args: "start"
  },
  {
    $sub: "state",
    path: ["head"],
    // 📌 have to create a function that generates/overwrites these defaults...
    args: {
      head: {
        // title: `Hyperlocals ${search && "Search Results for: " + search}`,
        "og:description": "social media for people who hate social media",
        "og:type": "website",
        "og:url": state,
        // "og:image": pic,
        "og:image:width": 1200,
        "og:image:height": 1200
      }
    }
  },
  {
    $sub: "state",
    path: ["body", "content"],
    args: { data: state.data }
  },
  {
    $sub: "state",
    path: ["body", "loading"],
    args: false
  },
  {
    $sub: "state",
    path: ["route"],
    args: { state: "parse_URL(href)" }
  },
  {
    $sub: "pushstate",
    args: { state: "parse_URL(href)" }
  },
  {
    $sub: "FLIP",
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
// prettier-ignore
/**
 * string_type:
 * just a little convenience function
 * takes some value and returns a string representation of its type
 * this makes it easier to create a switch statement using types
 * */
export const type_str = x => {
  if (isArray(x))                       return "ARRAY"
  if (isObject(x))                      return "OBJECT"
  if (isFunction(x) && x.length === 0)  return "THUNK"
  if (isFunction(x) && x.length > 0)    return "FUNCTION"
  if (isPromise(x))                     return "PROMISE"
  if (isString(x))                      return "STRING"
  if (isNull(x))                        return "NULL"
                                        return "type_str NOT FOUND"
}

/**
 * Stream Architecture:
 *   #
 * -<0>- |ps|---c---------------c--[ a, b, a ]-a----c---> ctx.run.next() calls
 * -<1>- |ps|---1---------------1------------0-1----1---> run: pubsub({ topic: x => x.length === 0 })
 * -<3>- ---|tp|xf|---------☑-☑----------☑---⬆----------> false -> tasks: reduce [ Promise.resolve({}) ]
 * -<2>- ---|tp|--|mg|------*-*-*--------*-----*----*---> true -> execs:
 * -<4>- ---------|ps|------a-b-c--------a-----a----c---> command: pubsub({ topic: x => x.sub })
 * `defHandler`s - framework:
 * -<"state">- ---|ps|----------------------------------> subscribeTopic("state")
 * -<"route">- ---|ps|----------------------------------> subscribeTopic("route")
 * -<"FLIP">- ----|ps|----------------------------------> subscribeTopic("FLIP")
 * `defHandler`s - userl-----and:
 * -<a>- ---------|ps|--------*-----*----------*--------> subscribeTopic(a)
 * -<b>- ---------|ps|----------*-----------------------> subscribeTopic(b)
 * -<c>- ---------|ps|------------*-----------------*---> subscribeTopic(c)
 *
 * NOTES:
 * - add `beforeunload` event handler within #4 (orphan): SEE https://youtu.be/QQukWZcIptM
 * - enable ctx.run.cancel() via external or internal events (e.g., popstate / { $sub:  "cancel" })
 *
 * -<1>-
 * `run`:
 * - root event stream (exposed via `ctx`)
 * - bisects to either:
 *  1. execs stream -<3>- (if single event object) or
 *  2. tasks stream -<4>- (if array of event objects)
 * */
export const run = pubsub({ topic: x => x.length === 0, id: "run_stream" })
/**
 * -<2>-
 * `execs`:
 * - singleton event stream
 * */
const execs = run.subscribeTopic(true).subscribe(trace("execs ->"))

/**
 * matcher:
 * a @thi.ng/associative.EquivMap that:
 * enables dispatching to different functions based on type_str set objects
 * @example:
 *
 *
 * */

/**
 * reducer:
 * - a small finite state machine
 * - batches up a collection of events
 * - resolves any promises contained within an event before moving onto the next
 * - passes an accumulator (local state) between invocations of each event that:
 *  - is passed to any key in the object with a function value that takes arguments (not thunks)
 *  - can be used as a storage container for events that are waiting in the queue
 *  - can be manipulated by the current event
 *
 * internal dispatching functions:
 * - resolving promises:
 *  - every element in the array/collection is trea
 * - emission back to mainstream `run` function:
 *  - there are three ways that the internal dispatcher can
 *    1. any thunks are assumed to be aliases for dispatching run.next(return value of thunk)
 *    2. any $sub: "refer" events are dispatched to the mainstream
 *    3. any $sub: "cancel" events dispatch a run.cancel() event to the mainstream to cancel any pending events
 * */

/*
let test_fn1 = x => ({ x })
isObject(test_fn1("a"))
let testicle = async () => {
  let test_err = await Promise.resolve(new Error("ERROR")).catch(e => `big ol' error: ${e}`)
  if (test_err instanceof Error) return `instanceof error: ${test_err}`
  return `no error: ${test_err}`
}
testicle()
*/
export const reducer = todos => {
  return todos.reduce(async (a, c, i, d) => {
    const acc = await a
    // console.log(acc)
    if (isFunction(c)) {
      let recur = c(acc)
      return reducer(recur)
    }
    // const remaining = d.length - (i + 1)
    const { $sub, args, path, reso, erro, ...unknown } = c //🤔 ($sub = "")

    //
    //  888                /
    //  888  e88~-_  e88~88e
    //  888 d888   i 888 888
    //  888 8888   | "88_88"
    //  888 Y888   '  /
    //  888  "88_-~  Cb
    //                Y8""8D
    //
    const idx_dict0 =
      i > 2
        ? Array.from(Array(20).keys()).reduce((a, c, i, d) => ({ ...a, [c]: `${c}th` }), {})
        : []
    const idx_dict = { 0: "First", 1: "Second", 2: "Third", ...idx_dict0 }
    const idx_str = idx_dict[i]

    if (Object.keys(unknown).length > 0)
      throw new Error(`
  🔥 there's some kind of typo in one of your command keys... 
  🔥 you may have forgotten to provide a required key 
  🔥 or perhaps you misspelled one? It's ok 💙 
  🔥 ${
    Object.keys(unknown)[0]
      ? `
  🔥 I did find an unrecognized entry :

  ${JSON.stringify(unknown).substring(1, JSON.stringify(unknown).length - 1)}
  `
      : ""
  }  
  here are some parts of the command wherewith it was found: 
  
  🤔 ${JSON.stringify(c, null, 2)} 🤔

  it was the ___${"_" + idx_str + "_"}___ in its collection
  within the command you just executed (or nested therein)
  
  Hope that helps!


  PS: I can't see entries with function values
  `)

    //
    //                           888
    //   e88~~8e  888-~88e  e88~\888
    //  d888  88b 888  888 d888  888
    //  8888__888 888  888 8888  888
    //  Y888    , 888  888 Y888  888
    //   "88___/  888  888  "88_/888
    //
    //

    let arg_type = type_str(args)
    // if just data, pass it through...
    let result = args

    // arg handlers by type
    if (arg_type === "STRING") {
      execs.next({ $sub, args: result })
      return acc
    }
    if (arg_type === "FUNCTION") {
      // acc
      let temp = args(acc)
      result = isPromise(temp) ? await temp.catch(e => e) : temp
    }
    if (arg_type === "THUNK") {
      result = args()
      execs.next({ $sub, args: result }) // 🏃
      return acc
    }
    // result handlers
    if (erro && result instanceof Error) {
      console.warn("error in Promise within reducer")
      let error = erro(acc, result)
      if (error.$sub) return execs.next(error) // 🏃 consider `throw`
      throw new Error(error)
    }
    if (reso && !(result instanceof Error)) {
      let resolved = reso(acc, result)
      if (resolved.$sub) {
        execs.next(resolved)
        return { acc, ...resolved }
      }
      return { ...acc, ...resolved }
    }
    if (path && !(result instanceof Error)) {
      execs.next({ $sub, path, args: result })
      return { ...acc, ...result }
    }
    if (result instanceof Error) {
      console.warn("error in reducer:", result)
      throw new Error(result)
    }

    execs.next({ $sub, args: result })
    return { ...acc, ...result }
    // if (remaining < 1)

    // dispatch to pubsub -<5>- orders stream
  }, Promise.resolve({}))
}

let testy_testicle = async () => await reducer(testicular)
testy_testicle() //?
/**
 * -<3>-
 * `tasks`:
 * - collection event stream
 * */
const tasks = run.subscribeTopic(false).transform(map(todos => reducer(todos)))

// const run = stream()
// run
//   .transform(xfsm())
//   .subscribe(resolve())
//   // .subscribe(scan())
//   .subscribe(trace("run"))

let arr1 = [1, 2, 3]
let something = arr1.shift()
// something
// arr1
// isPromise(fetch("something"))
// isPromise(() => fetch("something"))

let test_array1 = [1, Promise.resolve("B"), 3]
// async reduce
/*
test_array1.reduce(async (a, c, i) => {
  let acc = await a
  let res
  if (isPromise(c)) res = await c
  else res = c
  // dispatch to pubsub -<5>- orders stream
  await setTimeout(() => console.log("waited for 3 secs for: ", res), 3000)
  return { ...acc, [i]: res }
}, Promise.resolve({}))
*/
// let resolver = config => async (sub, arg) => {
//   config = { ...obj_str_keyer, config }
//   let state = { state: "init" }
//   let is_fn = isFunction(arg)
//   let prms_arg = isPromise(arg)
//   let referral = is_fn && arg.length === 0
//   let use_state = is_fn && arg.length > 0 && args(state)
//   let sub_promise = x => x === "promise"
//   let isFn0 = x => isFunction(x) && x.length === 0
//   let isFn = x => isFunction(x) && x.length > 0

//   switch (sub) {
//     case "promise":
//       if (prms_arg) {
//         let val = await arg
//         state = { ...state, new: "new stuff" }
//       }
//       if (fn_arg) {
//         let val = await args()
//         state = { ...state, new: "new stuff" }
//       }
//       // do side-effects and return accumulated state for `scan`
//       return state
//     default:
//       "I got nothin'"
//   }
// }

//
//    88~\             d8           888
//  _888__  e88~~8e  _d88__  e88~~\ 888-~88e
//   888   d888  88b  888   d888    888  888
//   888   8888__888  888   8888    888  888
//   888   Y888    ,  888   Y888    888  888
//   888    "88___/   "88_/  "88__/ 888  888
//
// 🔥 https://developer.mozilla.org/en-US/docs/Web/API/AbortController
