import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ProductsPage.scss';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const { apiClient, user } = useAuth();

  const canEdit = user?.role === 'seller' || user?.role === 'admin';
  const canDelete = user?.role === 'admin';

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await apiClient.get('/products');
      setProducts(res.data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить товар?')) return;
    try {
      await apiClient.delete(`/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      alert('Ошибка удаления');
    }
  };

  const handleSubmit = async (productData) => {
    try {
      if (editingProduct) {
        const res = await apiClient.patch(`/products/${editingProduct.id}`, productData);
        setProducts(products.map(p => p.id === editingProduct.id ? res.data : p));
      } else {
        const res = await apiClient.post('/products', productData);
        setProducts([...products, res.data]);
      }
      setModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      alert('Ошибка сохранения');
    }
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setDetailModalOpen(true);
  };

  if (loading) return <div className="loading">Загрузка</div>;

  return (
    <div className="shop">
      <header className="shop__header">
        <h1>Каталог товаров</h1>
        {canEdit && (
          <button className="btn btn--primary" onClick={() => setModalOpen(true)}>
            Новый товар
          </button>
        )}
      </header>

      <main className="shop__main">
        {products.length === 0 ? (
          <div className="empty-state">Товаров пока нет</div>
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
                  <div className="product-card__header">
                    <div className="product-card__title">{product.name}</div>
                    <div className="product-card__category">{product.category}</div>
                  </div>
                  <div className="product-card__description">{product.description}</div>
                  <div className="product-card__footer">
                    <div className="product-card__price">{product.price}</div>
                    <div className={`product-card__stock ${
                      product.stock === 0 ? 'out-of-stock' : 
                      product.stock < 5 ? 'low-stock' : ''
                    }`}>
                      {product.stock === 0 ? 'Нет в наличии' : 
                       product.stock < 5 ? `Осталось ${product.stock} шт` : 
                       `В наличии: ${product.stock} шт`}
                    </div>
                  </div>
                  <div className="product-card__actions">
                    <button 
                      className="btn btn--secondary" 
                      onClick={() => handleViewDetails(product)}
                    >
                      Подробнее
                    </button>
                    {canEdit && (
                      <button 
                        className="btn btn--outline" 
                        onClick={() => {
                          setEditingProduct(product);
                          setModalOpen(true);
                        }}
                      >
                        Редактировать
                      </button>
                    )}
                    {canDelete && (
                      <button 
                        className="btn btn--danger" 
                        onClick={() => handleDelete(product.id)}
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Модалка создания/редактирования */}
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

      {/* Модалка подробностей */}
      {detailModalOpen && selectedProduct && (
        <DetailModal
          product={selectedProduct}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedProduct(null);
          }}
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
        <h2>{product ? 'Редактировать товар' : 'Новый товар'}</h2>
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
            type="text"
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

function DetailModal({ product, onClose }) {
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__content" onClick={e => e.stopPropagation()}>
        <h2>{product.name}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div><strong>Категория:</strong> {product.category}</div>
          <div><strong>Описание:</strong> {product.description}</div>
          <div><strong>Цена:</strong> {product.price} ₽</div>
          <div><strong>В наличии:</strong> {product.stock} шт.</div>
        </div>
        <div className="modal__actions">
          <button onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;