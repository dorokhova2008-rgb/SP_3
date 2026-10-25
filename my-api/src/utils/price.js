export function calcPrice(price, serviceDiscount = 0, personalDiscount = 0) {
    let result = Number(price);
    if (serviceDiscount > 0) result = result - (result * serviceDiscount / 100);
    if (personalDiscount > 0) result = result - (result * personalDiscount / 100);
    return Math.round(result * 100) / 100;
}

export function formatPrice(value) {
    return Number(value).toLocaleString('ru-RU') + ' ₽';
}

export const COUPON_TYPES = [
    { value: 0, name: 'Без купона' },
    { value: 5, name: 'Бронзовый' },
    { value: 10, name: 'Серебряный' },
    { value: 15, name: 'Золотой' },
    { value: 20, name: 'Платиновый' },
];

export function getCouponName(discount) {
    const coupon = COUPON_TYPES.find(c => c.value === discount);
    return coupon ? coupon.name : `Купон ${discount}%`;
}
