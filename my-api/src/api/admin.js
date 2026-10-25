import { API_URL, checkResponse } from './appointments';

function adminHeaders(adminId) {
    return { 'Content-Type': 'application/json', 'x-user-id': String(adminId) };
}

export async function getUsers(adminId) {
    const response = await fetch(`${API_URL}/users`, { headers: adminHeaders(adminId) });
    return await checkResponse(response, 'Не удалось загрузить пользователей');
}

export async function setUserDiscount(adminId, userId, discount) {
    const response = await fetch(`${API_URL}/users/${userId}/discount`, {
        method: 'PUT',
        headers: adminHeaders(adminId),
        body: JSON.stringify({ discount }),
    });
    return await checkResponse(response, 'Не удалось сохранить скидку');
}

export async function setServiceDiscount(adminId, serviceId, discount) {
    const response = await fetch(`${API_URL}/services/${serviceId}/discount`, {
        method: 'PUT',
        headers: adminHeaders(adminId),
        body: JSON.stringify({ discount }),
    });
    return await checkResponse(response, 'Не удалось сохранить скидку');
}

export async function addCategory(adminId, name, description) {
    const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: adminHeaders(adminId),
        body: JSON.stringify({ category_name: name, category_description: description }),
    });
    return await checkResponse(response, 'Не удалось добавить категорию');
}
