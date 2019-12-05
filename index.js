import UR from "universal-router"

let link1 = Object.assign(document.createElement("a"), {
  href: "/something?query=just+for+looks",
  innerText: " bloop "
})
let link2 = Object.assign(document.createElement("a"), {
  href: "/somewhere/else?query=me&find=you#goto",
  innerText: "| bleep "
})
let link3 = Object.assign(document.createElement("a"), {
  href: "#goto",
  innerText: "| rel "
})
document.body.appendChild(link1)
document.body.appendChild(link2)
document.body.appendChild(link3)

const router = new UR([
  { path: "/one", action: () => "Page One" },
  { path: "/two", action: () => "Page Two" }
])

router.resolve({ pathname: "/one" }).then(result => console.log(result))
