export const MIN_PASSWORD_LENGTH = 6;

export function isValidEmail(email) {
    return /^\S+@\S+\.\S+$/.test(email.trim());
}

export function getNetworkMessage(err) {
    if (err instanceof TypeError) {
        return 'Нет связи с сервером. Проверьте, что backend запущен.';
    }
    return err.message;
}
