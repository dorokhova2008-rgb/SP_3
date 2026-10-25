import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { forgotPasswordRequest } from '../api/auth';
import { MIN_PASSWORD_LENGTH, isValidEmail, getNetworkMessage } from '../utils/validation';

export default function Login() {
    const { login, register } = useContext(AuthContext);
    const navigate = useNavigate();

    const [mode, setMode] = useState('login');

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');

    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [resetLink, setResetLink] = useState(null);
    const [loading, setLoading] = useState(false);

    function changeMode(newMode) {
        setMode(newMode);
        setErrors({});
        setServerError(null);
        setSuccess(null);
        setResetLink(null);
        setPassword('');
        setConfirm('');
    }

    function validate() {
        const newErrors = {};

        if (mode === 'register' && name.trim().length < 2) {
            newErrors.name = 'Введите имя (минимум 2 символа)';
        }

        if (!email.trim()) {
            newErrors.email = 'Введите email';
        } else if (!isValidEmail(email)) {
            newErrors.email = 'Некорректный email (пример: name@mail.ru)';
        }

        if (mode === 'login' && !password) {
            newErrors.password = 'Введите пароль';
        }

        if (mode === 'register') {
            if (password.length < MIN_PASSWORD_LENGTH) {
                newErrors.password = `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`;
            }
            if (confirm !== password) {
                newErrors.confirm = 'Пароли не совпадают';
            }
        }

        return newErrors;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setServerError(null);
        setSuccess(null);
        setResetLink(null);

        const newErrors = validate();
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        try {
            setLoading(true);

            if (mode === 'login') {
                const user = await login(email.trim(), password);
                navigate(user.role_name === 'admin' ? '/admin' : '/');
            } else if (mode === 'register') {
                await register(name.trim(), email.trim(), password);
                navigate('/');
            } else {
                const data = await forgotPasswordRequest(email.trim());
                setSuccess(data.message);
                if (data.reset_link) setResetLink(data.reset_link);
            }
        } catch (err) {
            console.error(err);
            setServerError(getNetworkMessage(err));
        } finally {
            setLoading(false);
        }
    }

    const titles = {
        login: 'Вход в аккаунт',
        register: 'Регистрация',
        forgot: 'Восстановление пароля'
    };

    const buttons = {
        login: 'Войти',
        register: 'Зарегистрироваться',
        forgot: 'Получить ссылку для смены пароля'
    };

    return (
        <div className="login-box">
            <h2 className="center">{titles[mode]}</h2>

            {mode === 'forgot' && (
                <p className="muted center">Укажите email, и мы отправим ссылку для смены пароля</p>
            )}

            <form onSubmit={handleSubmit} noValidate>
                {mode === 'register' && (
                    <label className="field">
                        <span>Имя</span>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ваше имя"
                            className={errors.name ? 'invalid' : ''}
                        />
                        {errors.name && <span className="field-error">{errors.name}</span>}
                    </label>
                )}

                <label className="field">
                    <span>Email</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="client@shop.ru"
                        className={errors.email ? 'invalid' : ''}
                    />
                    {errors.email && <span className="field-error">{errors.email}</span>}
                </label>

                {mode !== 'forgot' && (
                    <label className="field">
                        <span>Пароль</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Введите пароль"
                            className={errors.password ? 'invalid' : ''}
                        />
                        {errors.password && <span className="field-error">{errors.password}</span>}
                    </label>
                )}

                {mode === 'register' && (
                    <label className="field">
                        <span>Повторите пароль</span>
                        <input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="Повторите пароль"
                            className={errors.confirm ? 'invalid' : ''}
                        />
                        {errors.confirm && <span className="field-error">{errors.confirm}</span>}
                    </label>
                )}

                {serverError && <div className="alert alert-error">{serverError}</div>}
                {success && <div className="alert alert-success">{success}</div>}
                {resetLink && (
                    <div className="alert alert-info">
                        Режим разработки, письмо не отправляется. Ссылка для смены пароля:
                        <br />
                        <a href={resetLink}>Сменить пароль</a>
                    </div>
                )}

                <button type="submit" className="btn btn-primary btn-wide" disabled={loading}>
                    {loading ? 'Подождите...' : buttons[mode]}
                </button>
            </form>

            <div className="form-links">
                {mode === 'login' && (
                    <>
                        <p>Нет аккаунта? <button type="button" className="link-btn" onClick={() => changeMode('register')}>Зарегистрироваться</button></p>
                        <p>Забыли пароль? <button type="button" className="link-btn" onClick={() => changeMode('forgot')}>Восстановить</button></p>
                    </>
                )}
                {mode !== 'login' && (
                    <p>Уже есть аккаунт? <button type="button" className="link-btn" onClick={() => changeMode('login')}>Войти</button></p>
                )}
            </div>

            {mode === 'login' && (
                <div className="demo-accounts">
                    <strong>Тестовые аккаунты:</strong>
                    <div>Клиент: client@shop.ru / client123</div>
                    <div>Админ: admin@shop.ru / admin123</div>
                </div>
            )}
        </div>
    );
}
