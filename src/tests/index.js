// Индексный файл для импорта всех тестов

import messengerTest from './messengerTest.js';
import phoneTest from './phoneTest.js';
import shopTest from './shopTest.js';
import gosuslugTest from './gosuslugTest.js';

// Экспортируем все тесты как массив
export const allTests = [
  messengerTest,
  phoneTest,
  shopTest,
  gosuslugTest
];

// Экспортируем также по отдельности для удобства
export { 
  messengerTest, 
  phoneTest, 
  shopTest, 
  gosuslugTest 
};

export default allTests;
