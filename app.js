const express = require("express")
const app = express()
app.use((req,res,next)=>{
    console.log(${req.method}${req.url})
    next()
})
app.use(express.json())
const {MongoClient,ObjectId} = require("mongodb")
require("dotenv").config()

const PORT = process.env.PORT || 3000
const MONGO_URL = process.env.MONGO_URL 

let products
MongoClient.connect(MONGO_URL).then(
    client=>{
        console.log("MongoDB connected")
        const db = client.db("shop")
        products = db.collection("products")
        app.listen(PORT,()=>console.log("Server running on port http://localhost:3000"))
    }
)

app.get("/",(req,res)=>{
    res.status(200).send(`
        <html>
            <head>
                <title>Practice task 9-10</title>
            </head>
            <body>
                <h1>
                    Links
                </h1>
                <h3>
                    <a href="/api/products">/api/products</a><br>
                    <a href="/api/products/697067d9a294db2300eab1d3">/api/products/1</a>
                </h3>
            </body>
        </html>
        `)
})

app.get("/version",(req,res)=>{
  res.json({
    version:"1.1",
    updateAt:"2026-01-28."
  })
})

app.get("/api/products", async (req,res)=>{
  const { category, minPrice, sort, fields } = req.query

  let filter = {}
  if (category) {
    filter.category = category
  }

  if (minPrice) {
    const min_price = Number(minPrice)
    if (isNaN(min_price)) {
      return res.status(400).json({
        error: "Invalid minPrice",
      });
    }
    filter.price = { $gte: min_price }
  }

  let sorting = {};
  if (sort) {
    if (sort === "price") {
      sorting.price = 1;
    } else if (sort === "priceDesc") {
      sorting.price = -1;
    } else {
      return res.status(400).json({
        error: "Invalid sort value",
      });
    }
  }

  let chosen_fields = {}
  if (fields) {
    const displaying_fields = fields.split(",")
    for (let i = 0; i < displaying_fields.length; i++) {
      let field = displaying_fields[i]
      chosen_fields[field] = 1
    }
  }

  try {
    let filtered_products = products.find(filter)

    if (Object.keys(sorting).length > 0) {
      filtered_products = filtered_products.sort(sorting)
    }

    if (Object.keys(chosen_fields).length > 0) {
      filtered_products = filtered_products.project(chosen_fields)
    }

    const list = await filtered_products.toArray()

    res.status(200).json({
        count: list.length,
        products: list,
    })
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }  

})

app.get("/api/products/:id", async (req,res)=>{
    const product_id = req.params.id
    if(!ObjectId.isValid(product_id)){
        return res.status(400).json({
            error:"Invalid id"
        })
    }
    const product = await products.findOne({_id: new ObjectId(product_id)})
    if (!product){
        return res.status(404).json({
            error:"Product not found"
        })
    }
    res.status(200).json(product)
})

app.post("/api/products",async(req,res)=>{
    const {name,price,category} = req.body
    if (!name  typeof price !== "number"  !category){
        return res.status(400).json({
            error:"Missing or invalid fields"
        })
    }
    await products.insertOne({name,price,category})
    res.status(201).json({
        message:"Product created"
    })
})

app.use((req,res)=>{
    return res.status(404).json({
        error:"Page not found"
    })
})