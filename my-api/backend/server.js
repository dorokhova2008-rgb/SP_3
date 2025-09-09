const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Подключение к PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Проверка подключения
pool.on('connect', () => {
    console.log('Подключение к PostgreSQL установлено');
});

pool.on('error', (err) => {
    console.error('Ошибка подключения к PostgreSQL:', err);
});

// Простой тестовый endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'API работает!', timestamp: new Date() });
});

// Простой запрос к БД без JOIN
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        res.json({ 
            message: 'Подключение к БД работает!',
            current_time: result.rows[0].current_time
        });
    } catch (error) {
        console.error('Ошибка теста БД:', error);
        res.status(500).json({ error: error.message });
    }
});

// Упрощенный endpoint для appointments
app.get('/api/appointments/simple', async (req, res) => {
    try {
        console.log('Запрос к appointments...');
        const result = await pool.query('SELECT * FROM appointments LIMIT 5');
        console.log(`Найдено записей: ${result.rows.length}`);
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка запроса appointments:', error);
        res.status(500).json({ error: error.message });
    }
});

// Полный endpoint для appointments 
app.get('/api/appointments', async (req, res) => {
    try {
        console.log('Полный запрос к appointments...');
        
        // Проверка простого запроса
        const simpleResult = await pool.query('SELECT COUNT(*) FROM appointments');
        console.log(`📈 Всего записей: ${simpleResult.rows[0].count}`);
        
        // Проверка полного запроса
        const result = await pool.query(`
            SELECT 
                a.appointment_id,
                a.user_id,
                a.service_id,
                a.appointment_date,
                a.appointment_time,
                a.status,
                a.notes,
                a.created_at
            FROM appointments a
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
        `);
        
        console.log(`Результат: ${result.rows.length} записей`);
        res.json(result.rows);
        
    } catch (error) {
        console.error('Ошибка полного запроса:', error);
        res.status(500).json({ error: error.message });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log('Тестовые endpoints:');
    console.log(`1) http://localhost:${PORT}/api/test`);
    console.log(`2) http://localhost:${PORT}/api/test-db`);
    console.log(`3) http://localhost:${PORT}/api/appointments/simple`);
    console.log(`4) http://localhost:${PORT}/api/appointments`);
});