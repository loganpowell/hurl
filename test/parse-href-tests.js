import { parse_href } from "../src/hurl-parser"
import fetch from "node-fetch"

// fetch("https://lirc1bvijj.execute-api.us-east-1.amazonaws.com/staging/todos/2").then(r => r.json()) //?
fetch(
  "https://lirc1bvijj.execute-api.us-east-1.amazonaws.com/staging/todos"
).then(r => r.json()) //?

const log = console.log

let hrefs = [
  "https://api.census.gov/data.html",
  "https://api.census.gov/data/2017/acs/acs1?query=some%20text",
  "https://census.gov/developers/apis#getting-started",
  "https://census.gov/developers/apis/?slash=true",
  "https://www.census.gov/developers/apis/?slash=true#focus",
  "https://www.census.gov/developers/apis/#focus?slash=true",
  "https://app.www.census.gov/developers/apis#focus?slash=false",
  "http://www.example.com/path/to/resource?query=text&search=find+me#focus-heading",
  "http://api.localhost:1234/todos/2",
  "/data.html",
  "/data/2017/acs/acs1?query=some%20text",
  "/developers/apis#getting-started",
  "/developers/apis/?slash=true",
  "/developers/apis/?slash=true#focus",
  "/developers/apis/#focus?slash=true",
  "/developers/apis#focus?slash=false",
  "/path/to/resource?query=text&search=find+me#focus-heading",
  "/todos/2"
]

console.time("start")
let all = hrefs.map(x => parse_href(x)) //?

let test = all.slice(-1)[0]
console.timeEnd("start")

qs.encode(test.query).replace("%20", "+") //?

fetch("http://api.example.localhost:1234/users/2", {
  headers: { "Content-Type": "application/json" }
}).then(r => r.text()) //?
