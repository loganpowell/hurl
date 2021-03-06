import qs from "querystring"

/**
 * An object that contains the semantic parts of a URL
 * in a neat little package
 * @typedef {object} URLComponentsObject
 * @property {string} URL  The URL supplied
 * @property {Array} subdomain  The subdomain if any
 * @property {Array} domain  The domain if any
 * @property {Array} path  The path if any
 * @property {Object} query  Query components if any
 * @property {string} hash  Any hash within the URL
 **/
/**
 * # HREF/URL Parser
 *
 * Takes an href (full or relative) and pulls out the various
 * components to be used for instrumentation of various
 * high-level event handling.
 *
 * ## Examples:
 *
 * ```js
 *
 * parse_href("http://localhost:1234/about?get=some#today")
 * res = {
 *   URL: "http://localhost:1234/about?get=some#today",
 *   subdomain: [],
 *   domain: ["localhost:1234"],
 *   path: ["about"],
 *   query: { get: "some" },
 *   hash: "today"
 * }
 *
 * parse_href("https://github.com/thi-ng/umbrella/#blog-posts")
 * res = {
 *   URL: 'https://github.com/thi-ng/umbrella/#blog-posts',
 *   subdomain: [],
 *   domain: ["github", "com"],
 *   path: ["thi-ng", "umbrella"],
 *   query: {},
 *   hash: "blog-posts"
 * }
 *
 * parse_href("https://very-long-sub.dom.cloud.eu/site/my/happy/")
 * res = {
 *   URL: 'https://very-long-sub.dom.cloud.eu/site/my/happy/',
 *   subdomain: ["very-long-sub", "dom"],
 *   domain: ["cloud", "eu"],
 *   path: ["site", "my", "happy"],
 *   query: {},
 *   hash: ""
 * }
 *
 * parse_href("https://api.census.gov/data?get=NAME&in=state:01&in=county:*")
 * res = {
 *   URL: "https://api.census.gov/data?get=NAME&in=state:01&in=county:*",
 *   subdomain: ["api"],
 *   domain: ["census", "gov"],
 *   path: ["data"],
 *   query: { get: "NAME", in: ["state:01", "county:*"] },
 *   hash: ""
 * }
 *
 * parse_href("/data?get=NAME&in=state#indeed")
 * res = {
 *   URL: "/data?get=NAME&in=state#indeed",
 *   subdomain: [],
 *   domain: [],
 *   path: ["data"],
 *   query: { get: "NAME", in: "state" },
 *   hash: "indeed"
 * }
 * ```
 * @param {string} URL - full or partial URL/href
 *
 * @returns {URLComponentsObject} The URL parsed into its semantic parts
 * */
export const parse_href = URL => {
  let subdomain = []
  let domain = []
  let path = []
  // split the path on any `?` and/or `#` chars (1-3 parts)
  const parts = URL.split(/(?=\?)|(?=#)/g) //?
  // take the first component of split: the core URL
  const path_str = parts[0]
  // split the path_str further into individual members and
  // remove the empty string between any adjacent slashes `//`
  const full_path = path_str.split("/").filter(x => x !== "") //?
  if (/http/i.test(URL)) {
    // if the input URL is HTTP(S), partition into sub components
    // domain is the last two members of the 2nd component
    domain = full_path[1].split(".").slice(-2)
    // subdomain is anything before the domain
    // see https://stackoverflow.com/a/56921347
    // for mocking subdomain on localhost
    subdomain = full_path[1].split(".").slice(0, -2)
    // path is the last component in the
    path = full_path.slice(2)
  } else {
    // in the case of a relative URL `<a href="/about">
    // the relative path is the full path
    path = full_path
  }
  // pull out the query component as a string
  const query_str = parts.filter(part => part.slice(0, 1) === "?")[0] || ""
  // pull out the hash component as a string
  const hash_str = parts.filter(part => part.slice(0, 1) === "#")[0] || ""
  // parse the query string into conventional parts using qs
  const query = qs.parse(query_str.slice(1))
  // remove the actual `#` hash character from the string
  const hash = hash_str.slice(1)
  return { URL, subdomain, domain, path, query, hash }
}
