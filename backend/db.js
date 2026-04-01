// backend/db.js
const { nanoid } = require('nanoid');

// ========== БАЗА ДАННЫХ (in-memory) ==========
let users = [];
let refreshTokens = new Set();

// ========== ТВОИ ТОВАРЫ ==========
let products = [
    { id: nanoid(6), name: 'Загородних Николай Анатольевич', category: 'NFT', description: 'Не ругайтесь', price: 'бесценно', stock: 1, image: 'img1.jpg' },
    { id: nanoid(6), name: 'Никитос', category: 'NFT', description: 'Легенда', price: 777777777777, stock: 1, image: 'img2.jpg' },
    { id: nanoid(6), name: 'Саша', category: 'NFT', description: '❤', price: '∞', stock: 1, image: 'img3.jpg' },
    { id: nanoid(6), name: 'Солнышко', category: 'NFT', description: 'Пусть будет каждый день светить', price: 999999999999999, stock: 1, image: 'img4.jpg' },
    { id: nanoid(6), name: 'Тучка', category: 'NFT', description: 'Не надо нам такого', price: 'даром', stock: 0, image: 'img5.jpg' },
    { id: nanoid(6), name: 'Цветочек', category: 'NFT', description: '', price: 89014619686, stock: 10, image: 'img6.jpg' },
];

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С USERS ==========
const findUserByEmail = (email) => users.find(u => u.email === email);
const findUserById = (id) => users.find(u => u.id === id);
const addUser = (user) => { users.push(user); return user; };
const getAllUsers = () => users.map(u => ({
    id: u.id,
    email: u.email,
    first_name: u.first_name,
    last_name: u.last_name,
    role: u.role,
    isBlocked: u.isBlocked
}));
const updateUser = (id, updates) => {
    const user = findUserById(id);
    if (!user) return null;
    Object.assign(user, updates);
    return user;
};
const blockUser = (id) => {
    const user = findUserById(id);
    if (!user) return null;
    user.isBlocked = true;
    return user;
};

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С PRODUCTS ==========
const getAllProducts = () => products;
const findProductById = (id) => products.find(p => p.id === id);
const addProduct = (product) => { products.push(product); return product; };
const updateProduct = (id, updates) => {
    const product = findProductById(id);
    if (!product) return null;
    Object.assign(product, updates);
    return product;
};
const deleteProduct = (id) => {
    const exists = products.some(p => p.id === id);
    if (!exists) return false;
    products = products.filter(p => p.id !== id);
    return true;
};

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С REFRESH TOKENS ==========
const addRefreshToken = (token) => refreshTokens.add(token);
const hasRefreshToken = (token) => refreshTokens.has(token);
const deleteRefreshToken = (token) => refreshTokens.delete(token);

module.exports = {
    // Users
    users,
    findUserByEmail,
    findUserById,
    addUser,
    getAllUsers,
    updateUser,
    blockUser,
    // Products
    products,
    getAllProducts,
    findProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    // Refresh tokens
    addRefreshToken,
    hasRefreshToken,
    deleteRefreshToken
};