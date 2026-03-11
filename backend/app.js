const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');

const app = express();
const PORT = 3000;

app.use(cors({ origin: 'http://localhost:3001' }));
app.use(express.json());

let products = [
    { id: nanoid(6), name: 'Загородних Николай Анатольевич', category: 'NFT', description: 'Не ругайтесь', price: 'беcценно', stock: 1, image: 'img1.jpg' },
    { id: nanoid(6), name: 'Никитос', category: 'NFT', description: 'Легенда', price: 777777777777, stock: 1, image: 'img2.jpg' },
    { id: nanoid(6), name: 'Саша', category: 'NFT', description: '❤', price: '∞', stock: 1, image: 'img3.jpg' },
    { id: nanoid(6), name: 'Солнышко', category: 'NFT', description: 'Пусть будет каждый день светить', price: 999999999999999, stock: 1, image: 'img4.jpg' },
    { id: nanoid(6), name: 'Тучка', category: 'NFT', description: 'Не надо нам такого', price: 'даром', stock: 0, image: 'img5.jpg' },
    { id: nanoid(6), name: 'Цветочек', category: 'NFT', description: '', price: 89014619686, stock: 10, image: 'img6.jpg' },
];

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.get('/api/products', (req, res) => {
    res.json(products);
});

app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    res.json(product);
});

app.post('/api/products', (req, res) => {
    const { name, category, description, price, stock } = req.body;

    if (!name || !category || !description || !price || !stock) {
    return res.status(400).json({ error: 'Все поля обязательны' });
    }

    const newProduct = {
        id: nanoid(6),
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        price: Number(price),
        stock: Number(stock)
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.patch('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });

    const { name, category, description, price, stock } = req.body;

    if (name) product.name = name.trim();
    if (category) product.category = category.trim();
    if (description) product.description = description.trim();
    if (price) product.price = Number(price);
    if (stock) product.stock = Number(stock);

    res.json(product);
});

app.delete('/api/products/:id', (req, res) => {
    const exists = products.some(p => p.id === req.params.id);
    if (!exists) return res.status(404).json({ error: 'Товар не найден' });

    products = products.filter(p => p.id !== req.params.id);
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log(`📦 Товаров в базе: ${products.length}`);
});