// Урок: Госуслуги (Расширенный уровень)

export const gosuslugAdvancedLesson = {
  id: 'gosuslugi-advanced',
  title: 'Госуслуги (Расширенный)',
  level: 'Расширенный',
  icon: '🏛️',
  description: 'Вход, запись к врачу и получение электронного свидетельства пенсионера',
  duration: '~25 минут',
  
  // Начальное состояние для симулятора
  initialState: {
    isLoggedIn: false,
    loginMethod: null,
    loginValue: '',
    password: '',
    selectedService: null,
    policyNumber: '',
    selectedSpecialty: null,
    selectedDoctor: null,
    selectedClinic: null,
    selectedDate: null,
    selectedTime: null,
    appointmentBooked: false,
    certificateRequested: false,
    certificateIssued: false
  },
  
  // Методы входа
  loginMethods: [
    { id: 'phone', name: 'Номер телефона', icon: '📱', placeholder: '+7 (___) ___-__-__' },
    { id: 'email', name: 'Электронная почта', icon: '📧', placeholder: 'example@mail.ru' },
    { id: 'snils', name: 'СНИЛС', icon: '🔢', placeholder: '123-456-789 00' }
  ],
  
  // Специальности врачей
  specialties: [
    { id: 1, name: 'Терапевт', icon: '👨‍⚕️', available: 5 },
    { id: 2, name: 'Кардиолог', icon: '❤️', available: 3 },
    { id: 3, name: 'Офтальмолог', icon: '👁️', available: 4 },
    { id: 4, name: 'Стоматолог', icon: '🦷', available: 6 }
  ],
  
  // Врачи
  doctors: [
    { id: 1, specialty: 1, name: 'Иванов Иван Иванович', experience: '15 лет', rating: 4.8 },
    { id: 2, specialty: 1, name: 'Петрова Анна Сергеевна', experience: '12 лет', rating: 4.9 },
    { id: 3, specialty: 2, name: 'Смирнов Петр Александрович', experience: '20 лет', rating: 4.7 }
  ],
  
  // Поликлиники
  clinics: [
    { id: 1, name: 'Поликлиника №5', address: 'ул. Ленина, д. 10', district: 'Центральный' },
    { id: 2, name: 'Поликлиника №12', address: 'пр. Мира, д. 25', district: 'Северный' },
    { id: 3, name: 'Поликлиника №7', address: 'ул. Садовая, д. 7', district: 'Южный' }
  ],
  
  // Доступные даты
  availableDates: [
    { id: 1, date: '2026-01-27', display: 'Понедельник, 27 января' },
    { id: 2, date: '2026-01-28', display: 'Вторник, 28 января' },
    { id: 3, date: '2026-01-29', display: 'Среда, 29 января' }
  ],
  
  // Доступное время
  availableTimes: [
    { id: 1, time: '09:00', available: true },
    { id: 2, time: '10:00', available: true },
    { id: 3, time: '11:00', available: false },
    { id: 4, time: '14:00', available: true },
    { id: 5, time: '15:00', available: true }
  ],
  
  // Шаги урока
  steps: [
    {
      title: 'Добро пожаловать!',
      description: 'В этом уроке вы научитесь полному функционалу Госуслуг: вход, запись к врачу и получение электронных документов.',
      action: 'intro',
      instruction: 'Нажмите "Продолжить" чтобы начать',
      simulatorType: 'intro'
    },
    
    // === ВХОД В СИСТЕМУ ===
    {
      title: 'Шаг 1: Главная страница',
      description: 'Начнем с входа в личный кабинет.',
      action: 'view-main',
      instruction: 'Посмотрите на главную страницу',
      simulatorType: 'gosuslugi'
    },
    {
      title: 'Шаг 2: Способ входа',
      description: 'Выберите способ входа.',
      action: 'select-login-method',
      instruction: 'Выберите "Номер телефона"',
      highlightElement: 'login-phone',
      simulatorType: 'gosuslugi'
    },
    {
      title: 'Шаг 3: Номер телефона',
      description: 'Введите ваш номер телефона.',
      action: 'enter-phone',
      instruction: 'Введите "+7 (999) 123-45-67"',
      expectedText: '+7 (999) 123-45-67',
      highlightElement: 'phone-input',
      simulatorType: 'gosuslugi'
    },
    {
      title: 'Шаг 4: Пароль',
      description: 'Введите пароль.',
      action: 'enter-password',
      instruction: 'Введите "password123"',
      expectedText: 'password123',
      highlightElement: 'password-input',
      simulatorType: 'gosuslugi'
    },
    {
      title: 'Шаг 5: Вход выполнен',
      description: 'Вы в личном кабинете!',
      action: 'logged-in',
      instruction: 'Нажмите "Продолжить"',
      simulatorType: 'gosuslugi'
    },
    
    // === ЗАПИСЬ К ВРАЧУ ===
    {
      title: 'Шаг 6: Услуга записи к врачу',
      description: 'Выберем услугу записи к врачу.',
      action: 'select-service',
      instruction: 'Нажмите "Запись на приём к врачу"',
      highlightElement: 'service-doctor',
      simulatorType: 'gosuslugi'
    },
    {
      title: 'Шаг 7: Номер полиса ОМС',
      description: 'Введите номер полиса ОМС.',
      action: 'enter-policy',
      instruction: 'Введите "1234567890123456"',
      expectedText: '1234567890123456',
      highlightElement: 'policy-input',
      simulatorType: 'gosuslugi'
    },
    {
      title: 'Шаг 8: Специальность врача',
      description: 'Выберите специальность.',
      action: 'select-specialty',
      instruction: 'Выберите "Терапевт"',
      highlightElement: 'specialty-1',
      simulatorType: 'gosuslugi'
    },
    {
      title: 'Шаг 9: Врач',
      description: 'Выберите врача.',
      action: 'select-doctor',
      instruction: 'Выберите "Иванов Иван Иванович"',
      highlightElement: 'doctor-1',
      simulatorType: 'gosuslugi'
    },
    {
      title: 'Шаг 10: Поликлиника',
      description: 'Выберите поликлинику.',
      action: 'select-clinic',
      instruction: 'Выберите "Поликлиника №5"',
      highlightElement: 'clinic-1',
      simulatorType: 'gosuslugi'
    },
    {
      title: 'Шаг 11: Дата приёма',
      description: 'Выберите дату.',
      action: 'select-date',
      instruction: 'Выберите "Понедельник, 27 января"',
      highlightElement: 'date-1',
      simulatorType: 'gosuslugi'
    },
    {
      title: 'Шаг 12: Время приёма',
      description: 'Выберите время.',
      action: 'select-time',
      instruction: 'Выберите "09:00"',
      highlightElement: 'time-1',
      simulatorType: 'gosuslugi'
    },
    {
      title: 'Шаг 13: Подтверждение записи',
      description: 'Подтвердите запись.',
      action: 'confirm-appointment',
      instruction: 'Нажмите "Записаться на приём"',
      highlightElement: 'confirm-button',
      simulatorType: 'gosuslugi'
    },
    {
      title: 'Шаг 14: Запись подтверждена',
      description: 'Вы успешно записались к врачу!',
      action: 'appointment-confirmed',
      instruction: 'Вернитесь в главное меню',
      highlightElement: 'back-to-menu',
      simulatorType: 'gosuslugi'
    },
    
    // === ПОЛУЧЕНИЕ ЭЛЕКТРОННОГО СВИДЕТЕЛЬСТВА ===
    {
      title: 'Шаг 15: Электронные документы',
      description: 'Теперь получим электронное свидетельство пенсионера. Это цифровой документ, который можно предъявлять вместо бумажного.',
      action: 'select-certificate-service',
      instruction: 'Нажмите "Электронное свидетельство пенсионера"',
      highlightElement: 'service-certificate',
      simulatorType: 'gosuslugi'
    },
    {
      title: 'Шаг 16: Информация об услуге',
      description: 'Ознакомьтесь с информацией об услуге получения электронного свидетельства.',
      action: 'view-certificate-info',
      instruction: 'Изучите информацию об услуге',
      simulatorType: 'gosuslugi'
    },
    {
      title: 'Шаг 17: Запрос свидетельства',
      description: 'Запросите выдачу электронного свидетельства пенсионера.',
      action: 'request-certificate',
      instruction: 'Нажмите "Получить свидетельство"',
      highlightElement: 'request-certificate-button',
      simulatorType: 'gosuslugi'
    },
    {
      title: 'Шаг 18: Проверка данных',
      description: 'Система автоматически проверит ваши данные в базе Пенсионного фонда.',
      action: 'verify-data',
      instruction: 'Подождите проверку данных',
      simulatorType: 'gosuslugi'
    },
    {
      title: 'Шаг 19: Свидетельство получено!',
      description: 'Электронное свидетельство пенсионера успешно выдано и доступно в вашем личном кабинете.',
      action: 'certificate-issued',
      instruction: 'Посмотрите ваше электронное свидетельство',
      simulatorType: 'gosuslugi'
    },
    
    {
      title: 'Поздравляем! 🎉',
      description: 'Вы освоили все ключевые функции Госуслуг: вход в систему, запись к врачу и получение электронных документов!',
      action: 'complete',
      instruction: 'Нажмите "Завершить урок"',
      simulatorType: 'complete'
    }
  ],
  
  achievements: [
    'Вход в Госуслуги',
    'Запись к врачу',
    'Электронный документ',
    'Цифровой пенсионер',
    'Мастер Госуслуг'
  ]
};

export default gosuslugAdvancedLesson;
