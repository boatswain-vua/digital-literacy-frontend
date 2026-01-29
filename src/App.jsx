import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Send, Image, Phone, Video, Search, Menu, ArrowLeft, 
  Check, CheckCheck, Home, Award, User, HelpCircle, Volume2
} from 'lucide-react';

// Импортируем уроки из отдельных файлов
import { allLessons } from './lessons/index.js';
import { allTests } from './tests/index.js';

// Импортируем компоненты авторизации
import apiClient from './api/apiClient';
import AuthPage from './components/AuthPage';
import ProfilePage from './components/ProfilePage';

const DigitalLiteracyPlatform = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonStep, setLessonStep] = useState(0);
  const [userProgress, setUserProgress] = useState({
    completedLessons: [],
    achievements: [],
    currentStreak: 0
  });
  const [showHelp, setShowHelp] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('all'); // 'all', 'basic', 'advanced'

  // Состояние авторизации
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Состояние тестов
  const [currentTest, setCurrentTest] = useState(null);
  const [testAnswers, setTestAnswers] = useState({});
  const [testResults, setTestResults] = useState(null);
  const [showTestResults, setShowTestResults] = useState(false);

  // Refs для сохранения фокуса в полях ввода (должны быть на уровне компонента!)
  const phoneInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const policyInputRef = useRef(null);
  const wifiPasswordInputRef = useRef(null);
  const appSearchInputRef = useRef(null);

  // Симуляция мессенджера
  const [messengerState, setMessengerState] = useState({
    chats: [
      { id: 1, name: 'Анна Петрова', lastMessage: 'Привет!', time: '14:30', avatar: '👩' },
      { id: 2, name: 'Иван Смирнов', lastMessage: 'Как дела?', time: '12:15', avatar: '👨' },
    ],
    currentChat: null,
    messages: [],
    inputText: '',
    searchQuery: '',
    showSearch: false
  });

  // Используем импортированные уроки вместо хардкода
  const lessons = allLessons;
  
  // Фильтрация уроков по выбранному уровню
  const filteredLessons = selectedLevel === 'all' 
    ? lessons 
    : lessons.filter(lesson => lesson.level === selectedLevel);
  
  // Дополнительные данные из текущего урока
  const getCurrentLesson = () => {
    return lessons.find(l => l.id === currentLesson);
  };
  
  const contacts = getCurrentLesson()?.contacts || [
    { id: 3, name: 'Мария Иванова', phone: '+7 999 123-45-67', avatar: '👩‍🦰' },
    { id: 4, name: 'Петр Сидоров', phone: '+7 999 765-43-21', avatar: '👨‍🦱' },
  ];

  const photoGallery = getCurrentLesson()?.photoGallery || ['🏞️', '🌅', '🌸', '🐕', '🎂', '🌈'];

  const getCurrentStep = () => {
    if (!currentLesson) return null;
    return lessons.find(l => l.id === currentLesson)?.steps[lessonStep];
  };

  const playVoice = (text) => {
    if (voiceEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Остановить предыдущее воспроизведение
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleVoice = () => {
    if (!voiceEnabled) {
      setVoiceEnabled(true);
    } else {
      setVoiceEnabled(false);
      // Остановить текущее воспроизведение
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  };

  // Функции авторизации
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await apiClient.verifyToken();
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        await loadProgressFromDB();
      }
    } catch (error) {
      console.log('Не авторизован');
    } finally {
      setAuthLoading(false);
    }
  };

  const loadProgressFromDB = async () => {
    try {
      const [progressRes, achievementsRes, statsRes] = await Promise.all([
        apiClient.getProgress(),
        apiClient.getAchievements(),
        apiClient.getStats()
      ]);

      if (progressRes.success) {
        const completedLessons = progressRes.progress
          .filter(p => p.completed)
          .map(p => p.lesson_id);

        const achievements = achievementsRes.success 
          ? achievementsRes.achievements.map(a => a.achievement_name)
          : [];

        setUserProgress({
          completedLessons,
          achievements,
          currentStreak: statsRes.success ? statsRes.stats.current_streak : 0
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки прогресса:', error);
    }
  };

  const handleAuthSuccess = async (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    await loadProgressFromDB();
  };

  const handleLogout = () => {
    apiClient.logout();
    setUser(null);
    setIsAuthenticated(false);
    setUserProgress({
      completedLessons: [],
      achievements: [],
      currentStreak: 0
    });
  };

  const handleStepAction = (action) => {
    const step = getCurrentStep();
    
    if (step.action === 'select-chat' && action === 'select-chat') {
      setMessengerState(prev => ({
        ...prev,
        currentChat: 1,
        messages: [
          { id: 1, text: 'Привет!', sender: 'other', time: '14:30' }
        ]
      }));
      setTimeout(() => nextStep(), 800);
    } else if (step.action === 'type-message' && action === 'type-complete') {
      nextStep();
    } else if (step.action === 'send-message' && action === 'send') {
      setMessengerState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          id: prev.messages.length + 1,
          text: prev.inputText,
          sender: 'me',
          time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        }],
        inputText: ''
      }));
      setTimeout(() => nextStep(), 800);
    } else if (step.action === 'send-photo' && action === 'photo-click') {
      nextStep();
    } else if (step.action === 'select-photo' && action === 'photo-selected') {
      setMessengerState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          id: prev.messages.length + 1,
          text: '📷 Фотография',
          sender: 'me',
          time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        }]
      }));
      setTimeout(() => nextStep(), 800);
    } else if (step.action === 'back-to-list' && action === 'back') {
      setMessengerState(prev => ({ ...prev, currentChat: null, messages: [] }));
      setTimeout(() => nextStep(), 800);
    } else if (step.action === 'open-search' && action === 'search') {
      setMessengerState(prev => ({ ...prev, showSearch: true }));
      setTimeout(() => nextStep(), 800);
    } else if (step.action === 'search-contact' && action === 'search-complete') {
      nextStep();
    } else if (step.action === 'create-chat' && action === 'create-chat') {
      setMessengerState(prev => ({
        ...prev,
        currentChat: 3,
        showSearch: false,
        searchQuery: '',
        chats: [...prev.chats, { id: 3, name: 'Мария Иванова', lastMessage: '', time: '', avatar: '👩‍🦰' }],
        messages: []
      }));
      setTimeout(() => nextStep(), 800);
    } else if (step.action === 'send-greeting' && action === 'send-greeting') {
      setMessengerState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          id: 1,
          text: prev.inputText,
          sender: 'me',
          time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        }],
        inputText: ''
      }));
      setTimeout(() => nextStep(), 800);
    }
  };

  const nextStep = () => {
    const lesson = lessons.find(l => l.id === currentLesson);
    if (lessonStep < lesson.steps.length - 1) {
      setLessonStep(lessonStep + 1);
      const nextStepData = lesson.steps[lessonStep + 1];
      playVoice(nextStepData.instruction);
    }
  };

  const startLesson = (lessonId) => {
    const lesson = lessons.find(l => l.id === lessonId);
    setCurrentLesson(lessonId);
    setLessonStep(0);
    setCurrentPage('lesson');
    
    // Загружаем начальное состояние из урока
    if (lesson.initialState) {
      setMessengerState(lesson.initialState);
    } else {
      // Дефолтное состояние если не указано
      setMessengerState({
        chats: [
          { id: 1, name: 'Анна Петрова', lastMessage: 'Привет!', time: '14:30', avatar: '👩' },
          { id: 2, name: 'Иван Смирнов', lastMessage: 'Как дела?', time: '12:15', avatar: '👨' },
        ],
        currentChat: null,
        messages: [],
        inputText: '',
        searchQuery: '',
        showSearch: false
      });
    }
    
    playVoice(lesson.steps[0].instruction);
  };

  const completeLesson = async () => {
    const lesson = getCurrentLesson();
    
    // Обновляем локальное состояние
    setUserProgress(prev => ({
      ...prev,
      completedLessons: [...new Set([...prev.completedLessons, currentLesson])],
      achievements: [...new Set([...prev.achievements, ...(lesson.achievements || [])])]
    }));

    // Сохраняем в БД если авторизован
    if (isAuthenticated) {
      try {
        await apiClient.saveLessonProgress(currentLesson, true, lesson.steps.length);
        
        // Сохраняем достижения
        if (lesson.achievements) {
          for (const achievement of lesson.achievements) {
            await apiClient.addAchievement(achievement, '🏆');
          }
        }
      } catch (error) {
        console.error('Ошибка сохранения прогресса:', error);
      }
    }
    
    setCurrentPage('home');
    setCurrentLesson(null);
    setLessonStep(0);
  };

  const renderHome = () => {
    const styles = {
      container: {
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #EBF4FF, #E0E7FF)',
        padding: '16px'
      },
      maxWidth: {
        maxWidth: '1280px',
        margin: '0 auto'
      },
      header: {
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        padding: '24px',
        marginBottom: '24px'
      },
      title: {
        fontSize: '36px',
        fontWeight: 'bold',
        color: '#312E81',
        marginBottom: '8px'
      },
      subtitle: {
        fontSize: '20px',
        color: '#4B5563'
      },
      statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginBottom: '24px'
      },
      statCard: {
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        padding: '24px'
      },
      statHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      },
      statNumber: {
        fontSize: '30px',
        fontWeight: 'bold',
        color: '#312E81'
      },
      statLabel: {
        fontSize: '18px',
        color: '#4B5563'
      },
      coursesCard: {
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        padding: '24px'
      },
      coursesTitle: {
        fontSize: '30px',
        fontWeight: 'bold',
        color: '#312E81',
        marginBottom: '24px'
      },
      lessonCard: {
        border: '2px solid #C7D2FE',
        borderRadius: '12px',
        padding: '24px',
        transition: 'border-color 0.3s',
        cursor: 'pointer'
      },
      lessonContent: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between'
      },
      lessonLeft: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        flex: 1
      },
      lessonIcon: {
        fontSize: '60px'
      },
      lessonInfo: {
        flex: 1
      },
      lessonTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: '8px'
      },
      lessonBadge: {
        display: 'inline-block',
        background: '#DBEAFE',
        color: '#1E40AF',
        padding: '4px 16px',
        borderRadius: '9999px',
        fontSize: '18px',
        marginBottom: '12px'
      },
      lessonDescription: {
        fontSize: '18px',
        color: '#4B5563',
        marginBottom: '16px'
      },
      lessonMeta: {
        display: 'flex',
        gap: '8px',
        fontSize: '18px',
        color: '#6B7280'
      },
      startButton: {
        background: '#4F46E5',
        color: 'white',
        padding: '16px 32px',
        borderRadius: '12px',
        fontSize: '20px',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.3s'
      },
      completedBadge: {
        marginTop: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#059669',
        fontSize: '18px'
      },
      levelSelector: {
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        padding: '24px',
        marginBottom: '24px'
      },
      levelTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#312E81',
        marginBottom: '16px'
      },
      levelButtons: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap'
      },
      levelButton: {
        padding: '12px 24px',
        borderRadius: '12px',
        fontSize: '18px',
        fontWeight: '600',
        border: '2px solid #C7D2FE',
        background: 'white',
        color: '#4F46E5',
        cursor: 'pointer',
        transition: 'all 0.3s'
      },
      levelButtonActive: {
        background: '#4F46E5',
        color: 'white',
        borderColor: '#4F46E5'
      }
    };

    return (
      <div style={styles.container}>
        <div style={styles.maxWidth}>
          <header style={{
            ...styles.header,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div>
              <h1 style={styles.title}>Платформа цифровой грамотности</h1>
              <p style={styles.subtitle}>
                Учитесь работать с цифровыми сервисами безопасно и уверенно
              </p>
            </div>
            
            <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
              {isAuthenticated && user && (
                <button
                  onClick={() => setShowProfile(true)}
                  style={{
                    padding: '12px 24px',
                    background: '#4F46E5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'background 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#4338CA'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#4F46E5'}
                >
                  <User size={20} />
                  {user.username}
                </button>
              )}
              
              <button
                onClick={() => setShowHelp(!showHelp)}
                style={{
                  padding: '12px',
                  background: '#F3F4F6',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'background 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
              >
                <HelpCircle size={24} color="#4F46E5" />
              </button>
            </div>
          </header>

          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statHeader}>
                <Award color="#EAB308" size={48} />
                <span style={styles.statNumber}>
                  {userProgress.completedLessons.length}
                </span>
              </div>
              <p style={styles.statLabel}>Пройдено уроков</p>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statHeader}>
                <Check color="#10B981" size={48} />
                <span style={styles.statNumber}>
                  {userProgress.achievements.length}
                </span>
              </div>
              <p style={styles.statLabel}>Достижений</p>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statHeader}>
                <MessageCircle color="#3B82F6" size={48} />
                <span style={styles.statNumber}>{lessons.length}</span>
              </div>
              <p style={styles.statLabel}>Доступно курсов</p>
            </div>
          </div>

          {/* Блок выбора уровня сложности */}
          <div style={styles.levelSelector}>
            <h2 style={styles.levelTitle}>🎯 Выберите уровень сложности</h2>
            <div style={styles.levelButtons}>
              <button
                onClick={() => setSelectedLevel('all')}
                style={{
                  ...styles.levelButton,
                  ...(selectedLevel === 'all' ? styles.levelButtonActive : {})
                }}
                onMouseEnter={(e) => {
                  if (selectedLevel !== 'all') {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedLevel !== 'all') {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                📚 Все уроки ({lessons.length})
              </button>
              
              <button
                onClick={() => setSelectedLevel('Базовый')}
                style={{
                  ...styles.levelButton,
                  ...(selectedLevel === 'Базовый' ? styles.levelButtonActive : {})
                }}
                onMouseEnter={(e) => {
                  if (selectedLevel !== 'Базовый') {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedLevel !== 'Базовый') {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                🟢 Базовый ({lessons.filter(l => l.level === 'Базовый').length})
              </button>
              
              <button
                onClick={() => setSelectedLevel('Расширенный')}
                style={{
                  ...styles.levelButton,
                  ...(selectedLevel === 'Расширенный' ? styles.levelButtonActive : {})
                }}
                onMouseEnter={(e) => {
                  if (selectedLevel !== 'Расширенный') {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedLevel !== 'Расширенный') {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                🔴 Расширенный ({lessons.filter(l => l.level === 'Расширенный').length})
              </button>
            </div>
          </div>

          <div style={styles.coursesCard}>
            <h2 style={styles.coursesTitle}>
              {selectedLevel === 'all' && 'Доступные курсы'}
              {selectedLevel === 'Базовый' && 'Базовые курсы'}
              {selectedLevel === 'Расширенный' && 'Расширенные курсы'}
            </h2>
            
            {filteredLessons.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px 24px',
                color: '#6B7280'
              }}>
                <div style={{fontSize: '64px', marginBottom: '16px'}}>📭</div>
                <p style={{fontSize: '20px', fontWeight: '600', marginBottom: '8px'}}>
                  Уроков этого уровня пока нет
                </p>
                <p style={{fontSize: '18px'}}>
                  Выберите другой уровень сложности
                </p>
              </div>
            ) : (
              <div style={{display: 'grid', gap: '24px'}}>
                {filteredLessons.map(lesson => (
                <div 
                  key={lesson.id} 
                  style={styles.lessonCard}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#818CF8'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#C7D2FE'}
                >
                  <div style={styles.lessonContent}>
                    <div style={styles.lessonLeft}>
                      <div style={styles.lessonIcon}>{lesson.icon}</div>
                      <div style={styles.lessonInfo}>
                        <h3 style={styles.lessonTitle}>{lesson.title}</h3>
                        <span style={styles.lessonBadge}>
                          Уровень: {lesson.level}
                        </span>
                        <p style={styles.lessonDescription}>
                          {lesson.description}
                        </p>
                        <div style={styles.lessonMeta}>
                          <span>📝 {lesson.steps.length} шагов</span>
                          <span>⏱️ {lesson.duration || '~15 минут'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Контейнер для кнопок */}
                    <div style={{display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px', marginLeft: 'auto'}}>
                      <button
                        onClick={() => startLesson(lesson.id)}
                        style={styles.startButton}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338CA'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4F46E5'}
                      >
                        Начать урок
                      </button>
                      
                      {/* Кнопка теста */}
                      {(() => {
                        const lessonTopic = lesson.id.split('-')[0];
                        const test = allTests.find(t => t.topic === lessonTopic);
                        const isLessonCompleted = userProgress.completedLessons.includes(lesson.id);
                        
                        if (test) {
                          return (
                            <button
                              onClick={() => {
                                if (isLessonCompleted) {
                                  setCurrentTest(test.id);
                                  setCurrentPage('test');
                                  setTestAnswers({});
                                  setTestResults(null);
                                  setShowTestResults(false);
                                }
                              }}
                              disabled={!isLessonCompleted}
                              style={{
                                ...styles.startButton,
                                background: isLessonCompleted ? '#10B981' : '#D1D5DB',
                                color: isLessonCompleted ? 'white' : '#9CA3AF',
                                cursor: isLessonCompleted ? 'pointer' : 'not-allowed',
                                marginTop: '0'
                              }}
                              onMouseEnter={(e) => {
                                if (isLessonCompleted) e.currentTarget.style.backgroundColor = '#059669';
                              }}
                              onMouseLeave={(e) => {
                                if (isLessonCompleted) e.currentTarget.style.backgroundColor = '#10B981';
                              }}
                            >
                              {isLessonCompleted ? '📝 Пройти тест' : '🔒 Пройти тест'}
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  {userProgress.completedLessons.includes(lesson.id) && (
                    <div style={styles.completedBadge}>
                      <CheckCheck size={24} />
                      <span style={{fontWeight: '600'}}>Урок пройден</span>
                    </div>
                  )}
                </div>
              ))}
              </div>
            )}
          </div>
        </div>

        {/* Панель помощи */}
        {showHelp && (
          <div 
            style={{
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
            }}
            onClick={() => setShowHelp(false)}
          >
            <div 
              style={{
                background: 'white',
                borderRadius: '16px',
                maxWidth: '700px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: 'white',
                padding: '32px',
                borderRadius: '16px 16px 0 0',
                position: 'relative'
              }}>
                <button
                  onClick={() => setShowHelp(false)}
                  style={{
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
                  }}
                >
                  ×
                </button>
                <div style={{fontSize: '48px', marginBottom: '16px'}}>💡</div>
                <h2 style={{fontSize: '32px', fontWeight: 'bold', marginBottom: '8px'}}>
                  Справка
                </h2>
                <p style={{fontSize: '16px', opacity: 0.9}}>
                  Помощь по работе с платформой
                </p>
              </div>

              <div style={{padding: '32px'}}>
                <div style={{marginBottom: '32px'}}>
                  <h3 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1F2937'}}>
                    🎯 Как пользоваться платформой
                  </h3>
                  <ol style={{paddingLeft: '20px', lineHeight: '1.8', color: '#4B5563'}}>
                    <li style={{marginBottom: '12px'}}>
                      <strong>Выберите урок</strong> из списка доступных курсов
                    </li>
                    <li style={{marginBottom: '12px'}}>
                      <strong>Нажмите "Начать урок"</strong> чтобы начать обучение
                    </li>
                    <li style={{marginBottom: '12px'}}>
                      <strong>Следуйте инструкциям</strong> на каждом шаге урока
                    </li>
                    <li style={{marginBottom: '12px'}}>
                      <strong>Выполняйте действия</strong> в интерактивном симуляторе
                    </li>
                    <li style={{marginBottom: '12px'}}>
                      <strong>Пройдите тест</strong> после завершения урока
                    </li>
                  </ol>
                </div>

                <div style={{marginBottom: '32px'}}>
                  <h3 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1F2937'}}>
                    📚 Темы обучения
                  </h3>
                  <div style={{display: 'grid', gap: '12px'}}>
                    <div style={{padding: '16px', background: '#F9FAFB', borderRadius: '12px', borderLeft: '4px solid #4F46E5'}}>
                      <div style={{fontWeight: 'bold', marginBottom: '4px'}}>💬 Мессенджер MAX</div>
                      <div style={{fontSize: '14px', color: '#6B7280'}}>Отправка сообщений, фото, создание чатов</div>
                    </div>
                    <div style={{padding: '16px', background: '#F9FAFB', borderRadius: '12px', borderLeft: '4px solid #10B981'}}>
                      <div style={{fontWeight: 'bold', marginBottom: '4px'}}>📱 Смартфон</div>
                      <div style={{fontSize: '14px', color: '#6B7280'}}>Основы работы, настройки, приложения</div>
                    </div>
                    <div style={{padding: '16px', background: '#F9FAFB', borderRadius: '12px', borderLeft: '4px solid #F59E0B'}}>
                      <div style={{fontWeight: 'bold', marginBottom: '4px'}}>🛒 Онлайн покупки</div>
                      <div style={{fontSize: '14px', color: '#6B7280'}}>Как безопасно покупать в интернете</div>
                    </div>
                    <div style={{padding: '16px', background: '#F9FAFB', borderRadius: '12px', borderLeft: '4px solid #EF4444'}}>
                      <div style={{fontWeight: 'bold', marginBottom: '4px'}}>🏛️ Госуслуги</div>
                      <div style={{fontSize: '14px', color: '#6B7280'}}>Получение государственных услуг онлайн</div>
                    </div>
                  </div>
                </div>

                <div style={{marginBottom: '32px'}}>
                  <h3 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1F2937'}}>
                    🎓 Уровни сложности
                  </h3>
                  <div style={{display: 'grid', gap: '12px'}}>
                    <div style={{padding: '16px', background: '#EBF4FF', borderRadius: '12px'}}>
                      <div style={{fontWeight: 'bold', color: '#2563EB', marginBottom: '4px'}}>⭐ Базовый</div>
                      <div style={{fontSize: '14px', color: '#4B5563'}}>Основы работы с сервисом, простые действия</div>
                    </div>
                    <div style={{padding: '16px', background: '#F0FDF4', borderRadius: '12px'}}>
                      <div style={{fontWeight: 'bold', color: '#16A34A', marginBottom: '4px'}}>⭐⭐ Расширенный</div>
                      <div style={{fontSize: '14px', color: '#4B5563'}}>Дополнительные функции и возможности</div>
                    </div>
                  </div>
                </div>

                <div style={{marginBottom: '32px'}}>
                  <h3 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1F2937'}}>
                    💾 Ваш прогресс
                  </h3>
                  <div style={{background: '#F9FAFB', padding: '16px', borderRadius: '12px', lineHeight: '1.8', color: '#4B5563'}}>
                    <p style={{marginBottom: '8px'}}>
                      ✅ Все пройденные уроки сохраняются автоматически
                    </p>
                    <p style={{marginBottom: '8px'}}>
                      🏆 Достижения записываются в личный кабинет
                    </p>
                    <p style={{marginBottom: '8px'}}>
                      📊 Результаты тестов сохраняются в истории
                    </p>
                    <p>
                      👤 Нажмите на своё имя чтобы открыть личный кабинет
                    </p>
                  </div>
                </div>

                <div style={{marginBottom: '16px'}}>
                  <h3 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1F2937'}}>
                    ❓ Часто задаваемые вопросы
                  </h3>
                  <div style={{display: 'grid', gap: '12px'}}>
                    <details style={{padding: '16px', background: '#F9FAFB', borderRadius: '12px', cursor: 'pointer'}}>
                      <summary style={{fontWeight: 'bold', color: '#1F2937'}}>Как вернуться к предыдущему шагу?</summary>
                      <p style={{marginTop: '8px', color: '#6B7280', fontSize: '14px'}}>
                        В нижней части экрана урока есть навигация по шагам. Нажмите на нужный шаг чтобы вернуться.
                      </p>
                    </details>
                    <details style={{padding: '16px', background: '#F9FAFB', borderRadius: '12px', cursor: 'pointer'}}>
                      <summary style={{fontWeight: 'bold', color: '#1F2937'}}>Что если я ошибся в тесте?</summary>
                      <p style={{marginTop: '8px', color: '#6B7280', fontSize: '14px'}}>
                        После завершения теста вы увидите правильные ответы и объяснения. Можете пройти урок снова и повторить тест.
                      </p>
                    </details>
                    <details style={{padding: '16px', background: '#F9FAFB', borderRadius: '12px', cursor: 'pointer'}}>
                      <summary style={{fontWeight: 'bold', color: '#1F2937'}}>Сколько раз можно проходить уроки?</summary>
                      <p style={{marginTop: '8px', color: '#6B7280', fontSize: '14px'}}>
                        Неограниченно! Вы можете проходить уроки и тесты столько раз, сколько нужно для закрепления материала.
                      </p>
                    </details>
                  </div>
                </div>

                <button
                  onClick={() => setShowHelp(false)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: '#4F46E5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#4338CA'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#4F46E5'}
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMessenger = () => {
    const step = getCurrentStep();
    const highlight = step?.highlightElement;

    const styles = {
      // Базовые стили контейнера
      container: {
        height: '100%',
        background: 'white',
        display: 'flex',
        flexDirection: 'column'
      },
      
      // Стили для чата
      chatContainer: {
        height: '100%',
        background: '#F9FAFB',
        display: 'flex',
        flexDirection: 'column'
      },
      
      chatHeader: {
        background: '#4F46E5',
        color: 'white',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0
      },
      
      messagesContainer: {
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minHeight: 0
      },
      
      // Поле ввода ВСЕГДА внизу
      inputContainer: {
        background: 'white',
        borderTop: '1px solid #E5E7EB',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0
      },
      
      // Галерея фото между сообщениями и полем ввода
      photoGallery: {
        background: 'white',
        borderTop: '1px solid #E5E7EB',
        padding: '16px',
        flexShrink: 0
      }
    };

    // Добавим остальные стили...
    Object.assign(styles, {
      header: {
        background: '#4F46E5',
        color: 'white',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      },
      headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      },
      headerTitle: {
        fontSize: '24px',
        fontWeight: 'bold'
      },
      searchButton: {
        padding: '8px',
        borderRadius: '8px',
        border: 'none',
        background: 'transparent',
        color: 'white',
        cursor: 'pointer',
        transition: 'background-color 0.3s'
      },
      searchButtonHighlight: {
        background: '#FBBF24',
        animation: 'pulse 2s infinite',
        boxShadow: '0 0 0 4px rgba(251, 191, 36, 0.3)'
      },
      chatList: {
        flex: 1,
        overflowY: 'auto'
      },
      chatItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        borderBottom: '1px solid #E5E7EB',
        cursor: 'pointer',
        transition: 'background-color 0.3s'
      },
      chatItemHighlight: {
        background: '#FEF3C7',
        boxShadow: '0 0 0 4px rgba(251, 191, 36, 0.3)',
        animation: 'pulse 2s infinite'
      },
      avatar: {
        fontSize: '50px'
      },
      chatInfo: {
        flex: 1
      },
      chatName: {
        fontSize: '20px',
        fontWeight: '600'
      },
      chatMessage: {
        fontSize: '18px',
        color: '#6B7280'
      },
      chatTime: {
        fontSize: '16px',
        color: '#9CA3AF'
      },
      searchHeader: {
        background: '#4F46E5',
        color: 'white',
        padding: '16px'
      },
      searchHeaderContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      },
      backButton: {
        background: 'transparent',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        padding: '8px'
      },
      searchInput: {
        flex: 1,
        background: 'white',
        color: '#1F2937',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '20px',
        border: 'none',
        outline: 'none'
      },
      contactsLabel: {
        padding: '16px',
        fontSize: '18px',
        color: '#6B7280',
        fontWeight: '600'
      },
      contactItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        borderBottom: '1px solid #E5E7EB',
        cursor: 'pointer',
        transition: 'background-color 0.3s'
      },
      contactItemHighlight: {
        background: '#FEF3C7',
        boxShadow: '0 0 0 4px rgba(251, 191, 36, 0.3)',
        animation: 'pulse 2s infinite'
      },
      contactName: {
        fontSize: '20px',
        fontWeight: '600'
      },
      contactPhone: {
        fontSize: '16px',
        color: '#6B7280'
      },
      chatHeaderButton: {
        padding: '8px',
        borderRadius: '8px',
        border: 'none',
        background: 'transparent',
        color: 'white',
        cursor: 'pointer',
        transition: 'background-color 0.3s'
      },
      chatHeaderButtonHighlight: {
        background: '#FBBF24',
        animation: 'pulse 2s infinite',
        boxShadow: '0 0 0 4px rgba(251, 191, 36, 0.3)'
      },
      chatHeaderAvatar: {
        fontSize: '40px'
      },
      chatHeaderInfo: {
        flex: 1
      },
      chatHeaderName: {
        fontSize: '20px',
        fontWeight: 'bold'
      },
      chatHeaderStatus: {
        fontSize: '14px'
      },
      messageRow: {
        display: 'flex'
      },
      messageRowMe: {
        justifyContent: 'flex-end'
      },
      messageRowOther: {
        justifyContent: 'flex-start'
      },
      messageBubble: {
        maxWidth: '75%',
        padding: '12px 16px',
        borderRadius: '16px'
      },
      messageBubbleMe: {
        background: '#4F46E5',
        color: 'white'
      },
      messageBubbleOther: {
        background: 'white',
        color: '#1F2937'
      },
      messageText: {
        fontSize: '18px'
      },
      messageTime: {
        fontSize: '12px',
        marginTop: '4px'
      },
      messageTimeMe: {
        color: '#C7D2FE'
      },
      messageTimeOther: {
        color: '#9CA3AF'
      },
      galleryTitle: {
        fontSize: '18px',
        fontWeight: '600',
        marginBottom: '12px'
      },
      galleryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px'
      },
      photoItem: {
        fontSize: '60px',
        padding: '16px',
        background: '#F3F4F6',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.3s'
      },
      photoItemHighlight: {
        boxShadow: '0 0 0 4px rgba(251, 191, 36, 0.3)',
        animation: 'pulse 2s infinite'
      },
      iconButton: {
        padding: '12px',
        borderRadius: '8px',
        border: 'none',
        background: '#F3F4F6',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      iconButtonHighlight: {
        background: '#FBBF24',
        animation: 'pulse 2s infinite',
        boxShadow: '0 0 0 4px rgba(251, 191, 36, 0.3)'
      },
      messageInput: {
        flex: 1,
        background: '#F3F4F6',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '20px',
        border: 'none',
        outline: 'none'
      },
      sendButton: {
        padding: '12px',
        borderRadius: '8px',
        border: 'none',
        background: '#4F46E5',
        color: 'white',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      sendButtonHighlight: {
        background: '#FBBF24',
        animation: 'pulse 2s infinite',
        boxShadow: '0 0 0 4px rgba(251, 191, 36, 0.3)'
      },
      sendButtonDisabled: {
        background: '#D1D5DB',
        cursor: 'not-allowed'
      }
    });

    // Список чатов
    if (!messengerState.currentChat && !messengerState.showSearch) {
      return (
        <div style={styles.container}>
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <Menu size={28} />
              <h2 style={styles.headerTitle}>MAX</h2>
            </div>
            <button
              onClick={() => step?.action === 'open-search' && handleStepAction('search')}
              style={{
                ...styles.searchButton,
                ...(highlight === 'search-button' ? styles.searchButtonHighlight : {})
              }}
              onMouseEnter={(e) => {
                if (highlight !== 'search-button') e.currentTarget.style.backgroundColor = '#4338CA';
              }}
              onMouseLeave={(e) => {
                if (highlight !== 'search-button') e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Search size={24} />
            </button>
          </div>

          <div style={styles.chatList}>
            {messengerState.chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => step?.action === 'select-chat' && chat.id === 1 && handleStepAction('select-chat')}
                style={{
                  ...styles.chatItem,
                  ...(highlight === `chat-${chat.id}` ? styles.chatItemHighlight : {})
                }}
                onMouseEnter={(e) => {
                  if (highlight !== `chat-${chat.id}`) e.currentTarget.style.backgroundColor = '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  if (highlight !== `chat-${chat.id}`) e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <div style={styles.avatar}>{chat.avatar}</div>
                <div style={styles.chatInfo}>
                  <h3 style={styles.chatName}>{chat.name}</h3>
                  <p style={styles.chatMessage}>{chat.lastMessage}</p>
                </div>
                <span style={styles.chatTime}>{chat.time}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Экран поиска
    if (messengerState.showSearch) {
      const searchResults = contacts.filter(c => 
        c.name.toLowerCase().includes(messengerState.searchQuery.toLowerCase())
      );

      return (
        <div style={styles.container}>
          <div style={styles.searchHeader}>
            <div style={styles.searchHeaderContent}>
              <button 
                onClick={() => setMessengerState(prev => ({ ...prev, showSearch: false, searchQuery: '' }))}
                style={styles.backButton}
              >
                <ArrowLeft size={28} />
              </button>
              <input
                type="text"
                value={messengerState.searchQuery}
                onChange={(e) => {
                  setMessengerState(prev => ({ ...prev, searchQuery: e.target.value }));
                  if (step?.action === 'search-contact' && e.target.value.toLowerCase().includes('мария')) {
                    setTimeout(() => handleStepAction('search-complete'), 500);
                  }
                }}
                placeholder="Поиск контакта..."
                style={styles.searchInput}
                autoFocus
              />
            </div>
          </div>

          <div style={styles.chatList}>
            <div style={styles.contactsLabel}>Контакты</div>
            {searchResults.map(contact => (
              <div
                key={contact.id}
                onClick={() => step?.action === 'create-chat' && contact.name.includes('Мария') && handleStepAction('create-chat')}
                style={{
                  ...styles.contactItem,
                  ...(highlight === 'search-result' && contact.name.includes('Мария') ? styles.contactItemHighlight : {})
                }}
                onMouseEnter={(e) => {
                  if (!(highlight === 'search-result' && contact.name.includes('Мария'))) {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(highlight === 'search-result' && contact.name.includes('Мария'))) {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                <div style={styles.avatar}>{contact.avatar}</div>
                <div style={{flex: 1}}>
                  <h3 style={styles.contactName}>{contact.name}</h3>
                  <p style={styles.contactPhone}>{contact.phone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Открытый чат
    const currentChatData = messengerState.chats.find(c => c.id === messengerState.currentChat);
    const showPhotoGallery = step?.action === 'select-photo';

    return (
      <div style={styles.chatContainer}>
        {/* Шапка чата */}
        <div style={styles.chatHeader}>
          <button
            onClick={() => step?.action === 'back-to-list' && handleStepAction('back')}
            style={{
              ...styles.chatHeaderButton,
              ...(highlight === 'back-button' ? styles.chatHeaderButtonHighlight : {})
            }}
            onMouseEnter={(e) => {
              if (highlight !== 'back-button') e.currentTarget.style.backgroundColor = '#4338CA';
            }}
            onMouseLeave={(e) => {
              if (highlight !== 'back-button') e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ArrowLeft size={28} />
          </button>
          <div style={styles.chatHeaderAvatar}>{currentChatData?.avatar}</div>
          <div style={styles.chatHeaderInfo}>
            <h3 style={styles.chatHeaderName}>{currentChatData?.name}</h3>
            <p style={styles.chatHeaderStatus}>в сети</p>
          </div>
          <Phone size={24} style={{cursor: 'pointer'}} />
          <Video size={24} style={{cursor: 'pointer'}} />
        </div>

        {/* Сообщения */}
        <div style={styles.messagesContainer}>
          {messengerState.messages.map(msg => (
            <div 
              key={msg.id} 
              style={{
                ...styles.messageRow,
                ...(msg.sender === 'me' ? styles.messageRowMe : styles.messageRowOther)
              }}
            >
              <div style={{
                ...styles.messageBubble,
                ...(msg.sender === 'me' ? styles.messageBubbleMe : styles.messageBubbleOther)
              }}>
                <p style={styles.messageText}>{msg.text}</p>
                <p style={{
                  ...styles.messageTime,
                  ...(msg.sender === 'me' ? styles.messageTimeMe : styles.messageTimeOther)
                }}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Галерея фото (если нужно) */}
        {showPhotoGallery && (
          <div style={styles.photoGallery}>
            <p style={styles.galleryTitle}>Выберите фотографию:</p>
            <div style={styles.galleryGrid}>
              {photoGallery.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => handleStepAction('photo-selected')}
                  style={{
                    ...styles.photoItem,
                    ...(highlight === 'photo-gallery' ? styles.photoItemHighlight : {})
                  }}
                  onMouseEnter={(e) => {
                    if (highlight !== 'photo-gallery') e.currentTarget.style.backgroundColor = '#E5E7EB';
                  }}
                  onMouseLeave={(e) => {
                    if (highlight !== 'photo-gallery') e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                >
                  {photo}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Поле ввода - ВСЕГДА внизу */}
        <div style={styles.inputContainer}>
          <button
            onClick={() => step?.action === 'send-photo' && handleStepAction('photo-click')}
            style={{
              ...styles.iconButton,
              ...(highlight === 'photo-button' ? styles.iconButtonHighlight : {})
            }}
            onMouseEnter={(e) => {
              if (highlight !== 'photo-button') e.currentTarget.style.backgroundColor = '#E5E7EB';
            }}
            onMouseLeave={(e) => {
              if (highlight !== 'photo-button') e.currentTarget.style.backgroundColor = '#F3F4F6';
            }}
          >
            <Image size={28} color="#4F46E5" />
          </button>
          <input
            type="text"
            value={messengerState.inputText}
            onChange={(e) => {
              setMessengerState(prev => ({ ...prev, inputText: e.target.value }));
              const expectedText = step?.expectedText?.toLowerCase();
              if (expectedText && e.target.value.toLowerCase().includes(expectedText)) {
                if (step.action === 'type-message') {
                  setTimeout(() => handleStepAction('type-complete'), 500);
                }
              }
            }}
            placeholder="Введите сообщение..."
            style={styles.messageInput}
          />
          <button
            onClick={() => {
              if (step?.action === 'send-message') {
                handleStepAction('send');
              } else if (step?.action === 'send-greeting' && messengerState.inputText) {
                handleStepAction('send-greeting');
              }
            }}
            disabled={!messengerState.inputText}
            style={{
              ...styles.sendButton,
              ...(messengerState.inputText && highlight === 'send-button' ? styles.sendButtonHighlight : {}),
              ...(messengerState.inputText ? {} : styles.sendButtonDisabled)
            }}
            onMouseEnter={(e) => {
              if (messengerState.inputText && highlight !== 'send-button') {
                e.currentTarget.style.backgroundColor = '#4338CA';
              }
            }}
            onMouseLeave={(e) => {
              if (messengerState.inputText && highlight !== 'send-button') {
                e.currentTarget.style.backgroundColor = '#4F46E5';
              }
            }}
          >
            <Send size={28} />
          </button>
        </div>
      </div>
    );
  };

  // Симулятор телефона
  const renderPhone = () => {
    const step = getCurrentStep();
    const lesson = getCurrentLesson();
    const highlight = step?.highlightElement;
    
    // Получаем состояние телефона из messengerState (используем как общее хранилище)
    const phoneState = messengerState;
    
    const handlePhoneAction = (action) => {
      if (action === 'power-button' && step?.action === 'turn-on') {
        setMessengerState(prev => ({ ...prev, isOn: true }));
        setTimeout(() => nextStep(), 1000);
      } else if (action === 'volume-up' && step?.action === 'volume-up') {
        setMessengerState(prev => ({ ...prev, volume: Math.min(100, prev.volume + 10), showVolumeControl: true }));
        setTimeout(() => {
          setMessengerState(prev => ({ ...prev, showVolumeControl: false }));
          nextStep();
        }, 1000);
      } else if (action === 'volume-down' && step?.action === 'volume-down') {
        setMessengerState(prev => ({ ...prev, volume: Math.max(0, prev.volume - 10), showVolumeControl: true }));
        setTimeout(() => {
          setMessengerState(prev => ({ ...prev, showVolumeControl: false }));
          nextStep();
        }, 1000);
      } else if (action === 'power-button-menu' && step?.action === 'open-power-menu') {
        setMessengerState(prev => ({ ...prev, showPowerMenu: true }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'power-off' && step?.action === 'turn-off') {
        setMessengerState(prev => ({ ...prev, showPowerMenu: false, isOn: false }));
        setTimeout(() => nextStep(), 1000);
      } else if (action === 'open-settings' && step?.action === 'open-settings') {
        setMessengerState(prev => ({ ...prev, currentScreen: 'settings' }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'open-wifi' && step?.action === 'open-wifi') {
        setMessengerState(prev => ({ ...prev, currentScreen: 'wifi', showWifiList: true }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'select-wifi' && step?.action === 'select-wifi') {
        setMessengerState(prev => ({ ...prev, currentScreen: 'wifi-password', selectedWifi: 'Домашняя сеть' }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'go-home' && step?.action === 'go-home') {
        setMessengerState(prev => ({ ...prev, currentScreen: 'home' }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'open-appstore' && step?.action === 'open-appstore') {
        setMessengerState(prev => ({ ...prev, currentScreen: 'appstore' }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'select-app' && step?.action === 'select-app') {
        setMessengerState(prev => ({ ...prev, currentScreen: 'app-details', selectedApp: 'Погода' }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'install-app' && step?.action === 'install-app') {
        setMessengerState(prev => ({ ...prev, installingApp: true }));
        setTimeout(() => {
          setMessengerState(prev => ({ 
            ...prev, 
            installingApp: false,
            installedApps: [...prev.installedApps, 'Погода'],
            currentScreen: 'app-installed'
          }));
          setTimeout(() => nextStep(), 1000);
        }, 2000);
      }
    };
    
    const styles = {
      phoneFrame: {
        width: '420px',
        height: '700px',
        background: 'linear-gradient(to bottom, #1F2937, #111827)',
        borderRadius: '40px',
        padding: '12px',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '8px solid #374151'
      },
      powerButton: {
        position: 'absolute',
        right: '-12px',
        top: '120px',
        width: '8px',
        height: '80px',
        background: '#4B5563',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background 0.3s',
        animation: highlight === 'power-button' ? 'pulse 1.5s infinite' : 'none'
      },
      volumeUpButton: {
        position: 'absolute',
        left: '-12px',
        top: '100px',
        width: '8px',
        height: '60px',
        background: '#4B5563',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background 0.3s',
        animation: highlight === 'volume-up-button' ? 'pulse 1.5s infinite' : 'none'
      },
      volumeDownButton: {
        position: 'absolute',
        left: '-12px',
        top: '180px',
        width: '8px',
        height: '60px',
        background: '#4B5563',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background 0.3s',
        animation: highlight === 'volume-down-button' ? 'pulse 1.5s infinite' : 'none'
      },
      screen: {
        width: '100%',
        height: '100%',
        background: phoneState.isOn ? 'white' : '#000',
        borderRadius: '32px',
        overflow: 'hidden',
        position: 'relative'
      },
      bootScreen: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        background: '#000',
        color: 'white'
      },
      homeScreen: {
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, #60A5FA, #3B82F6)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column'
      },
      statusBar: {
        display: 'flex',
        justifyContent: 'space-between',
        color: 'white',
        fontSize: '13px',
        marginBottom: '16px',
        paddingTop: '4px'
      },
      appsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginTop: '40px'
      },
      appIcon: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'transform 0.2s'
      },
      volumeIndicator: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '20px 30px',
        borderRadius: '16px',
        fontSize: '24px',
        zIndex: 100
      },
      powerMenu: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        zIndex: 100,
        minWidth: '250px'
      },
      settingsScreen: {
        width: '100%',
        height: '100%',
        background: '#F3F4F6',
        overflow: 'auto'
      },
      settingsHeader: {
        background: '#4F46E5',
        color: 'white',
        padding: '20px',
        fontSize: '24px',
        fontWeight: 'bold'
      },
      settingsItem: {
        background: 'white',
        padding: '20px',
        marginTop: '1px',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      },
      wifiList: {
        background: 'white',
        marginTop: '10px',
        borderRadius: '12px',
        overflow: 'hidden'
      },
      wifiItem: {
        padding: '16px',
        borderBottom: '1px solid #E5E7EB',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      },
      input: {
        width: '100%',
        padding: '12px',
        fontSize: '16px',
        border: '2px solid #D1D5DB',
        borderRadius: '8px',
        marginBottom: '12px'
      },
      button: {
        width: '100%',
        padding: '14px',
        background: '#4F46E5',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '18px',
        fontWeight: '600',
        cursor: 'pointer'
      },
      appStoreHeader: {
        background: '#4F46E5',
        color: 'white',
        padding: '20px'
      },
      searchBox: {
        width: '100%',
        padding: '12px',
        fontSize: '16px',
        border: 'none',
        borderRadius: '8px',
        marginTop: '10px'
      },
      appsList: {
        padding: '16px'
      },
      appCard: {
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
    };
    
    // Экран выключенного телефона
    if (!phoneState.isOn) {
      return (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
          <div style={styles.phoneFrame}>
            <div 
              style={styles.powerButton}
              onClick={() => handlePhoneAction('power-button')}
              onMouseEnter={(e) => e.currentTarget.style.background = '#6B7280'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#4B5563'}
            />
            <div style={styles.volumeUpButton} />
            <div style={styles.volumeDownButton} />
            <div style={styles.screen}>
              <div style={styles.bootScreen}>
                <div style={{fontSize: '64px', marginBottom: '20px'}}>📱</div>
                <div style={{fontSize: '18px', color: '#9CA3AF'}}>Телефон выключен</div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Индикатор громкости
    const VolumeIndicator = () => phoneState.showVolumeControl && (
      <div style={styles.volumeIndicator}>
        🔊 Громкость: {phoneState.volume}%
        <div style={{
          width: '200px',
          height: '8px',
          background: '#374151',
          borderRadius: '4px',
          marginTop: '12px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${phoneState.volume}%`,
            height: '100%',
            background: '#60A5FA',
            transition: 'width 0.3s'
          }} />
        </div>
      </div>
    );
    
    // Меню выключения
    const PowerMenu = () => phoneState.showPowerMenu && (
      <div style={styles.powerMenu}>
        <h3 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1F2937'}}>
          Питание
        </h3>
        <button
          style={{
            ...styles.button,
            marginBottom: '10px',
            background: '#EF4444',
            animation: highlight === 'power-off-button' ? 'pulse 1.5s infinite' : 'none'
          }}
          onClick={() => handlePhoneAction('power-off')}
        >
          Выключить
        </button>
        <button
          style={{...styles.button, background: '#6B7280'}}
          onClick={() => setMessengerState(prev => ({ ...prev, showPowerMenu: false }))}
        >
          Отмена
        </button>
      </div>
    );
    
    // Главный экран
    const HomeScreen = () => {
      const apps = phoneState.installedApps || lesson?.initialState?.installedApps || [];
      return (
        <div style={styles.homeScreen}>
          <div style={styles.statusBar}>
            <span>12:30</span>
            <div>
              {phoneState.wifiConnected && <span>📶 </span>}
              <span>🔋 85%</span>
            </div>
          </div>
          <div style={styles.appsGrid}>
            {apps.map((app, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.appIcon,
                  animation: (
                    (app === 'Настройки' && highlight === 'settings-app') ||
                    (app === 'RuStore' && highlight === 'rustore-app')
                  ) ? 'pulse 1.5s infinite' : 'none'
                }}
                onClick={() => {
                  if (app === 'Настройки') handlePhoneAction('open-settings');
                  if (app === 'RuStore') handlePhoneAction('open-appstore');
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{
                  fontSize: '48px',
                  background: 'white',
                  width: '70px',
                  height: '70px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  {app === 'Телефон' && '📞'}
                  {app === 'Сообщения' && '💬'}
                  {app === 'Камера' && '📷'}
                  {app === 'Настройки' && '⚙️'}
                  {app === 'RuStore' && '🏪'}
                  {app === 'Погода' && '🌤️'}
                  {!['Телефон', 'Сообщения', 'Камера', 'Настройки', 'RuStore', 'Погода'].includes(app) && '📱'}
                </div>
                <span style={{color: 'white', fontSize: '12px', textAlign: 'center'}}>{app}</span>
              </div>
            ))}
          </div>
        </div>
      );
    };
    
    // Экран настроек
    const SettingsScreen = () => (
      <div style={styles.settingsScreen}>
        <div style={styles.settingsHeader}>Настройки</div>
        <div
          style={{
            ...styles.settingsItem,
            animation: highlight === 'wifi-settings' ? 'pulse 1.5s infinite' : 'none'
          }}
          onClick={() => handlePhoneAction('open-wifi')}
        >
          <div>
            <div style={{fontSize: '18px', fontWeight: '600'}}>Wi-Fi</div>
            <div style={{fontSize: '14px', color: '#6B7280'}}>
              {phoneState.wifiConnected ? 'Подключено' : 'Отключено'}
            </div>
          </div>
          <span style={{fontSize: '24px'}}>📶</span>
        </div>
        <div style={styles.settingsItem}>
          <div style={{fontSize: '18px', fontWeight: '600'}}>Bluetooth</div>
          <span style={{fontSize: '24px'}}>🔵</span>
        </div>
        <div style={styles.settingsItem}>
          <div style={{fontSize: '18px', fontWeight: '600'}}>Звук</div>
          <span style={{fontSize: '24px'}}>🔊</span>
        </div>
      </div>
    );
    
    // Экран Wi-Fi
    const WifiScreen = () => {
      const networks = lesson?.wifiNetworks || [];
      return (
        <div style={styles.settingsScreen}>
          <div style={styles.settingsHeader}>Wi-Fi</div>
          <div style={{padding: '16px'}}>
            <div style={{fontSize: '14px', color: '#6B7280', marginBottom: '12px'}}>
              Доступные сети:
            </div>
            <div style={styles.wifiList}>
              {networks.map((network, idx) => (
                <div
                  key={network.id}
                  style={{
                    ...styles.wifiItem,
                    animation: highlight === `wifi-network-${network.id}` ? 'pulse 1.5s infinite' : 'none'
                  }}
                  onClick={() => handlePhoneAction('select-wifi')}
                >
                  <div>
                    <div style={{fontSize: '16px', fontWeight: '600'}}>{network.name}</div>
                    <div style={{fontSize: '12px', color: '#6B7280'}}>
                      {network.secured ? '🔒 Защищено' : '🔓 Открыто'}
                    </div>
                  </div>
                  <span>
                    {network.signal === 'strong' && '📶📶📶'}
                    {network.signal === 'medium' && '📶📶'}
                    {network.signal === 'weak' && '📶'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    };
    
    // Экран ввода пароля Wi-Fi
    const WifiPasswordScreen = () => (
      <div style={styles.settingsScreen}>
        <div style={styles.settingsHeader}>Подключение к сети</div>
        <div style={{padding: '20px'}}>
          <div style={{fontSize: '18px', fontWeight: '600', marginBottom: '16px'}}>
            Домашняя сеть
          </div>
          <div style={{fontSize: '14px', color: '#6B7280', marginBottom: '12px'}}>
            Эта сеть защищена. Введите пароль:
          </div>
          <input
            key="wifi-password-input"
            ref={wifiPasswordInputRef}
            type="text"
            placeholder="Пароль"
            value={phoneState.wifiPassword || ''}
            onChange={(e) => {
              const newValue = e.target.value;
              setMessengerState(prev => ({ ...prev, wifiPassword: newValue }));
              // Возвращаем фокус
              setTimeout(() => wifiPasswordInputRef.current?.focus(), 0);
              if (step && step.action === 'enter-wifi-password' && newValue === step.expectedText) {
                setTimeout(() => {
                  setMessengerState(prev => ({ ...prev, wifiConnected: true, currentScreen: 'wifi-connected' }));
                  setTimeout(() => nextStep(), 1000);
                }, 500);
              }
            }}
            style={{
              ...styles.input,
              animation: highlight === 'wifi-password-input' ? 'pulse 1.5s infinite' : 'none'
            }}
          />
          <button
            style={styles.button}
            onClick={() => handlePhoneAction('enter-password')}
            disabled={phoneState.wifiPassword !== step?.expectedText}
          >
            Подключить
          </button>
          <div style={{fontSize: '12px', color: '#6B7280', marginTop: '12px', textAlign: 'center'}}>
            💡 Подсказка: пароль "12345678"
          </div>
        </div>
      </div>
    );
    
    // Экран успешного подключения Wi-Fi
    const WifiConnectedScreen = () => (
      <div style={{
        ...styles.settingsScreen,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <div style={{fontSize: '80px', marginBottom: '20px'}}>✅</div>
        <div style={{fontSize: '24px', fontWeight: 'bold', color: '#059669', marginBottom: '12px'}}>
          Подключено!
        </div>
        <div style={{fontSize: '16px', color: '#6B7280'}}>
          Домашняя сеть
        </div>
      </div>
    );
    
    // Экран магазина приложений
    const AppStoreScreen = () => {
      const apps = lesson?.availableApps || [];
      const filteredApps = phoneState.searchQuery 
        ? apps.filter(app => app.name.toLowerCase().includes(phoneState.searchQuery.toLowerCase()))
        : apps;
      
      return (
        <div style={styles.settingsScreen}>
          <div style={styles.appStoreHeader}>
            <div style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '12px'}}>RuStore</div>
            <input
              key="app-search-input"
              ref={appSearchInputRef}
              type="text"
              placeholder="Поиск приложений..."
              value={phoneState.searchQuery || ''}
              onChange={(e) => {
                const newValue = e.target.value;
                setMessengerState(prev => ({ ...prev, searchQuery: newValue }));
                // Возвращаем фокус
                setTimeout(() => appSearchInputRef.current?.focus(), 0);
                if (step && step.action === 'search-app' && newValue === step.expectedText) {
                  setTimeout(() => nextStep(), 800);
                }
              }}
              style={{
                ...styles.searchBox,
                animation: highlight === 'app-search' ? 'pulse 1.5s infinite' : 'none'
              }}
            />
          </div>
          <div style={styles.appsList}>
            {filteredApps.map((app, idx) => (
              <div
                key={app.id}
                style={{
                  ...styles.appCard,
                  animation: highlight === `app-result-${app.id}` ? 'pulse 1.5s infinite' : 'none'
                }}
                onClick={() => handlePhoneAction('select-app')}
              >
                <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
                  <div style={{fontSize: '48px'}}>{app.icon}</div>
                  <div style={{flex: 1}}>
                    <div style={{fontSize: '18px', fontWeight: '600'}}>{app.name}</div>
                    <div style={{fontSize: '14px', color: '#6B7280'}}>
                      ⭐ {app.rating} • {app.downloads} загрузок
                    </div>
                    <div style={{fontSize: '12px', color: '#9CA3AF'}}>{app.size}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };
    
    // Экран деталей приложения
    const AppDetailsScreen = () => (
      <div style={styles.settingsScreen}>
        <div style={styles.appStoreHeader}>
          <div style={{fontSize: '80px', textAlign: 'center', marginBottom: '16px'}}>🌤️</div>
          <div style={{fontSize: '24px', fontWeight: 'bold', textAlign: 'center'}}>Погода</div>
          <div style={{fontSize: '14px', textAlign: 'center', marginTop: '8px', opacity: 0.9}}>
            ⭐ 4.5 • 1M+ загрузок • 25 МБ
          </div>
        </div>
        <div style={{padding: '20px'}}>
          <button
            style={{
              ...styles.button,
              animation: highlight === 'install-button' ? 'pulse 1.5s infinite' : 'none'
            }}
            onClick={() => handlePhoneAction('install-app')}
            disabled={phoneState.installingApp}
          >
            {phoneState.installingApp ? 'Установка...' : 'Установить'}
          </button>
          <div style={{marginTop: '20px'}}>
            <div style={{fontSize: '16px', fontWeight: '600', marginBottom: '8px'}}>Описание</div>
            <div style={{fontSize: '14px', color: '#6B7280', lineHeight: '1.6'}}>
              Приложение "Погода" показывает актуальный прогноз погоды для вашего региона. 
              Узнайте температуру, осадки и другие метеоусловия на неделю вперед.
            </div>
          </div>
        </div>
      </div>
    );
    
    // Экран успешной установки
    const AppInstalledScreen = () => (
      <div style={{
        ...styles.settingsScreen,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <div style={{fontSize: '80px', marginBottom: '20px'}}>✅</div>
        <div style={{fontSize: '24px', fontWeight: 'bold', color: '#059669', marginBottom: '12px'}}>
          Установлено!
        </div>
        <div style={{fontSize: '16px', color: '#6B7280'}}>
          Приложение "Погода" готово к использованию
        </div>
      </div>
    );
    
    // Выбор экрана в зависимости от состояния
    let screenContent = <HomeScreen />;
    if (phoneState.currentScreen === 'settings') screenContent = <SettingsScreen />;
    if (phoneState.currentScreen === 'wifi') screenContent = <WifiScreen />;
    if (phoneState.currentScreen === 'wifi-password') screenContent = <WifiPasswordScreen />;
    if (phoneState.currentScreen === 'wifi-connected') screenContent = <WifiConnectedScreen />;
    if (phoneState.currentScreen === 'appstore') screenContent = <AppStoreScreen />;
    if (phoneState.currentScreen === 'app-details') screenContent = <AppDetailsScreen />;
    if (phoneState.currentScreen === 'app-installed') screenContent = <AppInstalledScreen />;
    
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
        <div style={styles.phoneFrame}>
          <div 
            style={styles.powerButton}
            onClick={() => handlePhoneAction('power-button-menu')}
            onMouseEnter={(e) => e.currentTarget.style.background = '#6B7280'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#4B5563'}
          />
          <div 
            style={styles.volumeUpButton}
            onClick={() => handlePhoneAction('volume-up')}
            onMouseEnter={(e) => e.currentTarget.style.background = '#6B7280'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#4B5563'}
          />
          <div 
            style={styles.volumeDownButton}
            onClick={() => handlePhoneAction('volume-down')}
            onMouseEnter={(e) => e.currentTarget.style.background = '#6B7280'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#4B5563'}
          />
          <div style={styles.screen}>
            {screenContent}
            <VolumeIndicator />
            <PowerMenu />
            
            {/* Кнопка Home */}
            {phoneState.currentScreen && phoneState.currentScreen !== 'home' && (
              <div 
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'white',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  cursor: 'pointer',
                  animation: highlight === 'home-button' ? 'pulse 1.5s infinite' : 'none'
                }}
                onClick={() => handlePhoneAction('go-home')}
              >
                🏠
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Симулятор интернет-магазина
  const renderShop = () => {
    const step = getCurrentStep();
    const lesson = getCurrentLesson();
    const highlight = step?.highlightElement;
    
    // Получаем состояние магазина из messengerState
    const shopState = messengerState;
    const categories = lesson?.categories || [];
    const products = lesson?.products || [];
    const deliveryMethods = lesson?.deliveryMethods || [];
    const addresses = lesson?.addresses || [];
    const paymentMethods = lesson?.paymentMethods || [];
    
    const handleShopAction = (action, data) => {
      if (action === 'select-category' && step?.action === 'select-category') {
        setMessengerState(prev => ({ ...prev, selectedCategory: data, currentScreen: 'products' }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'select-product' && (step?.action === 'select-product' || step?.action === 'select-second-product')) {
        setMessengerState(prev => ({ ...prev, selectedProduct: data, currentScreen: 'product-detail' }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'add-to-cart' && (step?.action === 'add-to-cart' || step?.action === 'add-second-to-cart')) {
        const product = products.find(p => p.id === shopState.selectedProduct);
        setMessengerState(prev => ({ 
          ...prev, 
          cart: [...prev.cart, product],
          currentScreen: 'cart-added'
        }));
        setTimeout(() => nextStep(), 1000);
      } else if (action === 'back' && step?.action === 'continue-shopping') {
        setMessengerState(prev => ({ ...prev, currentScreen: 'products' }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'open-cart' && step?.action === 'open-cart') {
        setMessengerState(prev => ({ ...prev, showCart: true, currentScreen: 'cart' }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'checkout' && step?.action === 'start-checkout') {
        setMessengerState(prev => ({ ...prev, currentScreen: 'checkout' }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'select-delivery' && step?.action === 'select-delivery-method') {
        setMessengerState(prev => ({ ...prev, deliveryMethod: data }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'select-address' && step?.action === 'select-address') {
        setMessengerState(prev => ({ ...prev, deliveryAddress: data }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'select-payment' && step?.action === 'select-payment') {
        setMessengerState(prev => ({ ...prev, paymentMethod: data }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'confirm-order' && step?.action === 'confirm-order') {
        setMessengerState(prev => ({ ...prev, orderCreated: true, currentScreen: 'order-success' }));
        setTimeout(() => nextStep(), 1000);
      }
    };
    
    const styles = {
      container: {
        height: '100%',
        background: '#F9FAFB',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      },
      header: {
        background: '#10B981',
        color: 'white',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      },
      content: {
        flex: 1,
        overflow: 'auto',
        padding: '20px'
      },
      categoriesGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        marginTop: '20px'
      },
      categoryCard: {
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center',
        cursor: 'pointer',
        border: '2px solid #E5E7EB',
        transition: 'all 0.3s'
      },
      productsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px'
      },
      productCard: {
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        border: '2px solid #E5E7EB',
        transition: 'all 0.3s'
      },
      productDetail: {
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '500px',
        margin: '0 auto'
      },
      button: {
        width: '100%',
        padding: '16px',
        background: '#10B981',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '18px',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '16px'
      },
      backButton: {
        padding: '12px 24px',
        background: '#6B7280',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        cursor: 'pointer',
        marginBottom: '16px'
      },
      cartIcon: {
        position: 'relative',
        cursor: 'pointer',
        fontSize: '28px'
      },
      cartBadge: {
        position: 'absolute',
        top: '-8px',
        right: '-8px',
        background: '#EF4444',
        color: 'white',
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold'
      },
      cartItem: {
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center'
      },
      checkoutCard: {
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px'
      },
      optionCard: {
        border: '2px solid #E5E7EB',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s'
      },
      optionCardSelected: {
        border: '2px solid #10B981',
        background: '#F0FDF4'
      },
      successScreen: {
        textAlign: 'center',
        padding: '40px',
        background: 'white',
        borderRadius: '16px',
        maxWidth: '500px',
        margin: '40px auto'
      }
    };
    
    // Каталог категорий
    const CatalogScreen = () => (
      <div style={styles.content}>
        <h2 style={{fontSize: '28px', fontWeight: 'bold', marginBottom: '8px'}}>Каталог товаров</h2>
        <p style={{color: '#6B7280', marginBottom: '20px'}}>Выберите категорию для просмотра товаров</p>
        <div style={styles.categoriesGrid}>
          {categories.map(cat => (
            <div
              key={cat.id}
              style={{
                ...styles.categoryCard,
                animation: highlight === `category-${cat.id}` ? 'pulse 1.5s infinite' : 'none'
              }}
              onClick={() => handleShopAction('select-category', cat.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#10B981';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div style={{fontSize: '48px', marginBottom: '12px'}}>{cat.icon}</div>
              <div style={{fontSize: '20px', fontWeight: '600'}}>{cat.name}</div>
            </div>
          ))}
        </div>
      </div>
    );
    
    // Список товаров
    const ProductsScreen = () => {
      const categoryProducts = products.filter(p => p.category === shopState.selectedCategory);
      const category = categories.find(c => c.id === shopState.selectedCategory);
      
      return (
        <div style={styles.content}>
          <button 
            style={{
              ...styles.backButton,
              animation: highlight === 'back-button' ? 'pulse 1.5s infinite' : 'none'
            }}
            onClick={() => setMessengerState(prev => ({ ...prev, currentScreen: 'catalog' }))}
          >
            ← Назад
          </button>
          <h2 style={{fontSize: '28px', fontWeight: 'bold', marginBottom: '8px'}}>
            {category?.icon} {category?.name}
          </h2>
          <p style={{color: '#6B7280', marginBottom: '20px'}}>Найдено товаров: {categoryProducts.length}</p>
          <div style={styles.productsGrid}>
            {categoryProducts.map(product => (
              <div
                key={product.id}
                style={{
                  ...styles.productCard,
                  animation: highlight === `product-${product.id}` ? 'pulse 1.5s infinite' : 'none'
                }}
                onClick={() => handleShopAction('select-product', product.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#10B981';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{fontSize: '64px', textAlign: 'center', marginBottom: '12px'}}>{product.image}</div>
                <h3 style={{fontSize: '16px', fontWeight: '600', marginBottom: '8px'}}>{product.name}</h3>
                <div style={{fontSize: '14px', color: '#6B7280', marginBottom: '8px'}}>
                  ⭐ {product.rating} ({product.reviews} отзывов)
                </div>
                <div style={{fontSize: '20px', fontWeight: 'bold', color: '#10B981'}}>
                  {product.price.toLocaleString()}₽
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };
    
    // Детали товара
    const ProductDetailScreen = () => {
      const product = products.find(p => p.id === shopState.selectedProduct);
      if (!product) return null;
      
      return (
        <div style={styles.content}>
          <button 
            style={{
              ...styles.backButton,
              animation: highlight === 'back-button' ? 'pulse 1.5s infinite' : 'none'
            }}
            onClick={() => setMessengerState(prev => ({ ...prev, currentScreen: 'products' }))}
          >
            ← Назад
          </button>
          <div style={styles.productDetail}>
            <div style={{fontSize: '120px', textAlign: 'center', marginBottom: '24px'}}>{product.image}</div>
            <h2 style={{fontSize: '28px', fontWeight: 'bold', marginBottom: '12px'}}>{product.name}</h2>
            <div style={{fontSize: '16px', color: '#6B7280', marginBottom: '16px'}}>
              ⭐ {product.rating} • {product.reviews} отзывов
            </div>
            <div style={{fontSize: '32px', fontWeight: 'bold', color: '#10B981', marginBottom: '24px'}}>
              {product.price.toLocaleString()}₽
            </div>
            <div style={{background: '#F3F4F6', padding: '16px', borderRadius: '12px', marginBottom: '16px'}}>
              <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '8px'}}>Описание</h3>
              <p style={{color: '#6B7280', lineHeight: '1.6'}}>
                Качественный товар с отличными характеристиками. Быстрая доставка по всей России.
                {product.inStock && ' Товар в наличии на складе.'}
              </p>
            </div>
            <button
              style={{
                ...styles.button,
                animation: highlight === 'add-to-cart-button' ? 'pulse 1.5s infinite' : 'none'
              }}
              onClick={() => handleShopAction('add-to-cart')}
            >
              🛒 Добавить в корзину
            </button>
          </div>
        </div>
      );
    };
    
    // Подтверждение добавления в корзину
    const CartAddedScreen = () => (
      <div style={{...styles.content, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{textAlign: 'center'}}>
          <div style={{fontSize: '80px', marginBottom: '20px'}}>✅</div>
          <h2 style={{fontSize: '28px', fontWeight: 'bold', marginBottom: '12px'}}>Товар добавлен в корзину!</h2>
          <button
            style={{
              ...styles.button,
              maxWidth: '300px',
              animation: highlight === 'back-button' ? 'pulse 1.5s infinite' : 'none'
            }}
            onClick={() => handleShopAction('back')}
          >
            Продолжить покупки
          </button>
        </div>
      </div>
    );
    
    // Корзина
    const CartScreen = () => {
      const total = shopState.cart.reduce((sum, item) => sum + item.price, 0);
      
      return (
        <div style={styles.content}>
          <h2 style={{fontSize: '28px', fontWeight: 'bold', marginBottom: '20px'}}>Корзина</h2>
          {shopState.cart.length === 0 ? (
            <div style={{textAlign: 'center', padding: '40px', color: '#6B7280'}}>
              <div style={{fontSize: '64px', marginBottom: '16px'}}>🛒</div>
              <p>Корзина пуста</p>
            </div>
          ) : (
            <>
              {shopState.cart.map((item, idx) => (
                <div key={idx} style={styles.cartItem}>
                  <div style={{fontSize: '48px'}}>{item.image}</div>
                  <div style={{flex: 1}}>
                    <h3 style={{fontSize: '18px', fontWeight: '600'}}>{item.name}</h3>
                    <p style={{color: '#6B7280'}}>1 шт.</p>
                  </div>
                  <div style={{fontSize: '20px', fontWeight: 'bold', color: '#10B981'}}>
                    {item.price.toLocaleString()}₽
                  </div>
                </div>
              ))}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                marginTop: '20px'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '24px', fontWeight: 'bold'}}>
                  <span>Итого:</span>
                  <span style={{color: '#10B981'}}>{total.toLocaleString()}₽</span>
                </div>
              </div>
              <button
                style={{
                  ...styles.button,
                  animation: highlight === 'checkout-button' ? 'pulse 1.5s infinite' : 'none'
                }}
                onClick={() => handleShopAction('checkout')}
              >
                Оформить заказ
              </button>
            </>
          )}
        </div>
      );
    };
    
    // Оформление заказа
    const CheckoutScreen = () => {
      const total = shopState.cart.reduce((sum, item) => sum + item.price, 0);
      const deliveryCost = shopState.deliveryMethod === 'courier' ? 300 : 0;
      const finalTotal = total + deliveryCost;
      
      return (
        <div style={styles.content}>
          <h2 style={{fontSize: '28px', fontWeight: 'bold', marginBottom: '20px'}}>Оформление заказа</h2>
          
          {/* Способ доставки */}
          <div style={styles.checkoutCard}>
            <h3 style={{fontSize: '20px', fontWeight: '600', marginBottom: '16px'}}>1. Способ доставки</h3>
            {deliveryMethods.map(method => (
              <div
                key={method.id}
                style={{
                  ...styles.optionCard,
                  ...(shopState.deliveryMethod === method.id ? styles.optionCardSelected : {}),
                  animation: highlight === `delivery-${method.id}` ? 'pulse 1.5s infinite' : 'none'
                }}
                onClick={() => handleShopAction('select-delivery', method.id)}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <div style={{fontSize: '20px', marginBottom: '4px'}}>
                      {method.icon} {method.name}
                    </div>
                    <div style={{fontSize: '14px', color: '#6B7280'}}>
                      {method.days} • {method.price === 0 ? 'Бесплатно' : `${method.price}₽`}
                    </div>
                  </div>
                  {shopState.deliveryMethod === method.id && <span style={{fontSize: '24px'}}>✓</span>}
                </div>
              </div>
            ))}
          </div>
          
          {/* Адрес доставки */}
          {shopState.deliveryMethod && (
            <div style={styles.checkoutCard}>
              <h3 style={{fontSize: '20px', fontWeight: '600', marginBottom: '16px'}}>2. Адрес доставки</h3>
              {addresses.map(addr => (
                <div
                  key={addr.id}
                  style={{
                    ...styles.optionCard,
                    ...(shopState.deliveryAddress === addr.id ? styles.optionCardSelected : {}),
                    animation: highlight === `address-${addr.id}` ? 'pulse 1.5s infinite' : 'none'
                  }}
                  onClick={() => handleShopAction('select-address', addr.id)}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      <div style={{fontSize: '16px', fontWeight: '600', marginBottom: '4px'}}>{addr.address}</div>
                      <div style={{fontSize: '14px', color: '#6B7280'}}>{addr.city}</div>
                    </div>
                    {shopState.deliveryAddress === addr.id && <span style={{fontSize: '24px'}}>✓</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Способ оплаты */}
          {shopState.deliveryAddress && (
            <div style={styles.checkoutCard}>
              <h3 style={{fontSize: '20px', fontWeight: '600', marginBottom: '16px'}}>3. Способ оплаты</h3>
              {paymentMethods.map(method => (
                <div
                  key={method.id}
                  style={{
                    ...styles.optionCard,
                    ...(shopState.paymentMethod === method.id ? styles.optionCardSelected : {}),
                    animation: highlight === `payment-${method.id}` ? 'pulse 1.5s infinite' : 'none'
                  }}
                  onClick={() => handleShopAction('select-payment', method.id)}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{fontSize: '18px'}}>
                      {method.icon} {method.name}
                    </div>
                    {shopState.paymentMethod === method.id && <span style={{fontSize: '24px'}}>✓</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Итого */}
          {shopState.paymentMethod && (
            <div style={styles.checkoutCard}>
              <h3 style={{fontSize: '20px', fontWeight: '600', marginBottom: '12px'}}>Итого</h3>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                <span>Товары:</span>
                <span>{total.toLocaleString()}₽</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px'}}>
                <span>Доставка:</span>
                <span>{deliveryCost === 0 ? 'Бесплатно' : `${deliveryCost}₽`}</span>
              </div>
              <div style={{
                borderTop: '2px solid #E5E7EB',
                paddingTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                <span>Итого:</span>
                <span style={{color: '#10B981'}}>{finalTotal.toLocaleString()}₽</span>
              </div>
              <button
                style={{
                  ...styles.button,
                  animation: highlight === 'confirm-button' ? 'pulse 1.5s infinite' : 'none'
                }}
                onClick={() => handleShopAction('confirm-order')}
              >
                Подтвердить заказ
              </button>
            </div>
          )}
        </div>
      );
    };
    
    // Успешное создание заказа
    const OrderSuccessScreen = () => {
      const total = shopState.cart.reduce((sum, item) => sum + item.price, 0);
      const deliveryCost = shopState.deliveryMethod === 'courier' ? 300 : 0;
      const address = addresses.find(a => a.id === shopState.deliveryAddress);
      
      return (
        <div style={styles.content}>
          <div style={styles.successScreen}>
            <div style={{fontSize: '80px', marginBottom: '20px'}}>🎉</div>
            <h2 style={{fontSize: '28px', fontWeight: 'bold', color: '#10B981', marginBottom: '12px'}}>
              Заказ успешно создан!
            </h2>
            <div style={{fontSize: '20px', color: '#6B7280', marginBottom: '24px'}}>
              Номер заказа: #{Math.floor(Math.random() * 100000)}
            </div>
            <div style={{textAlign: 'left', background: '#F9FAFB', padding: '20px', borderRadius: '12px'}}>
              <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '12px'}}>Детали заказа:</h3>
              <p style={{marginBottom: '8px'}}>📦 Товаров: {shopState.cart.length} шт.</p>
              <p style={{marginBottom: '8px'}}>💰 Сумма: {(total + deliveryCost).toLocaleString()}₽</p>
              <p style={{marginBottom: '8px'}}>🚚 Доставка: {shopState.deliveryMethod === 'courier' ? 'Курьер' : 'Пункт выдачи'}</p>
              <p>📍 Адрес: {address?.address}</p>
            </div>
          </div>
        </div>
      );
    };
    
    // Выбор экрана
    let screenContent = <CatalogScreen />;
    if (shopState.currentScreen === 'products') screenContent = <ProductsScreen />;
    if (shopState.currentScreen === 'product-detail') screenContent = <ProductDetailScreen />;
    if (shopState.currentScreen === 'cart-added') screenContent = <CartAddedScreen />;
    if (shopState.currentScreen === 'cart' || shopState.showCart) screenContent = <CartScreen />;
    if (shopState.currentScreen === 'checkout') screenContent = <CheckoutScreen />;
    if (shopState.currentScreen === 'order-success') screenContent = <OrderSuccessScreen />;
    
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={{fontSize: '24px', fontWeight: 'bold'}}>🛒 Интернет-магазин</h1>
          <div 
            style={{
              ...styles.cartIcon,
              animation: highlight === 'cart-icon' ? 'pulse 1.5s infinite' : 'none'
            }}
            onClick={() => handleShopAction('open-cart')}
          >
            🛒
            {shopState.cart && shopState.cart.length > 0 && (
              <div style={styles.cartBadge}>{shopState.cart.length}</div>
            )}
          </div>
        </div>
        {screenContent}
      </div>
    );
  };

  // Симулятор Госуслуг
  const renderGosuslugi = () => {
    const step = getCurrentStep();
    const lesson = getCurrentLesson();
    const highlight = step?.highlightElement;
    
    const gosuslugState = messengerState;
    const loginMethods = lesson?.loginMethods || [];
    const specialties = lesson?.specialties || [];
    const doctors = lesson?.doctors || [];
    const clinics = lesson?.clinics || [];
    const availableDates = lesson?.availableDates || [];
    const availableTimes = lesson?.availableTimes || [];
    
    const handleGosuslugAction = (action, data) => {
      if (action === 'select-login-method' && step?.action === 'select-login-method') {
        setMessengerState(prev => ({ ...prev, loginMethod: data, currentScreen: 'login-form' }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'select-service' && step?.action === 'select-service') {
        setMessengerState(prev => ({ ...prev, selectedService: data, currentScreen: 'service-doctor' }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'select-specialty' && step?.action === 'select-specialty') {
        setMessengerState(prev => ({ ...prev, selectedSpecialty: data, currentScreen: 'doctors-list' }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'select-doctor' && step?.action === 'select-doctor') {
        setMessengerState(prev => ({ ...prev, selectedDoctor: data, currentScreen: 'clinics-list' }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'select-clinic' && step?.action === 'select-clinic') {
        setMessengerState(prev => ({ ...prev, selectedClinic: data, currentScreen: 'dates-list' }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'select-date' && step?.action === 'select-date') {
        setMessengerState(prev => ({ ...prev, selectedDate: data, currentScreen: 'times-list' }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'select-time' && step?.action === 'select-time') {
        setMessengerState(prev => ({ ...prev, selectedTime: data, currentScreen: 'appointment-confirm' }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'confirm-appointment' && step?.action === 'confirm-appointment') {
        setMessengerState(prev => ({ ...prev, appointmentBooked: true, currentScreen: 'appointment-success' }));
        setTimeout(() => nextStep(), 1000);
      } else if (action === 'back-to-menu' && step?.action === 'appointment-confirmed') {
        setMessengerState(prev => ({ ...prev, currentScreen: 'dashboard' }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'select-certificate' && step?.action === 'select-certificate-service') {
        setMessengerState(prev => ({ ...prev, currentScreen: 'certificate-info' }));
        setTimeout(() => nextStep(), 800);
      } else if (action === 'request-certificate' && step?.action === 'request-certificate') {
        setMessengerState(prev => ({ ...prev, certificateRequested: true, currentScreen: 'certificate-verify' }));
        setTimeout(() => {
          setMessengerState(prev => ({ ...prev, currentScreen: 'certificate-issued', certificateIssued: true }));
          setTimeout(() => nextStep(), 1500);
        }, 2000);
      }
    };
    
    const styles = {
      container: {
        height: '100%',
        background: 'linear-gradient(to bottom, #0D47A1, #1976D2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      },
      header: {
        background: 'rgba(255, 255, 255, 0.1)',
        color: 'white',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0
      },
      content: {
        flex: 1,
        overflow: 'auto',
        padding: '20px'
      },
      whiteCard: {
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '600px',
        margin: '0 auto'
      },
      loginMethod: {
        border: '2px solid #E5E7EB',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      },
      input: {
        width: '100%',
        padding: '14px',
        fontSize: '16px',
        border: '2px solid #D1D5DB',
        borderRadius: '12px',
        marginBottom: '16px'
      },
      button: {
        width: '100%',
        padding: '16px',
        background: '#0D47A1',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '18px',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '16px'
      },
      serviceCard: {
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '16px',
        cursor: 'pointer',
        border: '2px solid transparent',
        transition: 'all 0.3s'
      },
      optionCard: {
        border: '2px solid #E5E7EB',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s'
      },
      selectedCard: {
        border: '2px solid #0D47A1',
        background: '#E3F2FD'
      }
    };
    
    // Экран входа - выбор метода
    const LoginScreen = () => (
      <div style={styles.content}>
        <div style={styles.whiteCard}>
          <h2 style={{fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#0D47A1'}}>
            Вход в Госуслуги
          </h2>
          <p style={{color: '#6B7280', marginBottom: '24px'}}>Выберите способ входа</p>
          {loginMethods.map(method => (
            <div
              key={method.id}
              style={{
                ...styles.loginMethod,
                animation: highlight === `login-${method.id}` ? 'pulse 1.5s infinite' : 'none'
              }}
              onClick={() => handleGosuslugAction('select-login-method', method.id)}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0D47A1'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
            >
              <div style={{fontSize: '32px'}}>{method.icon}</div>
              <div style={{fontSize: '18px', fontWeight: '600'}}>{method.name}</div>
            </div>
          ))}
        </div>
      </div>
    );
    
    // Экран ввода логина и пароля
    const LoginFormScreen = () => {
      const method = loginMethods.find(m => m.id === gosuslugState.loginMethod);
      return (
        <div style={styles.content}>
          <div style={styles.whiteCard}>
            <h2 style={{fontSize: '28px', fontWeight: 'bold', marginBottom: '24px', color: '#0D47A1'}}>
              Вход через {method?.name}
            </h2>
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                {method?.name}
              </label>
              <input
                key="phone-input"
                ref={phoneInputRef}
                type="text"
                placeholder={method?.placeholder}
                value={gosuslugState.loginValue || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setMessengerState(prev => ({ ...prev, loginValue: newValue }));
                  // Возвращаем фокус
                  setTimeout(() => phoneInputRef.current?.focus(), 0);
                  // Проверяем совпадение ТОЛЬКО когда введён весь текст
                  if (step && step.action === 'enter-phone' && newValue === step.expectedText) {
                    setTimeout(() => nextStep(), 800);
                  }
                }}
                style={{
                  ...styles.input,
                  animation: highlight === 'phone-input' ? 'pulse 1.5s infinite' : 'none'
                }}
              />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                Пароль
              </label>
              <input
                key="password-input"
                ref={passwordInputRef}
                type="password"
                placeholder="Введите пароль"
                value={gosuslugState.password || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setMessengerState(prev => ({ ...prev, password: newValue }));
                  // Возвращаем фокус
                  setTimeout(() => passwordInputRef.current?.focus(), 0);
                  if (step && step.action === 'enter-password' && newValue === step.expectedText) {
                    setTimeout(() => {
                      setMessengerState(prev => ({ ...prev, isLoggedIn: true, currentScreen: 'logged-in' }));
                      setTimeout(() => nextStep(), 1000);
                    }, 500);
                  }
                }}
                style={{
                  ...styles.input,
                  animation: highlight === 'password-input' ? 'pulse 1.5s infinite' : 'none'
                }}
              />
            </div>
            <button style={styles.button}>
              Войти
            </button>
            {step?.action === 'enter-phone' && (
              <p style={{marginTop: '12px', color: '#6B7280', fontSize: '14px', textAlign: 'center'}}>
                💡 Подсказка: +7 (999) 123-45-67
              </p>
            )}
            {step?.action === 'enter-password' && (
              <p style={{marginTop: '12px', color: '#6B7280', fontSize: '14px', textAlign: 'center'}}>
                💡 Подсказка: password123
              </p>
            )}
          </div>
        </div>
      );
    };
    
    // Экран успешного входа
    const LoggedInScreen = () => (
      <div style={styles.content}>
        <div style={styles.whiteCard}>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '80px', marginBottom: '20px'}}>✅</div>
            <h2 style={{fontSize: '28px', fontWeight: 'bold', color: '#059669', marginBottom: '12px'}}>
              Вход выполнен успешно!
            </h2>
            <p style={{color: '#6B7280', fontSize: '18px'}}>
              Добро пожаловать в личный кабинет Госуслуг
            </p>
          </div>
        </div>
      </div>
    );
    
    // Главное меню услуг (Dashboard)
    const DashboardScreen = () => (
      <div style={styles.content}>
        <h2 style={{fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '20px'}}>
          Популярные услуги
        </h2>
        <div style={{
          ...styles.serviceCard,
          animation: highlight === 'service-doctor' ? 'pulse 1.5s infinite' : 'none'
        }}
        onClick={() => handleGosuslugAction('select-service', 'doctor')}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{fontSize: '48px', marginBottom: '12px'}}>👨‍⚕️</div>
          <h3 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '8px'}}>Запись на приём к врачу</h3>
          <p style={{color: '#6B7280'}}>Запишитесь к специалисту онлайн</p>
        </div>
        <div style={{
          ...styles.serviceCard,
          animation: highlight === 'service-certificate' ? 'pulse 1.5s infinite' : 'none'
        }}
        onClick={() => handleGosuslugAction('select-certificate')}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{fontSize: '48px', marginBottom: '12px'}}>📄</div>
          <h3 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '8px'}}>Электронное свидетельство пенсионера</h3>
          <p style={{color: '#6B7280'}}>Получите цифровой документ</p>
        </div>
      </div>
    );
    
    // Запись к врачу - ввод полиса
    const DoctorServiceScreen = () => (
      <div style={styles.content}>
        <div style={styles.whiteCard}>
          <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#0D47A1'}}>
            Запись на приём к врачу
          </h2>
          <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Номер полиса ОМС</label>
          <input
            key="policy-input"
            ref={policyInputRef}
            type="text"
            placeholder="0000 0000 0000 0000"
            value={gosuslugState.policyNumber || ''}
            onChange={(e) => {
              const newValue = e.target.value;
              setMessengerState(prev => ({ ...prev, policyNumber: newValue }));
              // Возвращаем фокус
              setTimeout(() => policyInputRef.current?.focus(), 0);
              if (step && step.action === 'enter-policy' && newValue === step.expectedText) {
                setTimeout(() => {
                  setMessengerState(prev => ({ ...prev, currentScreen: 'specialties-list' }));
                  setTimeout(() => nextStep(), 800);
                }, 500);
              }
            }}
            style={{
              ...styles.input,
              animation: highlight === 'policy-input' ? 'pulse 1.5s infinite' : 'none'
            }}
          />
          <p style={{color: '#6B7280', fontSize: '14px'}}>
            💡 Подсказка: 1234567890123456
          </p>
        </div>
      </div>
    );
    
    // Выбор специальности
    const SpecialtiesScreen = () => (
      <div style={styles.content}>
        <div style={styles.whiteCard}>
          <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#0D47A1'}}>
            Выберите специальность
          </h2>
          {specialties.map(spec => (
            <div
              key={spec.id}
              style={{
                ...styles.optionCard,
                animation: highlight === `specialty-${spec.id}` ? 'pulse 1.5s infinite' : 'none'
              }}
              onClick={() => handleGosuslugAction('select-specialty', spec.id)}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0D47A1'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <span style={{fontSize: '32px'}}>{spec.icon}</span>
                  <span style={{fontSize: '18px', fontWeight: '600'}}>{spec.name}</span>
                </div>
                <span style={{color: '#6B7280'}}>Доступно: {spec.available}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
    
    // Список врачей
    const DoctorsScreen = () => {
      const filteredDoctors = doctors.filter(d => d.specialty === gosuslugState.selectedSpecialty);
      return (
        <div style={styles.content}>
          <div style={styles.whiteCard}>
            <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#0D47A1'}}>
              Выберите врача
            </h2>
            {filteredDoctors.map(doctor => (
              <div
                key={doctor.id}
                style={{
                  ...styles.optionCard,
                  animation: highlight === `doctor-${doctor.id}` ? 'pulse 1.5s infinite' : 'none'
                }}
                onClick={() => handleGosuslugAction('select-doctor', doctor.id)}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0D47A1'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
              >
                <div style={{fontSize: '16px', fontWeight: '600', marginBottom: '4px'}}>{doctor.name}</div>
                <div style={{fontSize: '14px', color: '#6B7280'}}>
                  Стаж: {doctor.experience} • Рейтинг: ⭐ {doctor.rating}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };
    
    // Список поликлиник  
    const ClinicsScreen = () => (
      <div style={styles.content}>
        <div style={styles.whiteCard}>
          <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#0D47A1'}}>
            Выберите поликлинику
          </h2>
          {clinics.map(clinic => (
            <div
              key={clinic.id}
              style={{
                ...styles.optionCard,
                animation: highlight === `clinic-${clinic.id}` ? 'pulse 1.5s infinite' : 'none'
              }}
              onClick={() => handleGosuslugAction('select-clinic', clinic.id)}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0D47A1'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
            >
              <div style={{fontSize: '16px', fontWeight: '600', marginBottom: '4px'}}>{clinic.name}</div>
              <div style={{fontSize: '14px', color: '#6B7280'}}>{clinic.address}</div>
              <div style={{fontSize: '13px', color: '#9CA3AF'}}>{clinic.district} район</div>
            </div>
          ))}
        </div>
      </div>
    );
    
    // Выбор даты
    const DatesScreen = () => (
      <div style={styles.content}>
        <div style={styles.whiteCard}>
          <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#0D47A1'}}>
            Выберите дату приёма
          </h2>
          {availableDates.map(dateObj => (
            <div
              key={dateObj.id}
              style={{
                ...styles.optionCard,
                animation: highlight === `date-${dateObj.id}` ? 'pulse 1.5s infinite' : 'none'
              }}
              onClick={() => handleGosuslugAction('select-date', dateObj.id)}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0D47A1'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
            >
              <div style={{fontSize: '18px', fontWeight: '600'}}>{dateObj.display}</div>
            </div>
          ))}
        </div>
      </div>
    );
    
    // Выбор времени
    const TimesScreen = () => (
      <div style={styles.content}>
        <div style={styles.whiteCard}>
          <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#0D47A1'}}>
            Выберите время приёма
          </h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px'}}>
            {availableTimes.map(timeObj => (
              <div
                key={timeObj.id}
                style={{
                  ...styles.optionCard,
                  opacity: timeObj.available ? 1 : 0.5,
                  cursor: timeObj.available ? 'pointer' : 'not-allowed',
                  animation: highlight === `time-${timeObj.id}` && timeObj.available ? 'pulse 1.5s infinite' : 'none'
                }}
                onClick={() => timeObj.available && handleGosuslugAction('select-time', timeObj.id)}
                onMouseEnter={(e) => timeObj.available && (e.currentTarget.style.borderColor = '#0D47A1')}
                onMouseLeave={(e) => timeObj.available && (e.currentTarget.style.borderColor = '#E5E7EB')}
              >
                <div style={{fontSize: '20px', fontWeight: '600', textAlign: 'center'}}>
                  {timeObj.time}
                </div>
                {!timeObj.available && <div style={{fontSize: '12px', textAlign: 'center', color: '#EF4444'}}>Занято</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
    
    // Подтверждение записи
    const AppointmentConfirmScreen = () => {
      const doctor = doctors.find(d => d.id === gosuslugState.selectedDoctor);
      const clinic = clinics.find(c => c.id === gosuslugState.selectedClinic);
      const date = availableDates.find(d => d.id === gosuslugState.selectedDate);
      const time = availableTimes.find(t => t.id === gosuslugState.selectedTime);
      
      return (
        <div style={styles.content}>
          <div style={styles.whiteCard}>
            <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#0D47A1'}}>
              Подтверждение записи
            </h2>
            <div style={{background: '#F9FAFB', padding: '16px', borderRadius: '12px', marginBottom: '16px'}}>
              <p style={{marginBottom: '8px'}}><strong>Врач:</strong> {doctor?.name}</p>
              <p style={{marginBottom: '8px'}}><strong>Поликлиника:</strong> {clinic?.name}</p>
              <p style={{marginBottom: '8px'}}><strong>Адрес:</strong> {clinic?.address}</p>
              <p style={{marginBottom: '8px'}}><strong>Дата:</strong> {date?.display}</p>
              <p><strong>Время:</strong> {time?.time}</p>
            </div>
            <button
              style={{
                ...styles.button,
                animation: highlight === 'confirm-button' ? 'pulse 1.5s infinite' : 'none'
              }}
              onClick={() => handleGosuslugAction('confirm-appointment')}
            >
              Записаться на приём
            </button>
          </div>
        </div>
      );
    };
    
    // Успешная запись
    const AppointmentSuccessScreen = () => (
      <div style={styles.content}>
        <div style={styles.whiteCard}>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '80px', marginBottom: '20px'}}>✅</div>
            <h2 style={{fontSize: '28px', fontWeight: 'bold', color: '#059669', marginBottom: '12px'}}>
              Вы успешно записаны!
            </h2>
            <p style={{color: '#6B7280', fontSize: '16px', marginBottom: '20px'}}>
              Информация о записи отправлена на вашу электронную почту
            </p>
            <button
              style={{
                ...styles.button,
                animation: highlight === 'back-to-menu' ? 'pulse 1.5s infinite' : 'none'
              }}
              onClick={() => handleGosuslugAction('back-to-menu')}
            >
              Вернуться в главное меню
            </button>
          </div>
        </div>
      </div>
    );
    
    // Информация о получении свидетельства
    const CertificateInfoScreen = () => (
      <div style={styles.content}>
        <div style={styles.whiteCard}>
          <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#0D47A1'}}>
            Электронное свидетельство пенсионера
          </h2>
          <p style={{color: '#6B7280', lineHeight: '1.6', marginBottom: '16px'}}>
            Электронное свидетельство пенсионера - это цифровой документ, который подтверждает ваш статус пенсионера. 
            Его можно предъявлять для получения льгот и скидок вместо бумажного документа.
          </p>
          <div style={{background: '#EEF2FF', padding: '16px', borderRadius: '12px', marginBottom: '16px'}}>
            <h3 style={{fontSize: '16px', fontWeight: '600', marginBottom: '8px'}}>Преимущества:</h3>
            <ul style={{paddingLeft: '20px', color: '#6B7280'}}>
              <li>Всегда доступно на телефоне</li>
              <li>Невозможно потерять</li>
              <li>Принимается везде</li>
            </ul>
          </div>
          <button
            style={{
              ...styles.button,
              animation: highlight === 'request-certificate-button' ? 'pulse 1.5s infinite' : 'none'
            }}
            onClick={() => handleGosuslugAction('request-certificate')}
          >
            Получить свидетельство
          </button>
        </div>
      </div>
    );
    
    // Проверка данных
    const CertificateVerifyScreen = () => (
      <div style={styles.content}>
        <div style={styles.whiteCard}>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '80px', marginBottom: '20px'}}>⏳</div>
            <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '12px'}}>
              Проверка данных...
            </h2>
            <p style={{color: '#6B7280'}}>
              Проверяем ваши данные в базе Пенсионного фонда
            </p>
          </div>
        </div>
      </div>
    );
    
    // Свидетельство выдано
    const CertificateIssuedScreen = () => (
      <div style={styles.content}>
        <div style={styles.whiteCard}>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '80px', marginBottom: '20px'}}>🎉</div>
            <h2 style={{fontSize: '28px', fontWeight: 'bold', color: '#059669', marginBottom: '12px'}}>
              Свидетельство получено!
            </h2>
            <p style={{color: '#6B7280', marginBottom: '24px'}}>
              Электронное свидетельство пенсионера доступно в вашем личном кабинете
            </p>
            <div style={{background: '#F3F4F6', padding: '20px', borderRadius: '12px', marginBottom: '16px'}}>
              <div style={{fontSize: '48px', marginBottom: '12px'}}>📄</div>
              <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '8px'}}>
                Электронное свидетельство пенсионера
              </h3>
              <div style={{color: '#6B7280', fontSize: '14px'}}>
                <p>Номер: #{Math.floor(Math.random() * 1000000)}</p>
                <p>Дата выдачи: 25 января 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
    
    // Выбор экрана
    // Выбор экрана на основе currentScreen в состоянии
    let screenContent;
    
    if (gosuslugState.currentScreen === 'login-form') {
      screenContent = <LoginFormScreen />;
    } else if (gosuslugState.currentScreen === 'logged-in') {
      screenContent = <LoggedInScreen />;
    } else if (gosuslugState.currentScreen === 'dashboard' || (step?.action === 'select-service' && gosuslugState.isLoggedIn)) {
      screenContent = <DashboardScreen />;
    } else if (gosuslugState.currentScreen === 'service-doctor') {
      screenContent = <DoctorServiceScreen />;
    } else if (gosuslugState.currentScreen === 'specialties-list') {
      screenContent = <SpecialtiesScreen />;
    } else if (gosuslugState.currentScreen === 'doctors-list') {
      screenContent = <DoctorsScreen />;
    } else if (gosuslugState.currentScreen === 'clinics-list') {
      screenContent = <ClinicsScreen />;
    } else if (gosuslugState.currentScreen === 'dates-list') {
      screenContent = <DatesScreen />;
    } else if (gosuslugState.currentScreen === 'times-list') {
      screenContent = <TimesScreen />;
    } else if (gosuslugState.currentScreen === 'appointment-confirm') {
      screenContent = <AppointmentConfirmScreen />;
    } else if (gosuslugState.currentScreen === 'appointment-success') {
      screenContent = <AppointmentSuccessScreen />;
    } else if (gosuslugState.currentScreen === 'certificate-info') {
      screenContent = <CertificateInfoScreen />;
    } else if (gosuslugState.currentScreen === 'certificate-verify') {
      screenContent = <CertificateVerifyScreen />;
    } else if (gosuslugState.currentScreen === 'certificate-issued') {
      screenContent = <CertificateIssuedScreen />;
    } else {
      // По умолчанию - экран входа
      screenContent = <LoginScreen />;
    }
    
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={{fontSize: '32px'}}>🏛️</div>
          <h1 style={{fontSize: '24px', fontWeight: 'bold'}}>Госуслуги</h1>
        </div>
        {screenContent}
      </div>
    );
  };

  const renderLesson = () => {
    const step = getCurrentStep();
    const lesson = lessons.find(l => l.id === currentLesson);
    const progress = ((lessonStep + 1) / lesson.steps.length) * 100;

    const styles = {
      container: {
        minHeight: '100vh',
        background: '#F3F4F6',
        display: 'flex'
      },
      sidebar: {
        width: '400px',
        background: 'white',
        borderRight: '1px solid #E5E7EB',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      },
      backButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#4F46E5',
        fontSize: '18px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        marginBottom: '24px',
        padding: '8px',
        borderRadius: '8px',
        transition: 'background-color 0.3s'
      },
      lessonTitle: {
        fontSize: '30px',
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: '16px'
      },
      progressSection: {
        marginBottom: '24px'
      },
      progressInfo: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '16px',
        color: '#6B7280',
        marginBottom: '8px'
      },
      progressBar: {
        width: '100%',
        height: '12px',
        background: '#E5E7EB',
        borderRadius: '6px',
        overflow: 'hidden'
      },
      progressFill: {
        height: '100%',
        background: '#4F46E5',
        transition: 'width 0.5s ease'
      },
      instructionBox: {
        background: '#EEF2FF',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '16px'
      },
      instructionTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#312E81',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      },
      voiceButton: {
        padding: '8px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        borderRadius: '8px',
        transition: 'background-color 0.3s'
      },
      instructionDescription: {
        fontSize: '18px',
        color: '#4B5568',
        lineHeight: 1.6,
        marginBottom: '16px'
      },
      instructionAction: {
        background: 'white',
        borderRadius: '8px',
        padding: '16px',
        borderLeft: '4px solid #4F46E5'
      },
      instructionText: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#312E81'
      },
      helpButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        background: '#FEF3C7',
        color: '#78350F',
        padding: '16px',
        borderRadius: '12px',
        fontSize: '18px',
        fontWeight: '600',
        border: '2px solid #FBBF24',
        cursor: 'pointer',
        marginBottom: '16px',
        transition: 'background-color 0.3s'
      },
      helpBox: {
        background: '#FEF3C7',
        border: '2px solid #FBBF24',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px'
      },
      helpText: {
        fontSize: '18px',
        color: '#78350F',
        lineHeight: 1.6
      },
      continueButton: {
        width: '100%',
        background: '#4F46E5',
        color: 'white',
        padding: '16px',
        borderRadius: '12px',
        fontSize: '20px',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.3s'
      },
      completeButton: {
        width: '100%',
        background: '#10B981',
        color: 'white',
        padding: '16px',
        borderRadius: '12px',
        fontSize: '20px',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.3s'
      },
      stepsNav: {
        background: '#F9FAFB',
        borderRadius: '12px',
        padding: '16px',
        marginTop: 'auto'
      },
      stepsNavTitle: {
        fontSize: '18px',
        fontWeight: '600',
        marginBottom: '12px'
      },
      stepsGrid: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px'
      },
      stepCircle: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: '600'
      },
      stepCurrent: {
        background: '#4F46E5',
        color: 'white'
      },
      stepCompleted: {
        background: '#10B981',
        color: 'white'
      },
      stepPending: {
        background: '#E5E7EB',
        color: '#9CA3AF'
      },
      simulatorSection: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px'
      },
      phoneFrame: {
        width: '420px',
        height: '700px',
        background: 'white',
        borderRadius: '32px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      },
      introScreen: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        textAlign: 'center'
      },
      introIcon: {
        fontSize: '96px',
        marginBottom: '24px'
      },
      introTitle: {
        fontSize: '36px',
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: '16px'
      },
      introDescription: {
        fontSize: '24px',
        color: '#6B7280',
        lineHeight: 1.6
      }
    };

    return (
      <div style={styles.container}>
        <div style={styles.sidebar}>
          <button
            onClick={() => {
              setCurrentPage('home');
              setCurrentLesson(null);
            }}
            style={styles.backButton}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ArrowLeft size={24} />
            Вернуться на главную
          </button>

          <h2 style={styles.lessonTitle}>{lesson.title}</h2>
          
          <div style={styles.progressSection}>
            <div style={styles.progressInfo}>
              <span>Прогресс</span>
              <span>{lessonStep + 1} / {lesson.steps.length}</span>
            </div>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${progress}%`
                }}
              />
            </div>
          </div>

          <div style={styles.instructionBox}>
            <h3 style={styles.instructionTitle}>
              {step?.title}
              <button
                onClick={toggleVoice}
                style={{
                  ...styles.voiceButton,
                  backgroundColor: voiceEnabled ? 'transparent' : '#FEE2E2'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = voiceEnabled ? '#DDD6FE' : '#FCA5A5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = voiceEnabled ? 'transparent' : '#FEE2E2'}
                title={voiceEnabled ? 'Отключить озвучивание' : 'Включить озвучивание'}
              >
                {voiceEnabled ? (
                  <Volume2 size={20} color="#4F46E5" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <line x1="23" y1="9" x2="17" y2="15"></line>
                    <line x1="17" y1="9" x2="23" y2="15"></line>
                  </svg>
                )}
              </button>
            </h3>
            <p style={styles.instructionDescription}>{step?.description}</p>
            <div style={styles.instructionAction}>
              <p style={styles.instructionText}>
                ✨ {step?.instruction}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowHelp(!showHelp)}
            style={styles.helpButton}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FDE68A'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FEF3C7'}
          >
            <HelpCircle size={24} />
            Помощь
          </button>

          {showHelp && (
            <div style={styles.helpBox}>
              <p style={styles.helpText}>
                💡 <strong>Подсказка:</strong> Обратите внимание на элементы с желтой подсветкой - именно с ними нужно взаимодействовать на текущем шаге.
              </p>
            </div>
          )}

          {step?.action === 'intro' && (
            <button
              onClick={nextStep}
              style={styles.continueButton}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338CA'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4F46E5'}
            >
              Продолжить
            </button>
          )}

          {/* Кнопка для шагов phone-on-confirm, wifi-connected, app-installed */}
          {(step?.action === 'phone-on-confirm' || step?.action === 'wifi-connected' || step?.action === 'app-installed' || 
            step?.action === 'view-catalog' || step?.action === 'view-products' || step?.action === 'view-product-details' ||
            step?.action === 'order-created' || step?.action === 'view-main' || step?.action === 'view-certificate-info' ||
            step?.action === 'verify-data' || step?.action === 'certificate-issued' || step?.action === 'logged-in') && (
            <button
              onClick={() => {
                // Специальная обработка для logged-in - устанавливаем dashboard
                if (step?.action === 'logged-in') {
                  setMessengerState(prev => ({ ...prev, currentScreen: 'dashboard' }));
                }
                nextStep();
              }}
              style={styles.continueButton}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338CA'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4F46E5'}
            >
              Продолжить
            </button>
          )}

          {step?.action === 'complete' && (
            <button
              onClick={completeLesson}
              style={styles.completeButton}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10B981'}
            >
              Завершить урок
            </button>
          )}

          <div style={styles.stepsNav}>
            <h4 style={styles.stepsNavTitle}>Навигация по шагам:</h4>
            <div style={styles.stepsGrid}>
              {lesson.steps.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    ...styles.stepCircle,
                    ...(idx === lessonStep ? styles.stepCurrent :
                        idx < lessonStep ? styles.stepCompleted :
                        styles.stepPending)
                  }}
                >
                  {idx < lessonStep ? '✓' : idx + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.simulatorSection}>
          <div style={styles.phoneFrame}>
            {step?.action === 'intro' || step?.action === 'complete' ? (
              <div style={styles.introScreen}>
                <div style={styles.introIcon}>
                  {step.action === 'complete' ? '🎉' : '💬'}
                </div>
                <h3 style={styles.introTitle}>{step.title}</h3>
                <p style={styles.introDescription}>{step.description}</p>
              </div>
            ) : (
              // Выбираем симулятор в зависимости от типа
              step.simulatorType === 'messenger' ? renderMessenger() :
              step.simulatorType === 'phone' ? renderPhone() :
              step.simulatorType === 'shop' ? renderShop() :
              step.simulatorType === 'gosuslugi' ? renderGosuslugi() :
              renderMessenger() // По умолчанию мессенджер
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTest = () => {
    const test = allTests.find(t => t.id === currentTest);
    if (!test) return null;

    const handleAnswerSelect = (questionId, optionIndex) => {
      const question = test.questions.find(q => q.id === questionId);
      
      if (question.type === 'single') {
        setTestAnswers(prev => ({
          ...prev,
          [questionId]: optionIndex
        }));
      } else if (question.type === 'multiple') {
        setTestAnswers(prev => {
          const current = prev[questionId] || [];
          const newAnswers = current.includes(optionIndex)
            ? current.filter(i => i !== optionIndex)
            : [...current, optionIndex];
          return {
            ...prev,
            [questionId]: newAnswers
          };
        });
      }
    };

    const calculateResults = () => {
      let correct = 0;
      let total = test.questions.length;

      test.questions.forEach(question => {
        const userAnswer = testAnswers[question.id];
        
        if (question.type === 'single') {
          if (userAnswer === question.correct) {
            correct++;
          }
        } else if (question.type === 'multiple') {
          const userSet = new Set(userAnswer || []);
          const correctSet = new Set(question.correct);
          
          if (userSet.size === correctSet.size && 
              [...userSet].every(item => correctSet.has(item))) {
            correct++;
          }
        }
      });

      const percentage = Math.round((correct / total) * 100);
      const passed = percentage >= test.passingScore;

      setTestResults({
        correct,
        total,
        percentage,
        passed
      });
      setShowTestResults(true);

      // Если тест пройден - добавляем достижение
      if (passed) {
        const lesson = lessons.find(l => l.id.startsWith(test.topic));
        if (lesson) {
          setUserProgress(prev => ({
            ...prev,
            completedLessons: [...new Set([...prev.completedLessons, currentLesson])],
            achievements: [...new Set([...prev.achievements, ...(lesson.achievements || []), `Тест: ${test.title}`])]
          }));
        }
      }
    };

    const finishTest = async () => {
      // Сохраняем результат теста в БД
      if (isAuthenticated && testResults) {
        try {
          await apiClient.saveTestResult(
            currentTest,
            testResults.correct,
            testResults.total,
            testResults.percentage,
            testResults.passed
          );
        } catch (error) {
          console.error('Ошибка сохранения результата теста:', error);
        }
      }

      setCurrentPage('home');
      setCurrentTest(null);
      setCurrentLesson(null);
      setLessonStep(0);
      setTestAnswers({});
      setTestResults(null);
      setShowTestResults(false);
    };

    const styles = {
      container: {
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #EBF4FF, #E0E7FF)',
        padding: '32px 16px'
      },
      content: {
        maxWidth: '900px',
        margin: '0 auto'
      },
      header: {
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      },
      questionCard: {
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      },
      option: {
        padding: '16px',
        border: '2px solid #E5E7EB',
        borderRadius: '12px',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      },
      optionSelected: {
        background: '#EBF4FF',
        borderColor: '#4F46E5'
      },
      submitButton: {
        width: '100%',
        padding: '16px',
        background: '#4F46E5',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '18px',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '24px'
      },
      resultsCard: {
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        marginTop: '24px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center'
      },
      resultsPassed: {
        color: '#10B981',
        fontSize: '64px',
        marginBottom: '16px'
      },
      resultsFailed: {
        color: '#EF4444',
        fontSize: '64px',
        marginBottom: '16px'
      }
    };

    if (showTestResults) {
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <div style={styles.resultsCard}>
              <div style={testResults.passed ? styles.resultsPassed : styles.resultsFailed}>
                {testResults.passed ? '🎉' : '📚'}
              </div>
              <h1 style={{fontSize: '32px', fontWeight: 'bold', marginBottom: '16px'}}>
                {testResults.passed ? 'Поздравляем!' : 'Попробуйте ещё раз'}
              </h1>
              <p style={{fontSize: '20px', color: '#6B7280', marginBottom: '24px'}}>
                {testResults.passed 
                  ? 'Вы успешно прошли тест!' 
                  : 'Вы можете пройти урок ещё раз и попробовать снова'}
              </p>
              <div style={{
                display: 'inline-block',
                background: testResults.passed ? '#D1FAE5' : '#FEE2E2',
                padding: '16px 32px',
                borderRadius: '12px',
                marginBottom: '32px'
              }}>
                <div style={{fontSize: '48px', fontWeight: 'bold', color: testResults.passed ? '#10B981' : '#EF4444'}}>
                  {testResults.percentage}%
                </div>
                <div style={{fontSize: '16px', color: '#6B7280'}}>
                  {testResults.correct} из {testResults.total} правильных ответов
                </div>
              </div>

              <h3 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'left'}}>
                Правильные ответы:
              </h3>
              {test.questions.map((question, idx) => {
                const userAnswer = testAnswers[question.id];
                const isCorrect = question.type === 'single' 
                  ? userAnswer === question.correct
                  : JSON.stringify((userAnswer || []).sort()) === JSON.stringify(question.correct.sort());

                return (
                  <div key={question.id} style={{
                    background: '#F9FAFB',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    textAlign: 'left',
                    borderLeft: `4px solid ${isCorrect ? '#10B981' : '#EF4444'}`
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                      <span style={{fontSize: '20px'}}>{isCorrect ? '✅' : '❌'}</span>
                      <strong>Вопрос {idx + 1}:</strong>
                    </div>
                    <p style={{marginBottom: '8px'}}>{question.question}</p>
                    <p style={{color: '#10B981', fontWeight: '600'}}>
                      Правильный ответ: {
                        question.type === 'single'
                          ? question.options[question.correct]
                          : question.correct.map(i => question.options[i]).join(', ')
                      }
                    </p>
                    <p style={{color: '#6B7280', fontSize: '14px', marginTop: '8px', fontStyle: 'italic'}}>
                      {question.explanation}
                    </p>
                  </div>
                );
              })}

              <button
                onClick={finishTest}
                style={{
                  ...styles.submitButton,
                  background: '#10B981',
                  marginTop: '32px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#10B981'}
              >
                {testResults.passed ? 'Завершить' : 'Вернуться на главную'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    const allAnswered = test.questions.every(q => {
      const answer = testAnswers[q.id];
      if (q.type === 'single') return answer !== undefined;
      if (q.type === 'multiple') return answer && answer.length > 0;
      return false;
    });

    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.header}>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px'}}>
              <div style={{fontSize: '48px'}}>{test.icon}</div>
              <div>
                <h1 style={{fontSize: '32px', fontWeight: 'bold', marginBottom: '8px'}}>
                  {test.title}
                </h1>
                <p style={{color: '#6B7280', fontSize: '16px'}}>
                  {test.description}
                </p>
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '16px',
              padding: '16px',
              background: '#F3F4F6',
              borderRadius: '12px',
              marginTop: '16px'
            }}>
              <div>
                <div style={{fontSize: '14px', color: '#6B7280'}}>Вопросов:</div>
                <div style={{fontSize: '20px', fontWeight: 'bold'}}>{test.questions.length}</div>
              </div>
              <div>
                <div style={{fontSize: '14px', color: '#6B7280'}}>Проходной балл:</div>
                <div style={{fontSize: '20px', fontWeight: 'bold'}}>{test.passingScore}%</div>
              </div>
            </div>
          </div>

          {test.questions.map((question, idx) => {
            const userAnswer = testAnswers[question.id];

            return (
              <div key={question.id} style={styles.questionCard}>
                <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '16px'}}>
                  Вопрос {idx + 1} из {test.questions.length}
                  {question.type === 'multiple' && (
                    <span style={{fontSize: '14px', color: '#6B7280', fontWeight: 'normal', marginLeft: '8px'}}>
                      (выберите все подходящие)
                    </span>
                  )}
                </h3>
                <p style={{fontSize: '16px', marginBottom: '20px', lineHeight: '1.5'}}>
                  {question.question}
                </p>
                {question.options.map((option, optionIdx) => {
                  const isSelected = question.type === 'single'
                    ? userAnswer === optionIdx
                    : (userAnswer || []).includes(optionIdx);

                  return (
                    <div
                      key={optionIdx}
                      style={{
                        ...styles.option,
                        ...(isSelected ? styles.optionSelected : {})
                      }}
                      onClick={() => handleAnswerSelect(question.id, optionIdx)}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = '#D1D5DB';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = '#E5E7EB';
                      }}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: question.type === 'single' ? '50%' : '6px',
                        border: `2px solid ${isSelected ? '#4F46E5' : '#D1D5DB'}`,
                        background: isSelected ? '#4F46E5' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isSelected && (
                          <span style={{color: 'white', fontSize: '16px', fontWeight: 'bold'}}>✓</span>
                        )}
                      </div>
                      <span style={{fontSize: '16px'}}>{option}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          <button
            onClick={calculateResults}
            disabled={!allAnswered}
            style={{
              ...styles.submitButton,
              opacity: allAnswered ? 1 : 0.5,
              cursor: allAnswered ? 'pointer' : 'not-allowed'
            }}
            onMouseEnter={(e) => {
              if (allAnswered) e.currentTarget.style.background = '#4338CA';
            }}
            onMouseLeave={(e) => {
              if (allAnswered) e.currentTarget.style.background = '#4F46E5';
            }}
          >
            {allAnswered ? 'Завершить тест' : 'Ответьте на все вопросы'}
          </button>
        </div>
      </div>
    );
  };

  // Показываем загрузку при проверке авторизации
  if (authLoading) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, #EBF4FF, #E0E7FF)'
      }}>
        <div style={{textAlign: 'center'}}>
          <div style={{fontSize: '64px', marginBottom: '16px'}}>⏳</div>
          <div style={{fontSize: '24px', color: '#6B7280'}}>Загрузка...</div>
        </div>
      </div>
    );
  }

  // Показываем AuthPage если не авторизован
  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // Основное приложение
  return (
    <div style={{width: '100%', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'}}>
      {currentPage === 'home' && renderHome()}
      {currentPage === 'lesson' && renderLesson()}
      {currentPage === 'test' && renderTest()}
      
      {/* Модальное окно профиля */}
      {showProfile && (
        <ProfilePage
          user={user}
          onLogout={handleLogout}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
};

// Добавление CSS-анимации
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
`;
document.head.appendChild(styleSheet);

export default DigitalLiteracyPlatform;
