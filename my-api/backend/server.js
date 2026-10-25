const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const crypto = require('crypto');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json()); 

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

pool.on('connect', () => {
    console.log('Подключение к базе данных установлено');
});
pool.on('error', (err) => {
    console.error('Ошибка подключения к БД:', err);
});

const RESET_SECRET = process.env.RESET_SECRET || crypto.randomBytes(32).toString('hex');
const RESET_TTL_MS = 15 * 60 * 1000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SHOW_RESET_LINK = process.env.SHOW_RESET_LINK === 'true';
const MIN_PASSWORD_LENGTH = 6;

function isValidEmail(email) {
    return email.length <= 100 && /^\S+@\S+\.\S+$/.test(email);
}

function passwordFingerprint(password) {
    return crypto.createHash('sha256').update(password).digest('hex').slice(0, 16);
}

function signResetToken(user) {
    const payload = Buffer.from(JSON.stringify({
        uid: user.user_id,
        exp: Date.now() + RESET_TTL_MS
    })).toString('base64url');
    const signature = crypto
        .createHmac('sha256', RESET_SECRET)
        .update(payload + passwordFingerprint(user.password))
        .digest('base64url');
    return payload + '.' + signature;
}

async function verifyResetToken(token) {
    const parts = String(token || '').split('.');
    if (parts.length !== 2) return null;

    let data;
    try {
        data = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    } catch {
        return null;
    }
    if (!data.uid || !data.exp || data.exp < Date.now()) return null;

    const result = await pool.query('SELECT user_id, password FROM users WHERE user_id = $1', [data.uid]);
    const user = result.rows[0];
    if (!user) return null;

    const expected = crypto
        .createHmac('sha256', RESET_SECRET)
        .update(parts[0] + passwordFingerprint(user.password))
        .digest('base64url');
    const a = Buffer.from(expected);
    const b = Buffer.from(parts[1]);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    return user;
}

function calcPrice(price, serviceDiscount, personalDiscount) {
    let result = Number(price);
    if (serviceDiscount > 0) result = result - (result * serviceDiscount / 100);
    if (personalDiscount > 0) result = result - (result * personalDiscount / 100);
    return Math.round(result * 100) / 100;
}

function isValidDiscount(value) {
    return Number.isInteger(value) && value >= 0 && value <= 100;
}

async function requireAdmin(req, res, next) {
    try {
        const userId = Number(req.header('x-user-id'));
        if (!userId) {
            return res.status(401).json({ error: 'Необходимо войти в систему' });
        }
        const result = await pool.query(
            `SELECT r.role_name FROM users u
             JOIN roles r ON u.role_id = r.role_id
             WHERE u.user_id = $1`,
            [userId]
        );
        if (result.rows.length === 0 || result.rows[0].role_name !== 'admin') {
            return res.status(403).json({ error: 'Недостаточно прав' });
        }
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
}

app.get('/api/test', (req, res) => {
    res.json({ message: 'API работает' });
});

app.post('/api/login', async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        if (!email || !password) {
            return res.status(400).json({ error: 'Введите email и пароль' });
        }

        const result = await pool.query(
            `SELECT u.user_id, u.email, u.password, u.user_name, u.personal_discount, r.role_name
             FROM users u
             JOIN roles r ON u.role_id = r.role_id
             WHERE LOWER(u.email) = $1`,
            [email]
        );

        const user = result.rows[0];
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        delete user.password;
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        if (name.length < 2 || name.length > 100) {
            return res.status(400).json({ error: 'Введите имя (от 2 до 100 символов)' });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Некорректный email' });
        }
        if (password.length < MIN_PASSWORD_LENGTH || password.length > 255) {
            return res.status(400).json({ error: `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов` });
        }

        const roleResult = await pool.query("SELECT role_id FROM roles WHERE role_name = 'client'");
        if (roleResult.rows.length === 0) {
            return res.status(500).json({ error: 'В базе данных нет роли client' });
        }

        const result = await pool.query(
            `INSERT INTO users (role_id, email, password, user_name)
             VALUES ($1, $2, $3, $4)
             RETURNING user_id, email, user_name, personal_discount`,
            [roleResult.rows[0].role_id, email, password, name]
        );

        res.json({ ...result.rows[0], role_name: 'client' });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
        }
        console.error(error);
        res.status(500).json({ error: 'Ошибка при регистрации' });
    }
});

app.post('/api/forgot-password', async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Введите корректный email' });
        }

        const result = await pool.query(
            'SELECT user_id, password FROM users WHERE LOWER(email) = $1',
            [email]
        );
        const user = result.rows[0];

        const response = { message: 'Если такой email зарегистрирован, ссылка для смены пароля отправлена' };

        if (user) {
            const link = `${FRONTEND_URL}/reset-password?token=${signResetToken(user)}`;
            console.log(`Ссылка для сброса пароля (${email}): ${link}`);
            if (SHOW_RESET_LINK) {
                response.reset_link = link;
            }
        }

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/reset-password', async (req, res) => {
    try {
        const password = String(req.body.password || '');
        if (password.length < MIN_PASSWORD_LENGTH || password.length > 255) {
            return res.status(400).json({ error: `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов` });
        }

        const user = await verifyResetToken(req.body.token);
        if (!user) {
            return res.status(400).json({ error: 'Ссылка недействительна или устарела' });
        }

        await pool.query('UPDATE users SET password = $1 WHERE user_id = $2', [password, user.user_id]);
        res.json({ message: 'Пароль изменён. Теперь можно войти' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при смене пароля' });
    }
});

app.get('/api/profile/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.user_id, u.email, u.user_name, u.personal_discount, r.role_name
             FROM users u
             JOIN roles r ON u.role_id = r.role_id
             WHERE u.user_id = $1`,
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY category_id');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при получении категорий' });
    }
});

app.post('/api/categories', requireAdmin, async (req, res) => {
    try {
        const name = String(req.body.category_name || '').trim();
        const description = String(req.body.category_description || '').trim();

        if (!name) {
            return res.status(400).json({ error: 'Введите название категории' });
        }

        const result = await pool.query(
            'INSERT INTO categories (category_name, category_description) VALUES ($1, $2) RETURNING *',
            [name, description || null]
        );
        res.json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Категория с таким названием уже существует' });
        }
        console.error(error);
        res.status(500).json({ error: 'Ошибка при добавлении категории' });
    }
});

app.get('/api/services', async (req, res) => {
    try {
        console.log('Запрос к таблице services...');
        const result = await pool.query(`
            SELECT s.*, c.category_name 
            FROM services s
            JOIN categories c ON s.category_id = c.category_id
            ORDER BY s.service_id
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка запроса:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.put('/api/services/:id/discount', requireAdmin, async (req, res) => {
    try {
        const discount = Number(req.body.discount);
        if (!isValidDiscount(discount)) {
            return res.status(400).json({ error: 'Скидка должна быть целым числом от 0 до 100' });
        }
        const result = await pool.query(
            'UPDATE services SET service_discount = $1 WHERE service_id = $2 RETURNING *',
            [discount, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Услуга не найдена' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при сохранении скидки' });
    }
});

app.get('/api/users', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.user_id, u.user_name, u.email, u.personal_discount, r.role_name
             FROM users u
             JOIN roles r ON u.role_id = r.role_id
             ORDER BY u.user_id`
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при получении пользователей' });
    }
});

app.put('/api/users/:id/discount', requireAdmin, async (req, res) => {
    try {
        const discount = Number(req.body.discount);
        if (!isValidDiscount(discount)) {
            return res.status(400).json({ error: 'Скидка должна быть целым числом от 0 до 100' });
        }
        const result = await pool.query(
            `UPDATE users SET personal_discount = $1 WHERE user_id = $2
             RETURNING user_id, user_name, email, personal_discount`,
            [discount, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при сохранении скидки' });
    }
});

app.post('/api/cart', async (req, res) => {
    try {
        const { user_id, service_id } = req.body;
        
        const serviceResult = await pool.query('SELECT price, service_discount FROM services WHERE service_id = $1', [service_id]);
        const service = serviceResult.rows[0];
        if (!service) {
            return res.status(404).json({ error: 'Услуга не найдена' });
        }
        
        const userResult = await pool.query('SELECT personal_discount FROM users WHERE user_id = $1', [user_id]);
        const user = userResult.rows[0];
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const price = calcPrice(service.price, service.service_discount, user.personal_discount);

        const result = await pool.query(
            `INSERT INTO appointments (user_id, service_id, status, final_price) 
             VALUES ($1, $2, 'cart', $3) RETURNING *`,
            [user_id, service_id, price]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при добавлении в корзину' });
    }
});

app.get('/api/cart/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            `SELECT s.service_id, s.service_name, s.service_description, s.duration_minutes, c.category_name,
                    COUNT(a.appointment_id)::int AS quantity,
                    SUM(a.final_price) AS total_price,
                    ROUND(SUM(a.final_price) / COUNT(a.appointment_id), 2) AS unit_price
             FROM appointments a
             JOIN services s ON a.service_id = s.service_id
             JOIN categories c ON s.category_id = c.category_id
             WHERE a.user_id = $1 AND a.status = 'cart'
             GROUP BY s.service_id, c.category_name
             ORDER BY MIN(a.appointment_id)`,
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при получении корзины' });
    }
});

app.delete('/api/cart/:userId/:serviceId', async (req, res) => {
    try {
        const { userId, serviceId } = req.params;

        if (req.query.one === 'true') {
            await pool.query(
                `DELETE FROM appointments WHERE appointment_id = (
                    SELECT appointment_id FROM appointments
                    WHERE user_id = $1 AND service_id = $2 AND status = 'cart'
                    ORDER BY appointment_id DESC LIMIT 1
                )`,
                [userId, serviceId]
            );
        } else {
            await pool.query(
                `DELETE FROM appointments WHERE user_id = $1 AND service_id = $2 AND status = 'cart'`,
                [userId, serviceId]
            );
        }
        res.json({ message: 'Удалено из корзины' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при удалении' });
    }
});

app.post('/api/checkout', async (req, res) => {
    const client = await pool.connect();
    try {
        const { user_id } = req.body;

        await client.query('BEGIN');

        const updated = await client.query(
            `UPDATE appointments SET status = 'paid'
             WHERE user_id = $1 AND status = 'cart'
             RETURNING appointment_id, final_price`,
            [user_id]
        );

        if (updated.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Корзина пуста' });
        }

        let total = 0;
        for (const row of updated.rows) {
            const amount = Number(row.final_price);
            if (amount > 0) {
                await client.query(
                    'INSERT INTO payments (appointment_id, amount) VALUES ($1, $2)',
                    [row.appointment_id, amount]
                );
            }
            total += amount;
        }

        await client.query('COMMIT');
        res.json({ paid_count: updated.rows.length, total: Math.round(total * 100) / 100 });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Ошибка при оформлении заказа' });
    } finally {
        client.release();
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
