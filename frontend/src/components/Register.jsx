import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './LoginRegister.scss';

export default function Register({ onSwitch }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await register(formData.email, formData.password, formData.first_name, formData.last_name);
      setSuccess('Регистрация успешна! Теперь войдите в аккаунт.');
      setTimeout(() => onSwitch(), 2000);
    } catch (err) {
      setError('Ошибка регистрации. Возможно, email уже используется.');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Регистрация</h2>
        <div className="auth-subtitle">Создайте новый аккаунт</div>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-row">
            <div className="input-group">
              <label>Имя</label>
              <input
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Иван"
                required
              />
            </div>
            <div className="input-group">
              <label>Фамилия</label>
              <input
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Иванов"
                required
              />
            </div>
          </div>
          <div className="input-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ivan@example.com"
              required
            />
          </div>
          <div className="input-group">
            <label>Пароль</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit">Зарегистрироваться</button>
        </form>
        <div className="auth-footer">
          Уже есть аккаунт? <button onClick={onSwitch}>Войти</button>
        </div>
      </div>
    </div>
  );
}