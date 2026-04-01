import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './LoginRegister.scss';

export default function Login({ onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError('Неверный email или пароль');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Вход в аккаунт</h2>
        <div className="auth-subtitle">Добро пожаловать обратно</div>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          <div className="input-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit">Войти</button>
        </form>
        <div className="auth-footer">
          Нет аккаунта? <button onClick={onSwitch}>Зарегистрироваться</button>
        </div>
      </div>
    </div>
  );
}