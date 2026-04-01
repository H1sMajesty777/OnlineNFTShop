import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ProductsPage from './components/ProductsPage';
import AdminUsers from './components/AdminUsers';
import './App.css';

function AppContent() {
  const [authMode, setAuthMode] = useState('login');
  const { isAuthenticated, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('products');

  if (!isAuthenticated) {
    return authMode === 'login'
      ? <Login onSwitch={() => setAuthMode('register')} />
      : <Register onSwitch={() => setAuthMode('login')} />;
  }

  const getRoleLabel = (role) => {
    switch(role) {
      case 'admin': return 'Администратор';
      case 'seller': return 'Продавец';
      default: return 'Покупатель';
    }
  };

  return (
    <>
      <div className="navbar">
        <div className="navbar__inner">
          <div className="navbar__logo">
            NFT Маркет
          </div>
          <div className="navbar__nav">
            <button 
              className={`btn ${activeTab === 'products' ? 'btn--primary' : 'btn--outline'}`}
              onClick={() => setActiveTab('products')}
            >
              Товары
            </button>
            {user?.role === 'admin' && (
              <button 
                className={`btn ${activeTab === 'users' ? 'btn--primary' : 'btn--outline'}`}
                onClick={() => setActiveTab('users')}
              >
                Пользователи
              </button>
            )}
            <div className="navbar__user">
              <div className="navbar__user-info">
                {user?.first_name} {user?.last_name}<br/>
                <strong>{user?.email}</strong>
              </div>
              <span className="navbar__role-badge">{getRoleLabel(user?.role)}</span>
              <button className="btn btn--outline" onClick={logout}>
                Выйти
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="content">
        {activeTab === 'products' && <ProductsPage />}
        {activeTab === 'users' && user?.role === 'admin' && <AdminUsers />}
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;