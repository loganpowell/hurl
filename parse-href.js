import qs from "querystring"

import fetch from "node-fetch"

let hrefs = [
  "https://api.census.gov/data.html",
  "https://api.census.gov/data/2017/acs/acs1?query=some%20text",
  "https://census.gov/developers/apis#getting-started",
  "https://census.gov/developers/apis/?slash=true",
  "https://www.census.gov/developers/apis/?slash=true#focus",
  "https://www.census.gov/developers/apis/#focus?slash=true",
  "https://www.census.gov/developers/apis#focus?slash=false",
  "http://www.example.com/path/to/resource?query=text&search=find+me#focus-heading",
  "http://api.localhost:1234/todos/2"
]

export const parse_href = href => {
  const parts = href.split(/(?=\?)|(?=#)/g)
  const path_str = parts[0]
  const query_str = parts.filter(part => part.slice(0, 1) === "?")[0] || ""
  const query = qs.parse(query_str.slice(1))
  const hash_str = parts.filter(part => part.slice(0, 1) === "#")[0] || ""
  const hash = hash_str.slice(1)
  const full_path = path_str.split("/").filter(x => x !== "")
  const domain = full_path[1].split(".").slice(-2)
  const sub_domain = full_path[1].split(".").slice(0, -2)
  const path = full_path.slice(2)
  return { sub_domain, domain, path, query, hash }
}

console.time("start")
let all = hrefs.map(x => parse_href(x)) //?

let test = all.slice(-1)[0]
console.timeEnd("start")

qs.encode(test.query).replace("%20", "+") //?

fetch("http://api.example.localhost:1234/users/2", {
  headers: { "Content-Type": "application/json" }
}).then(r => r.text()) //?
