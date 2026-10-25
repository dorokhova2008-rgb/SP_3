# Морской клуб

React (Vite) + Express + PostgreSQL.

## Запуск
1. В PostgreSQL выполните database.sql в БД SP_ya.
2. backend: cd backend, npm install, npm run dev
3. frontend: npm install, npm run dev (http://localhost:5173)

## Тестовые аккаунты
- Клиент: client@shop.ru / client123
- Админ: admin@shop.ru / admin123

## Восстановление пароля
Письма не отправляются. Ссылка для смены пароля показывается на странице (SHOW_RESET_LINK=true в backend/.env) и печатается в консоли backend.
