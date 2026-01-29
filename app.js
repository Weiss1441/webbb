// app.js

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_NAME = 'shop';
const COLLECTION_NAME = 'products';
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

let db;

// --- Middleware ---
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
app.use(express.json());

// --- Routes ---
app.get('/', (req, res) => {
    res.send(`
        <h1>Practice Task 10 API</h1>
        <p>Endpoints:</p>
        <ul>
            <li>GET /api/products (with query parameters: category, minPrice, sort, fields)</li>
            <li>GET /api/products/:id</li>
            <li>POST /api/products</li>
        </ul>
    `);
});

app.get('/api/products', async (req, res) => {
    try {
        const { category, minPrice, sort, fields } = req.query;
        const filter = {};
        if (category) filter.category = category;
        if (minPrice) filter.price = { $gte: parseFloat(minPrice) };

        let projection = {};
        if (fields) {
            fields.split(',').forEach(f => { projection[f.trim()] = 1; });
        }

        let sortOption = {};
        if (sort === 'price') sortOption.price = 1;

        const products = await db.collection(COLLECTION_NAME)
            .find(filter)
            .project(Object.keys(projection).length ? projection : {})
            .sort(Object.keys(sortOption).length ? sortOption : {})
            .toArray();

        res.status(200).json({ count: products.length, products });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid product ID' });

    try {
        const product = await db.collection(COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/products', async (req, res) => {
    const { name, price, category } = req.body;
    if (!name || !price || !category) return res.status(400).json({ error: 'Missing required fields' });
    if (typeof name !== 'string' || typeof category !== 'string' || typeof price !== 'number')
        return res.status(400).json({ error: 'Invalid data types' });

    try {
        const newProduct = { name, price, category };
        const result = await db.collection(COLLECTION_NAME).insertOne(newProduct);
        res.status(201).json({ message: 'Product created successfully', productId: result.insertedId, product: newProduct });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.use((req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// --- Start server ---
async function main() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        console.log(`Connected to MongoDB database: ${DB_NAME}`);

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
        process.exit(1);
    }
}

main();