import fetch from "node-fetch"

fetch("http://localhost:1234/todos/2").then(r => r.text()) //?
