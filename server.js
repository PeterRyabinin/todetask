const express = require("express")
const cors  = require("cors")

const app = express()

const port = 3000

app.use(cors())

app.get("/", (req, res)=>{
    res.send("<h1>Server work</h1>")
})

app.listen(port, ()=>{
    console.log(`http://127.0.0.1:${port}`)
})