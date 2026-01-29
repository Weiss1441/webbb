// seed.js
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGO_URI;
const COLLECTION_NAME = 'products';

const products = [
    {
        _id: new ObjectId("697b4dea52290e814b30eb76"),
        name: "Apple iPhone 15",
        price: 1200,
        category: "Electronics"
    },
    {
        _id: new ObjectId("697b4e0952290e814b30eb77"),
        name: "Samsung Galaxy S23",
        price: 999,
        category: "Electronics"
    },
    {
        _id: new ObjectId("697b4e1052290e814b30eb78"),
        name: "Chocolate Cake",
        price: 15,
        category: "Food"
    }
];

async function seed() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db(); // база из URI
        const collection = db.collection(COLLECTION_NAME);

        // Вставляем продукты
        await collection.insertMany(products, { ordered: true });
        console.log('Products inserted successfully!');
        client.close();
    } catch (error) {
        console.error('Failed to insert products:', error);
    }
}

seed();
