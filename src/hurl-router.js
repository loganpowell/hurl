import { stream } from "@thi.ng/rstream"
import { parse_hurl } from "./hurl-parser"
import { trigger_async_route } from "./hurl"
import { map } from "@thi.ng/transducers"
// import { log } from "./utils"
// import fetch from "node-fetch"

//
//  888                               _-~88e
//  888-~88e  e88~-_  Y88b    e    / /   88"
//  888  888 d888   i  Y88b  d8b  /  `   8P
//  888  888 8888   |   Y888/Y88b/       `
//  888  888 Y888   '    Y8/  Y8/      d88b
//  888  888  "88_-~      Y    Y       Y88P
//
//  do I generalize this if at all...

/**
 * raw data stream
 * you can subscribe to this and handle/inject events directly
 * the `hurl_data` prop should be destructured/plucked for data handling
 * see http://thi.ng/rstream for `stream` docs
 * */
export const hurl_data_stream = stream()
/**
 * preconfigured dispatch from hurl_data_stream
 * this is an event handler that subscribes to the
 * `hurl_data_stream` internally and applies a user-defined callback `fn`
 * to every emission of data from the stream
 * @example
 * */
export const hurl_dispatch = fn =>
  hurl_data_stream.subscribe(map(({ hurl_data }) => fn(hurl_data)))

/**
 * Takes a routing configuration function and returns a router that
 * recieves a stream of incomming URLs/ and applies the configuration
 * to each one. Once the data is resolved for the URL, dispatches to a
 * completion stream to actually triggers a change in the browser router
 * @requires http://thi.ng/EquivMap
 * @example
 * const getSomeJSON = async (query, path, b) => {
 *  const base = "https://jsonplaceholder.typicode.com/"
 *  const data = b
 *    ? await fetch(`${base}${path}/${b}`).then(r => r.json())
 *    : await fetch(`${base}${path}/`).then(r => r.json())
 *  return data
 *}
 *const routes = async state => {
 *  let {
 *    sub_domain,       // array
 *    domain,           // array
 *    path: [p_a, p_b], // array
 *    query,            // object
 *    hash              // string
 *  } = state
 *
 *  return await new EquivMap([
 *    [{ ...state, path: ["todos"] },      getSomeJSON(query, "todos")],
 *    [{ ...state, path: ["todos", p_b] }, getSomeJSON(query, "todos", p_b)],
 *    [{ ...state, path: ["users"] },      getSomeJSON(query, "users")],
 *    [{ ...state, path: ["users", p_b] }, getSomeJSON(query, "users", p_b)]
 *  ]).get(state)) || null
 *}
 *export const router = hurl_router(routes)
 * */
export const hurl_router = config_fn => async h => {
  const state = parse_hurl(h)
  // log("state:", state)
  let data = await config_fn(state)
  hurl_data_stream.next({ hurl_data: data })
  trigger_async_route(true)
}
