// API клиент для работы с backend
// Сохраните этот файл как src/api/apiClient.js

const API_URL = 'http://localhost:3001/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  // Установка токена
  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  // Удаление токена
  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Получение заголовков
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Базовый метод для запросов
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const config = {
      ...options,
      headers: this.getHeaders(),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка сервера');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ============================================
  // АУТЕНТИФИКАЦИЯ
  // ============================================

  async register(username, email, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  async verifyToken() {
    return await this.request('/auth/verify');
  }

  logout() {
    this.removeToken();
  }

  // ============================================
  // ПРОГРЕСС
  // ============================================

  async getProgress() {
    return await this.request('/progress');
  }

  async saveLessonProgress(lessonId, completed, currentStep) {
    return await this.request('/progress/lesson', {
      method: 'POST',
      body: JSON.stringify({ lessonId, completed, currentStep }),
    });
  }

  // ============================================
  // ДОСТИЖЕНИЯ
  // ============================================

  async getAchievements() {
    return await this.request('/achievements');
  }

  async addAchievement(achievementName, achievementIcon) {
    return await this.request('/achievements', {
      method: 'POST',
      body: JSON.stringify({ achievementName, achievementIcon }),
    });
  }

  // ============================================
  // ТЕСТЫ
  // ============================================

  async saveTestResult(testId, score, totalQuestions, percentage, passed) {
    return await this.request('/tests/result', {
      method: 'POST',
      body: JSON.stringify({ testId, score, totalQuestions, percentage, passed }),
    });
  }

  async getTestResults() {
    return await this.request('/tests/results');
  }

  // ============================================
  // СТАТИСТИКА
  // ============================================

  async getStats() {
    return await this.request('/stats');
  }

  async getDashboard() {
    return await this.request('/dashboard');
  }
}

// Создаем единственный экземпляр
const apiClient = new ApiClient();

export default apiClient;
