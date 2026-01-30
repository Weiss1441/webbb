const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();

// ===== ENV =====
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URI;

// ===== MIDDLEWARE =====
app.use(express.json());

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// ===== DB =====
let items = null;

// 🔒 блокируем API, пока БД не готова (ВАЖНО для Render)
app.use("/api", (req, res, next) => {
  if (!items) {
    return res.status(503).json({ error: "Database not ready" });
  }
  next();
});

// ===== START SERVER =====
async function start() {
  try {
    const client = await MongoClient.connect(MONGO_URL);
    console.log("MongoDB connected");

    const db = client.db("shop");

    // коллекция создаётся автоматически при первом insert
    items = db.collection("items");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
}

start();

// ===== ROUTES =====

// HTML (оставляем по заданию)
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Practice Task 13</title>
      </head>
      <body>
        <h1>REST API – Items</h1>
        <p><b>GET</b> /api/items</p>
        <p><b>GET</b> /api/items/:id</p>
        <p><b>POST</b> /api/items</p>
        <p><b>PUT</b> /api/items/:id</p>
        <p><b>PATCH</b> /api/items/:id</p>
        <p><b>DELETE</b> /api/items/:id</p>
      </body>
    </html>
  `);
});

// ======================
// REST API — ITEMS
// ======================

// GET all
app.get("/api/items", async (req, res) => {
  try {
    const list = await items.find().toArray();
    res.status(200).json(list);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// GET by id
app.get("/api/items/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  try {
    const item = await items.findOne({ _id: new ObjectId(id) });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.status(200).json(item);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// POST create
app.post("/api/items", async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const result = await items.insertOne({
      name,
      description: description || "",
      createdAt: new Date(),
    });

    res.status(201).json({
      id: result.insertedId,
      message: "Item created",
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// PUT full update
app.put("/api/items/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const result = await items.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, description: description || "" } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.status(200).json({ message: "Item updated" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH partial update
app.patch("/api/items/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    const result = await items.updateOne(
      { _id: new ObjectId(id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.status(200).json({ message: "Item updated" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE
app.delete("/api/items/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  try {
    const result = await items.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ===== 404 =====
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});
