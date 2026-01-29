// Компонент личного кабинета
// Добавьте этот файл как src/components/ProfilePage.jsx

import React, { useState, useEffect } from 'react';
import { User, Award, BookOpen, CheckCircle, TrendingUp, LogOut } from 'lucide-react';
import apiClient from '../api/apiClient';

const ProfilePage = ({ user, onLogout, onClose }) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await apiClient.getDashboard();
      if (response.success) {
        setDashboard(response.dashboard);
      }
    } catch (error) {
      console.error('Ошибка загрузки dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    container: {
      background: 'white',
      borderRadius: '16px',
      maxWidth: '900px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    },
    header: {
      background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
      color: 'white',
      padding: '32px',
      borderRadius: '16px 16px 0 0',
      position: 'relative'
    },
    closeButton: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      background: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      color: 'white',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      fontSize: '24px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    content: {
      padding: '32px'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '32px'
    },
    statCard: {
      background: '#F9FAFB',
      padding: '24px',
      borderRadius: '12px',
      textAlign: 'center'
    },
    statValue: {
      fontSize: '48px',
      fontWeight: 'bold',
      color: '#4F46E5',
      marginBottom: '8px'
    },
    statLabel: {
      fontSize: '14px',
      color: '#6B7280',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    section: {
      marginBottom: '32px'
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    list: {
      background: '#F9FAFB',
      borderRadius: '12px',
      padding: '16px'
    },
    listItem: {
      padding: '12px',
      borderBottom: '1px solid #E5E7EB',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    badge: {
      background: '#10B981',
      color: 'white',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600'
    },
    logoutButton: {
      width: '100%',
      padding: '16px',
      background: '#EF4444',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      marginTop: '24px'
    }
  };

  if (loading) {
    return (
      <div style={styles.overlay}>
        <div style={{...styles.container, padding: '60px', textAlign: 'center'}}>
          <div style={{fontSize: '48px', marginBottom: '16px'}}>⏳</div>
          <div style={{fontSize: '20px', color: '#6B7280'}}>Загрузка...</div>
        </div>
      </div>
    );
  }

  const stats = dashboard?.stats || {};
  const recentLessons = dashboard?.recentLessons || [];
  const recentAchievements = dashboard?.recentAchievements || [];
  const recentTests = dashboard?.recentTests || [];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.container} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <button style={styles.closeButton} onClick={onClose}>×</button>
          <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px'
            }}>
              👤
            </div>
            <div>
              <h1 style={{fontSize: '32px', fontWeight: 'bold', marginBottom: '8px'}}>
                {user.username}
              </h1>
              <p style={{fontSize: '16px', opacity: 0.9}}>
                {user.email}
              </p>
            </div>
          </div>
        </div>

        <div style={styles.content}>
          {/* Статистика */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.total_lessons_completed || 0}</div>
              <div style={styles.statLabel}>Пройдено уроков</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.total_tests_passed || 0}</div>
              <div style={styles.statLabel}>Пройдено тестов</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.total_achievements || 0}</div>
              <div style={styles.statLabel}>Достижений</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.current_streak || 0}</div>
              <div style={styles.statLabel}>Дней подряд</div>
            </div>
          </div>

          {/* Последние уроки */}
          {recentLessons.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>
                <BookOpen size={24} color="#4F46E5" />
                Последние пройденные уроки
              </div>
              <div style={styles.list}>
                {recentLessons.map((lesson, idx) => (
                  <div 
                    key={lesson.id} 
                    style={{
                      ...styles.listItem,
                      borderBottom: idx === recentLessons.length - 1 ? 'none' : '1px solid #E5E7EB'
                    }}
                  >
                    <div>
                      <div style={{fontWeight: '600'}}>{lesson.lesson_id}</div>
                      <div style={{fontSize: '14px', color: '#6B7280'}}>
                        {new Date(lesson.completed_at).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    <CheckCircle size={20} color="#10B981" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Последние тесты */}
          {recentTests.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>
                <TrendingUp size={24} color="#4F46E5" />
                Результаты тестов
              </div>
              <div style={styles.list}>
                {recentTests.map((test, idx) => (
                  <div 
                    key={test.id}
                    style={{
                      ...styles.listItem,
                      borderBottom: idx === recentTests.length - 1 ? 'none' : '1px solid #E5E7EB'
                    }}
                  >
                    <div>
                      <div style={{fontWeight: '600'}}>{test.test_id}</div>
                      <div style={{fontSize: '14px', color: '#6B7280'}}>
                        {test.score} из {test.total_questions} ({test.percentage}%)
                      </div>
                    </div>
                    <div style={{
                      ...styles.badge,
                      background: test.passed ? '#10B981' : '#EF4444'
                    }}>
                      {test.passed ? 'Пройден' : 'Не пройден'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Достижения */}
          {recentAchievements.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>
                <Award size={24} color="#4F46E5" />
                Последние достижения
              </div>
              <div style={styles.list}>
                {recentAchievements.map((achievement, idx) => (
                  <div 
                    key={achievement.id}
                    style={{
                      ...styles.listItem,
                      borderBottom: idx === recentAchievements.length - 1 ? 'none' : '1px solid #E5E7EB'
                    }}
                  >
                    <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <div style={{fontSize: '32px'}}>{achievement.achievement_icon}</div>
                      <div>
                        <div style={{fontWeight: '600'}}>{achievement.achievement_name}</div>
                        <div style={{fontSize: '14px', color: '#6B7280'}}>
                          {new Date(achievement.earned_at).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Кнопка выхода */}
          <button 
            style={styles.logoutButton}
            onClick={onLogout}
            onMouseEnter={(e) => e.currentTarget.style.background = '#DC2626'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#EF4444'}
          >
            <LogOut size={20} />
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
