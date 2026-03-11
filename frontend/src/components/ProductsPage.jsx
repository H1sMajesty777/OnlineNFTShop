import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProductsPage.scss';

const API = 'http://localhost:3000/api';

function ProductsPage() {
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);
const [modalOpen, setModalOpen] = useState(false);
const [editingProduct, setEditingProduct] = useState(null);

useEffect(() => {
    loadProducts();
}, []);

const loadProducts = async () => {
    try {
    const response = await axios.get(`${API}/products`);
    setProducts(response.data);
    } catch (error) {
    console.error('Ошибка загрузки:', error);
    alert('Не удалось загрузить товары');
    } finally {
    setLoading(false);
    }
};

const handleDelete = async (id) => {
    if (!window.confirm('Удалить товар?')) return;
    try {
    await axios.delete(`${API}/products/${id}`);
    setProducts(products.filter(p => p.id !== id));
    } catch (error) {
    alert('Ошибка удаления');
    }
};

const handleSubmit = async (productData) => {
    try {
    if (editingProduct) {
        const response = await axios.patch(`${API}/products/${editingProduct.id}`, productData);
        setProducts(products.map(p => p.id === editingProduct.id ? response.data : p));
    } else {
        const response = await axios.post(`${API}/products`, productData);
        setProducts([...products, response.data]);
    }
    setModalOpen(false);
    setEditingProduct(null);
    } catch (error) {
    alert('Ошибка сохранения');
    }
};

return (
    <div className="shop">
    <header className="shop__header">
        <h1>Каталог товаров</h1>
        <button className="btn btn--primary" onClick={() => setModalOpen(true)}>
            + Новый товар
        </button>
    </header>

    <main className="shop__main">
        {loading ? (
        <div className="loading">Загрузка...</div>
        ) : (
        <div className="products-grid">
            {products.map(product => (
            <div key={product.id} className="product-card">
                <div className="product-card__image">
                    {product.image ? (
                    <img src={`/images/${product.image}`} alt={product.name} />
                    ) : (
                    <div className="product-card__image--placeholder" />
                    )}
                </div>
                <div className="product-card__content">
                    <div className="product-card__title">{product.name}</div>
                    <div className="product-card__category">{product.category}</div>
                    <div className="product-card__description">{product.description}</div>
                    <div className="product-card__price">{product.price.toLocaleString()}</div>
                    <div className={`product-card__stock ${
                    product.stock === 0 ? 'out-of-stock' : 
                    product.stock < 5 ? 'low-stock' : ''
                    }`}>
                    В наличии: {product.stock} шт.
                    </div>
                    <div className="product-card__actions">
                    <button className="btn btn--edit" onClick={() => {
                        setEditingProduct(product);
                        setModalOpen(true);
                    }}>Редактировать</button>
                    <button className="btn btn--delete" onClick={() => handleDelete(product.id)}>Удалить</button>
                    </div>
                </div>
            </div>
            ))}
        </div>
        )}
    </main>

    {modalOpen && (
        <ProductModal
        product={editingProduct}
        onClose={() => {
            setModalOpen(false);
            setEditingProduct(null);
        }}
        onSubmit={handleSubmit}
        />
    )}
    </div>
);
}

function ProductModal({ product, onClose, onSubmit }) {
const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || '',
    description: product?.description || '',
    price: product?.price || '',
    stock: product?.stock || ''
});

const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
};

return (
    <div className="modal" onClick={onClose}>
    <div className="modal__content" onClick={e => e.stopPropagation()}>
        <h2>{product ? 'Редактировать' : 'Новый товар'}</h2>
        <form onSubmit={handleSubmit}>
        <input
            type="text"
            placeholder="Название"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            required
        />
        <input
            type="text"
            placeholder="Категория"
            value={formData.category}
            onChange={e => setFormData({...formData, category: e.target.value})}
            required
        />
        <textarea
            placeholder="Описание"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            required
        />
        <input
            type="number"
            placeholder="Цена"
            value={formData.price}
            onChange={e => setFormData({...formData, price: e.target.value})}
            required
        />
        <input
            type="number"
            placeholder="Количество"
            value={formData.stock}
            onChange={e => setFormData({...formData, stock: e.target.value})}
            required
        />
        <div className="modal__actions">
            <button type="button" onClick={onClose}>Отмена</button>
            <button type="submit">Сохранить</button>
        </div>
        </form>
    </div>
    </div>
);
}

export default ProductsPage;