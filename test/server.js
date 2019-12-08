import http from "http"
import { router } from "./router"
const { PORT = 3000, UP_STAGE } = process.env

const server = http.createServer()
const log = console.log

server.listen(PORT, e => {
  if (e) return log("Error:", e)
  log(`server is listening on ${PORT}...`)
})

server.on("request", async (req, res) => {
  if (req.url === "/favicon.ico") log("no favicon yet, 😞")

  log("PORT:", PORT)
  // log("request:", req) // -> url: '/',
  let data = await router(req.url)
  // log(data)
  res.end(JSON.stringify(data))
})
