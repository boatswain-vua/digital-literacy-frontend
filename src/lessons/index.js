// Индексный файл для импорта всех уроков

import messengerBasicLesson from './messengerBasic.js';
import messengerAdvancedLesson from './messengerAdvanced.js';
import phoneBasicLesson from './phoneBasic.js';
import phoneAdvancedLesson from './phoneAdvanced.js';
import shopBasicLesson from './shopBasic.js';
import shopAdvancedLesson from './shopAdvanced.js';
import gosuslugBasicLesson from './gosuslugBasic.js';
import gosuslugAdvancedLesson from './gosuslugAdvanced.js';

// Экспортируем все уроки как массив
export const allLessons = [
  messengerBasicLesson,
  messengerAdvancedLesson,
  phoneBasicLesson,
  phoneAdvancedLesson,
  shopBasicLesson,
  shopAdvancedLesson,
  gosuslugBasicLesson,
  gosuslugAdvancedLesson,
  // Добавляйте новые уроки здесь
];

// Экспортируем также по отдельности для удобства
export { 
  messengerBasicLesson, 
  messengerAdvancedLesson, 
  phoneBasicLesson,
  phoneAdvancedLesson,
  shopBasicLesson,
  shopAdvancedLesson,
  gosuslugBasicLesson,
  gosuslugAdvancedLesson
};

export default allLessons;
