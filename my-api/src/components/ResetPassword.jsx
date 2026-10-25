import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPasswordRequest } from '../api/auth';
import { MIN_PASSWORD_LENGTH, getNetworkMessage } from '../utils/validation';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setServerError(null);

        const newErrors = {};
        if (password.length < MIN_PASSWORD_LENGTH) {
            newErrors.password = `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`;
        }
        if (confirm !== password) {
            newErrors.confirm = 'Пароли не совпадают';
        }
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        try {
            setLoading(true);
            const data = await resetPasswordRequest(token, password);
            setSuccess(data.message);
        } catch (err) {
            console.error(err);
            setServerError(getNetworkMessage(err));
        } finally {
            setLoading(false);
        }
    }

    if (!token) {
        return (
            <div className="login-box">
                <h2 className="center">Смена пароля</h2>
                <div className="alert alert-error">Ссылка недействительна. Запросите новую на странице входа.</div>
                <Link to="/login" className="btn btn-primary btn-wide">Ко входу</Link>
            </div>
        );
    }

    if (success) {
        return (
            <div className="login-box">
                <h2 className="center">Смена пароля</h2>
                <div className="alert alert-success">{success}</div>
                <Link to="/login" className="btn btn-primary btn-wide">Войти</Link>
            </div>
        );
    }

    return (
        <div className="login-box">
            <h2 className="center">Новый пароль</h2>

            <form onSubmit={handleSubmit} noValidate>
                <label className="field">
                    <span>Новый пароль</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Введите новый пароль"
                        className={errors.password ? 'invalid' : ''}
                    />
                    {errors.password && <span className="field-error">{errors.password}</span>}
                </label>

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

                {serverError && <div className="alert alert-error">{serverError}</div>}

                <button type="submit" className="btn btn-primary btn-wide" disabled={loading}>
                    {loading ? 'Подождите...' : 'Сменить пароль'}
                </button>
            </form>
        </div>
    );
}
