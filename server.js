const http = require("http")
const { PORT = 3000, UP_STAGE } = process.env
const { dispatch_w_config } = require("./hurl")

const server = http.createServer()
const log = console.log

server.listen(PORT, e => {
  if (e) return log("Error:", e)
  log(`server is listening on ${PORT}...`)
})

server.on("request", async (req, res) => {
  if (req.url === "/favicon.ico") log("no favicon yet, 😞")

  log("PORT:", PORT)

  res.end(dispatch_w_config(req.url))
})
