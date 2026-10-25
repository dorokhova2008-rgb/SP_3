export const API_URL = 'http://localhost:3001/api';

export async function checkResponse(response, defaultMessage) {
    if (!response.ok) {
        let message = defaultMessage;
        try {
            const data = await response.json();
            if (data.error) message = data.error;
        } catch {
        }
        throw new Error(message);
    }
    return await response.json();
}

export async function getServices() {
    const response = await fetch(`${API_URL}/services`);
    return await checkResponse(response, 'Ошибка при получении данных');
}

export async function getCategories() {
    const response = await fetch(`${API_URL}/categories`);
    return await checkResponse(response, 'Ошибка при получении категорий');
}

export async function addToCart(userId, serviceId) {
    const response = await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, service_id: serviceId }),
    });
    return await checkResponse(response, 'Ошибка добавления в корзину');
}

export async function getCart(userId) {
    const response = await fetch(`${API_URL}/cart/${userId}`);
    return await checkResponse(response, 'Ошибка загрузки корзины');
}

export async function removeFromCart(userId, serviceId, removeAll = true) {
    const query = removeAll ? '' : '?one=true';
    const response = await fetch(`${API_URL}/cart/${userId}/${serviceId}${query}`, {
        method: 'DELETE',
    });
    return await checkResponse(response, 'Ошибка удаления');
}

export async function checkout(userId) {
    const response = await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
    });
    return await checkResponse(response, 'Ошибка оформления заказа');
}
