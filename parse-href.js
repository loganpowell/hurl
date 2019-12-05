import qs from "querystring"

let hrefs = [
  "https://api.census.gov/data.html",
  "https://api.census.gov/data/2017/acs/acs1?query=some%20text",
  "https://census.gov/developers/apis#getting-started",
  "https://census.gov/developers/apis/?slash=true",
  "https://www.census.gov/developers/apis/?slash=true#focus",
  "https://www.census.gov/developers/apis/#focus?slash=true",
  "https://www.census.gov/developers/apis#focus?slash=false",
  "http://www.example.com/path/to/resource?query=text&search=find+me#focus-heading"
]

const log = console.log

export const parse_href = href => {
  let parts = href.split(/(?=\?)|(?=#)/g)
  let path_str = parts[0]
  let query_str = parts.filter(part => part.slice(0, 1) === "?")[0] || ""
  let hash_str = parts.filter(part => part.slice(0, 1) === "#")[0] || ""
  let full_path = path_str.split("/").filter(x => x !== "")
  let domain = full_path[1].split(".")
  let path = full_path.slice(2)
  let query = qs.parse(query_str.slice(1))
  let hash = hash_str.slice(1)
  return { path, query, hash, domain }
}

let all = hrefs.map(x => parse_href(x)) //?

let test = all.slice(-1)[0]

qs.encode(test.query).replace("%20", "+") //?
