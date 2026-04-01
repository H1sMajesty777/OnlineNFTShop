const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');

// Импортируем базу данных
const db = require('./db');

const app = express();
const PORT = 3000;

// ========== НАСТРОЙКИ ==========
app.use(cors({ origin: 'http://localhost:3001' }));
app.use(express.json());

// ========== СЕКРЕТЫ ==========
const ACCESS_SECRET = 'access_secret_key_123';
const REFRESH_SECRET = 'refresh_secret_key_456';

// ========== ВРЕМЯ ЖИЗНИ ==========
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

// ========== ЛОГИРОВАНИЕ ==========
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ========== ФУНКЦИИ ТОКЕНОВ ==========
function generateAccessToken(user) {
    return jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
    );
}

// ========== MIDDLEWARE ==========
function authMiddleware(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    try {
        const payload = jwt.verify(token, ACCESS_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

function roleMiddleware(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied: insufficient permissions' });
        }
        next();
    };
}

// ========== AUTH ROUTES ==========

// Регистрация
app.post('/api/auth/register', async (req, res) => {
    const { email, password, first_name, last_name } = req.body;

    if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
        id: nanoid(8),
        email,
        first_name,
        last_name,
        hashedPassword,
        role: 'user',
        isBlocked: false
    };

    db.addUser(newUser);
    res.status(201).json({ id: newUser.id, email: newUser.email, first_name, last_name });
});

// Логин
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.isBlocked) {
        return res.status(403).json({ error: 'Account is blocked' });
    }

    const isValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    db.addRefreshToken(refreshToken);

    res.json({ accessToken, refreshToken });
});

// Обновление токенов
app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'refreshToken is required' });
    }

    if (!db.hasRefreshToken(refreshToken)) {
        return res.status(401).json({ error: 'Invalid refresh token' });
    }

    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = db.findUserById(payload.sub);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        db.deleteRefreshToken(refreshToken);
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        db.addRefreshToken(newRefreshToken);

        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
});

// Получить текущего пользователя
app.get('/api/auth/me', authMiddleware, (req, res) => {
    const user = db.findUserById(req.user.sub);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        isBlocked: user.isBlocked
    });
});

// ========== USER MANAGEMENT (только админ) ==========

app.get('/api/users', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    res.json(db.getAllUsers());
});

app.get('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const user = db.findUserById(req.params.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        isBlocked: user.isBlocked
    });
});

app.put('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const { first_name, last_name, role, isBlocked } = req.body;
    const updates = {};
    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;
    if (role !== undefined) updates.role = role;
    if (isBlocked !== undefined) updates.isBlocked = isBlocked;

    const updatedUser = db.updateUser(req.params.id, updates);
    if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        role: updatedUser.role,
        isBlocked: updatedUser.isBlocked
    });
});

app.delete('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const user = db.blockUser(req.params.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.status(204).send();
});

// ========== PRODUCTS ROUTES ==========

// Получить все товары (доступно всем)
app.get('/api/products', (req, res) => {
    res.json(db.getAllProducts());
});

// Получить товар по ID
app.get('/api/products/:id', (req, res) => {
    const product = db.findProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    res.json(product);
});

// Создать товар (продавец и админ)
app.post('/api/products', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
    const { name, category, description, price, stock, image } = req.body;

    if (!name || !category || !description || !price || !stock) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    const newProduct = {
        id: nanoid(6),
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        price: isNaN(Number(price)) ? price : Number(price),
        stock: Number(stock),
        image: image || null
    };

    const created = db.addProduct(newProduct);
    res.status(201).json(created);
});

// Обновить товар (продавец и админ)
app.patch('/api/products/:id', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
    const { name, category, description, price, stock, image } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (category !== undefined) updates.category = category.trim();
    if (description !== undefined) updates.description = description.trim();
    if (price !== undefined) updates.price = isNaN(Number(price)) ? price : Number(price);
    if (stock !== undefined) updates.stock = Number(stock);
    if (image !== undefined) updates.image = image;

    const updated = db.updateProduct(req.params.id, updates);
    if (!updated) return res.status(404).json({ error: 'Товар не найден' });
    res.json(updated);
});

// Удалить товар (только админ)
app.delete('/api/products/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const deleted = db.deleteProduct(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Товар не найден' });
    res.status(204).send();
});

// ========== СОЗДАЕМ АДМИНА ==========
const createAdmin = async () => {
    const existing = db.findUserByEmail('admin@test.com');
    if (!existing) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        db.addUser({
            id: nanoid(8),
            email: 'admin@test.com',
            first_name: 'Admin',
            last_name: 'Adminov',
            hashedPassword,
            role: 'admin',
            isBlocked: false
        });
        console.log('✅ Админ создан: admin@test.com / admin123');
    }
};
createAdmin();

// ========== ЗАПУСК ==========
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log(`📦 Товаров в базе: ${db.getAllProducts().length}`);
    console.log(`👥 Пользователей в базе: ${db.getAllUsers().length}`);
});