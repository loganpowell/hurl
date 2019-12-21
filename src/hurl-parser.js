import qs from "querystring"

export const parse_hurl = URL => {
  let subdomain = []
  let domain = []
  let path = []
  const parts = URL.split(/(?=\?)|(?=#)/g)
  const query_str = parts.filter(part => part.slice(0, 1) === "?")[0] || ""
  const query = qs.parse(query_str.slice(1))
  const hash_str = parts.filter(part => part.slice(0, 1) === "#")[0] || ""
  const hash = hash_str.slice(1)
  const path_str = parts[0]
  const full_path = path_str.split("/").filter(x => x !== "") //?
  if (/http/g.test(URL)) {
    domain = full_path[1].split(".").slice(-2)
    subdomain = full_path[1].split(".").slice(0, -2)
    path = full_path.slice(2) //?
  } else {
    path = full_path
  }
  return { subdomain, domain, path, query, hash }
}
