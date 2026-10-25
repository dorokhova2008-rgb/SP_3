import { API_URL, checkResponse } from './appointments';

export async function loginRequest(email, password) {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    return await checkResponse(response, 'Ошибка авторизации');
}

export async function registerRequest(name, email, password) {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
    });
    return await checkResponse(response, 'Ошибка регистрации');
}

export async function forgotPasswordRequest(email) {
    const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    return await checkResponse(response, 'Не удалось отправить ссылку');
}

export async function resetPasswordRequest(token, password) {
    const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
    });
    return await checkResponse(response, 'Не удалось сменить пароль');
}

export async function getProfile(userId) {
    const response = await fetch(`${API_URL}/profile/${userId}`);
    return await checkResponse(response, 'Не удалось обновить профиль');
}
