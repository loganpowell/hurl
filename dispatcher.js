import { parse_href } from "./parse-href"
import { EquivMap } from "@thi.ng/associative"
import fetch from "node-fetch"

const log = console.log

const getSomeJSON = async (query, path, b) => {
  const base = "https://jsonplaceholder.typicode.com/"
  const data = b
    ? await fetch(`${base}${path}/${b}`).then(r => r.json())
    : await fetch(`${base}${path}/`).then(r => r.json())
  return data
}
export const dispatch_w_config = async h => {
  const ph = parse_href
  const route_obj = ph(h)
  log(route_obj)
  const {
    sub_domain,
    domain,
    path: [a, b, c, d],
    query,
    hash
  } = route_obj
  // prettier-ignore
  const data = await new EquivMap([
      [{ ...ph(h), path: ["todos"] },    getSomeJSON(query, "todos", null)],
      [{ ...ph(h), path: ["todos", b] }, getSomeJSON(query, "todos", b)],
      [{ ...ph(h), path: ["users"] },    getSomeJSON(query, "users", null)],
      [{ ...ph(h), path: ["users", b] }, getSomeJSON(query, "users", b)]
    ]).get(route_obj) || null

  // this is used by importing dispatch_w_config into the server config.
  if (domain.length < 1) return data
  // this would be an hdom + spec -> page
  const el = document.createElement("code")
  el.innerText = JSON.stringify(data, null, 2)
  if (el !== "404") document.body.appendChild(el)
}
