const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();

// ===== ENV =====
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL;

// ===== MIDDLEWARE =====
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});
app.use(express.json());

// ===== DB =====
let products;

MongoClient.connect(MONGO_URL)
  .then((client) => {
    console.log("MongoDB connected");
    const db = client.db("shop");
    products = db.collection("products");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// ===== ROUTES =====

// HTML PAGE (вариант 2)
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Practice Task 11</title>
      </head>
      <body>
        <h1>Available API Routes</h1>

        <p><b>GET</b> /api/products</p>
        <p><b>GET</b> /api/products/:id</p>

        <p><b>POST</b> /api/products</p>
        <p><b>PUT</b> /api/products/:id</p>
        <p><b>DELETE</b> /api/products/:id</p>

        <p><b>GET</b> /version</p>
      </body>
    </html>
  `);
});


app.get("/api/products", async (req, res) => {
  try {
    const { category, minPrice, sort, fields } = req.query;

    let filter = {};
    if (category) filter.category = category;
    if (minPrice) filter.price = { $gte: Number(minPrice) };

    let sortOption = {};
    if (sort === "price") sortOption.price = 1;
    if (sort === "priceDesc") sortOption.price = -1;

    let projection = {};
    if (fields) {
      fields.split(",").forEach((f) => (projection[f.trim()] = 1));
    }

    let cursor = products.find(filter);

    if (Object.keys(sortOption).length) cursor = cursor.sort(sortOption);
    if (Object.keys(projection).length) cursor = cursor.project(projection);

    const list = await cursor.toArray();

    res.json({
      count: list.length,
      products: list,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const product = await products.findOne({ _id: new ObjectId(id) });
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.json(product);
});

app.post("/api/products", async (req, res) => {
  const { name, price, category } = req.body;

  if (!name || typeof price !== "number" || !category) {
    return res.status(400).json({ error: "Invalid data" });
  }

  await products.insertOne({ name, price, category });
  res.status(201).json({ message: "Product created" });
});

app.put("/api/products/:id", async (req, res) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const result = await products.updateOne(
    { _id: new ObjectId(id) },
    { $set: req.body }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.json({ message: "Product updated" });
});

app.delete("/api/products/:id", async (req, res) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const result = await products.deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.json({ message: "Product deleted" });
});

// ===== 404 =====
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});
