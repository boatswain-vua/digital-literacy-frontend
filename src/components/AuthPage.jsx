// Компонент авторизации и регистрации
// Добавьте этот код в начало вашего App.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Вход
        const response = await apiClient.login(formData.username, formData.password);
        if (response.success) {
          onAuthSuccess(response.user);
        }
      } else {
        // Регистрация
        if (formData.password !== formData.confirmPassword) {
          setError('Пароли не совпадают');
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError('Пароль должен быть не менее 6 символов');
          setLoading(false);
          return;
        }

        const response = await apiClient.register(
          formData.username,
          formData.email,
          formData.password
        );
        
        if (response.success) {
          onAuthSuccess(response.user);
        }
      }
    } catch (err) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #EBF4FF, #E0E7FF)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '40px',
      maxWidth: '450px',
      width: '100%',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#1F2937',
      marginBottom: '8px',
      textAlign: 'center'
    },
    subtitle: {
      fontSize: '16px',
      color: '#6B7280',
      marginBottom: '32px',
      textAlign: 'center'
    },
    input: {
      width: '100%',
      padding: '14px',
      fontSize: '16px',
      border: '2px solid #E5E7EB',
      borderRadius: '12px',
      marginBottom: '16px',
      outline: 'none',
      transition: 'border-color 0.3s',
      boxSizing: 'border-box'
    },
    button: {
      width: '100%',
      padding: '16px',
      fontSize: '18px',
      fontWeight: '600',
      color: 'white',
      background: '#4F46E5',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'background 0.3s',
      marginTop: '8px'
    },
    switchButton: {
      width: '100%',
      padding: '12px',
      fontSize: '16px',
      color: '#4F46E5',
      background: 'transparent',
      border: '2px solid #4F46E5',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s',
      marginTop: '16px'
    },
    error: {
      background: '#FEE2E2',
      color: '#DC2626',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '14px',
      textAlign: 'center'
    },
    logo: {
      fontSize: '64px',
      textAlign: 'center',
      marginBottom: '16px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🎓</div>
        <h1 style={styles.title}>
          {isLogin ? 'Вход в систему' : 'Регистрация'}
        </h1>
        <p style={styles.subtitle}>
          {isLogin 
            ? 'Войдите чтобы продолжить обучение' 
            : 'Создайте аккаунт для начала обучения'}
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Имя пользователя"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            style={styles.input}
            required
          />

          {!isLogin && (
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={styles.input}
              required
            />
          )}

          <input
            type="password"
            placeholder="Пароль"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            style={styles.input}
            required
          />

          {!isLogin && (
            <input
              type="password"
              placeholder="Подтвердите пароль"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              style={styles.input}
              required
            />
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>

        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
            setFormData({ username: '', email: '', password: '', confirmPassword: '' });
          }}
          style={styles.switchButton}
        >
          {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
