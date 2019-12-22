import {
  isObject,
  isArray,
  isFunction,
  isPromise,
  isString,
  isNull
} from "@thi.ng/checks"
import { map } from "@thi.ng/transducers"
import { pubsub } from "@thi.ng/rstream"

// prettier-ignore
/**
 * string_type:
 * just a little convenience function
 * takes some value and returns a string representation of its type
 * this makes it easier to create a switch statement using types
 * */
export const type_str = x => {
  if (isArray(x))                       return "ARRAY"
  if (isFunction(x) && x.length === 0)  return "THUNK"
  if (isFunction(x) && x.length > 0)    return "FUNCTION"
  if (isPromise(x))                     return "PROMISE"
  if (isString(x))                      return "STRING"
  if (isNull(x))                        return "NULL"
  if (isObject(x))                      return "OBJECT"
                                        return "type_str NOT FOUND"
}

/**
 * # Stream Architecture:
 *
 * `run$` is the primary event stream exposed to the user
 * via the `ctx` object injected into every `hdom` component
 * the command stream is the only way the user changes
 * anything in `hurl`
 *
 * ## Marble Diagram
 * ```
 * 0>- |ps|---c-------c--[ a, b, a ]-a----c---> : run$
 * 1>- |ps|---1-------1------------0-1----1---> : pubsub
 * 2>- ---|tp|xf|-!-!------------!-?----------> : task$
 * 3>- ---|tp|----*-*-*----------*---*----*---> : command$
 * 4>- ------|ps|-a-b-c----------a---a----c---> : pubsub
 * Handlers:
 * a>- ------|ps|-*------------*-----*-------->
 * b>- ------|ps|---*------------------------->
 * c>- ------|ps|-----*-------------------*--->
 * ```
 * ## Streams
 * - `0>-`: `ctx.run.next(x)` calls
 * - `1>-`: `pubsub({ topic: x => x.length === 0 })`
 * - `2>-`: `false` -> `task$`: Task Dispatcher
 * - `3>-`: `true` -> `command$`: Commands stream
 * - `4>-`: `pubsub({ topic: x => x.sub })`
 *
 * ## Handlers
 * `4>-` this is the stream to which the user (and framework)
 * attaches handlers. Handlers receive events they subscribe
 * to as topics based on a `sub$` key in a Command object.
 *
 * ### Handlers (framework provided):
 * - "state": Global state mutations
 * - "route": Routing
 * - "FLIP" : F.L.I.P. animations
 *
 *
 * 📌 TODO:
 * - add `beforeunload` event handler within #4 (orphan):
 *    SEE https://youtu.be/QQukWZcIptM
 * - enable ctx.run.cancel() via external or internal events
 *    (e.g., popstate / { sub$:  "cancel" })
 *
 * ## `run$` stream
 * - `1>-`: root event stream (exposed via `ctx`)
 * - bisects (based on whether or not the payload is an array)
 *   to _either_:
 *
 * ### `task$` stream
 * - `2>-`: stream (if array of event objects)
 *
 * ### `command$` stream
 * - `3>-`: stream (if single event object)
 *   (see `dispatcher` for more details on #2 below)
 *
 * */
export const run$ = pubsub({ topic: x => x.length === 0, id: "run_stream" })
/**
 * # `command$` stream
 *
 * `3>-`: stream (if single event object)
 *
 *
 * */
export const command$ = run$.subscribeTopic(true)

/**
 * just a helpful warning for the probable case of a user
 * misspelling one or more of a command's accepted keys
 * */
const unknown_key = (c, i, unknown) => {
  const idx_dict0 =
    i > 2
      ? Array.from(Array(18).keys()).reduce(
          (a, c) => ({ ...a, [c]: `_${c}th_` }),
          {}
        )
      : []
  const idx_dict = { 0: "First", 1: "Second", 2: "Third", ...idx_dict0 }
  const idx_str = idx_dict[i]
  const UFO = JSON.stringify(unknown)
  return `
  🔥 Found an unrecognized Command key...${
    Object.keys(unknown)[0]
      ? `
  🔥 It was the __${idx_str}__ member of a Task or Subtask.
  🔥 The entry -< ${UFO.substring(1, UFO.length - 1)}`
      : ""
  } >- was found with:
  🤔 ${JSON.stringify(c, null, 2)} 🤔

  The acceptable are: 
  - sub$: String
  - args: Any
  - path?: Array | String
  - reso?: Function
  - erro?: Function
  
  Hope that helps!

  PS: I can't see entries w/function values.
  `
}
/**
 * # Task Dispatcher
 * Async `reduce` function
 *
 * ## TL;DR:
 * Handles any state updates and/or other effects which
 * require _ordered_ choreography
 *
 * ## Synopsis:
 * - very simple async finite state machine.
 * - Commands are composed in-situ in userland (Ad hoc)
 * - spools a collection of Commands as a Task
 * - resolves any promises contained within a Command
 * - passes an accumulator (STATE) to subsequent Commands in
 *   a Task
 *
 * ## Type checks on function signatures
 * There are two valid forms for Task entries:
 * 1. a Unary function: alias/refer to sub Tasks
 * 2. A Command object: dispatch to Command stream
 *
 * ### Recognized Keys
 * There are 5 recognized keys for a Command object:
 * - `sub$`: String
 * - `args`: Any 🧐
 * - `path`: Array | String | Undefined
 * - `reso`: Function | Undefined
 * - `erro`: Function | Undefined
 *
 * `args` key = primary control structure
 * - non-function vals send the Command as-is
 * - `(0)=>` nullary fns send the _args_ as a Command
 * - `(1)=>` unary fns are passed the STATE and called
 * - Promises returned from fns are resolved
 * - new vals are merged with STATE (dupe keys overwrite)
 *
 * #### Promise-specific keys:
 * if `args` is/returns a Promise, these keys are used:
 * `reso` key = handle resolved promises (⚠ binary)
 * - `(2)=>` MUST be a binary `(STATE, resolved Promise) =>`
 * `erro` key = handle rejected promises (⚠ binary)
 * - `(2)=>` MUST be binary `(STATE, Promise rejection) =>`
 *
 * ## Subtasks:
 * Subtasks are the way you compose tasks. Insert a Task and
 * the dispatcher will unpack it in place
 * (super -> sub order preserved)
 * A Subtask must be defined as a unary function that
 * accepts a state object and returns a Task, e.g.:
 *
 * ```js
 * // pseudo:
 * let someSubtask = state => [{C}, {C}, (S)=>[...], ...]
 * // { C: Command }
 * // ( S: STATE ) => [...]: Subtask
 * ```
 *
 * ## Caveat:
 * The dispatcher preserves execution order of Commands
 * within a Task, but doesn't do anything to prevent
 * Commands sent directly to the Command stream - while the
 * Task is spooling - from being executed during the
 * execution of the Commands in the Task queue.
 *
 * */
export const dispatcher = todos =>
  todos.reduce(async (a, c, i) => {
    const acc = await a
    // console.log(acc)
    if (isFunction(c)) {
      let recur = c(acc)
      return dispatcher(recur)
    }
    const { sub$, args, path, reso, erro, ...unknown } = c //🤔 (sub$ = "")
    if (Object.keys(unknown).length > 0)
      throw new Error(unknown_key(c, i, unknown))
    let arg_type = type_str(args)
    let result = args

    // arg handlers by type
    if (arg_type === "STRING") {
      command$.next({ sub$, args: result })
      return acc
    }
    if (arg_type === "FUNCTION") {
      let temp = args(acc)
      result = isPromise(temp) ? await temp.catch(e => e) : temp
    }
    if (arg_type === "THUNK") {
      result = args()
      command$.next({ sub$, args: result }) // 🏃
      return acc
    }

    // result handlers
    if (erro && result instanceof Error) {
      console.warn("error in Promise within reducer")
      let error = erro(acc, result)
      if (error.sub$) return command$.next(error) // 🏃
      throw new Error(error)
    }
    if (reso && !(result instanceof Error)) {
      let resolved = reso(acc, result)
      if (resolved.sub$) {
        command$.next(resolved) // 🏃
        return { ...acc, ...resolved }
      }
      return { ...acc, ...resolved }
    }
    if (path && !(result instanceof Error)) {
      command$.next({ sub$, path, args: result }) // 🏃
      return { ...acc, ...result }
    }
    if (result instanceof Error) {
      console.warn("error in reducer:", result)
      throw new Error(result)
    }
    // if the result has made it this far, send it along as is
    command$.next({ sub$, args: result }) // 🏃
    return { ...acc, ...result }
  }, Promise.resolve({}))

/**
 * # `task$` stream
 *
 * `2>-`: stream (if array of event objects)
 *
 * */
export const task$ = run$
  .subscribeTopic(false)
  .transform(map(todos => dispatcher(todos)))

//
//    88~\             d8           888
//  _888__  e88~~8e  _d88__  e88~~\ 888-~88e
//   888   d888  88b  888   d888    888  888
//   888   8888__888  888   8888    888  888
//   888   Y888    ,  888   Y888    888  888
//   888    "88___/   "88_/  "88__/ 888  888
//
// 🔥 https://developer.mozilla.org/en-US/docs/Web/API/AbortController
