import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { formatPrice } from '../utils/price';
import { getServiceImage } from '../utils/images';

export default function Cart() {
    const { user } = useContext(AuthContext);
    const { cart, loading, error, loadCart, addItem, decreaseItem, removeItem, pay, getCartTotal } = useContext(CartContext);

    const [actionError, setActionError] = useState(null);
    const [paying, setPaying] = useState(false);
    const [paidInfo, setPaidInfo] = useState(null);

    async function runAction(action) {
        try {
            setActionError(null);
            setPaidInfo(null);
            await action();
        } catch (err) {
            console.error(err);
            setActionError(err.message || 'Ошибка при выполнении действия');
        }
    }

    async function handlePay() {
        try {
            setPaying(true);
            setActionError(null);
            const result = await pay();
            setPaidInfo(result);
        } catch (err) {
            console.error(err);
            setActionError(err.message || 'Ошибка при оформлении заказа');
        } finally {
            setPaying(false);
        }
    }

    if (!user) {
        return (
            <div className="state">
                <h2>Корзина доступна после входа</h2>
                <Link to="/login" className="btn btn-primary">Войти</Link>
            </div>
        );
    }

    if (loading) return <div className="state">Загрузка корзины...</div>;
    if (error) {
        return (
            <div className="state state-error">
                <h2>{error}</h2>
                <button className="btn btn-primary" onClick={() => loadCart()}>Попробовать снова</button>
            </div>
        );
    }

    return (
        <div className="cart">
            <h1>Ваша корзина</h1>

            {paidInfo && (
                <div className="alert alert-success">Заказ оформлен! Услуг: {paidInfo.paid_count}, оплачено: {formatPrice(paidInfo.total)}
                </div>
            )}
            {actionError && <div className="alert alert-error">{actionError}</div>}

            {cart.length === 0 ? (
                <div className="state">
                    <p>Корзина пуста. Добавьте что-нибудь из каталога!</p>
                    <Link to="/" className="btn btn-primary">Перейти в каталог</Link>
                </div>
            ) : (
                <div>
                    {cart.map(item => (
                        <div key={item.service_id} className="cart-item">
                            <div className="cart-thumb">
                                <img src={getServiceImage(item.service_name, item.category_name)} alt={item.service_name} />
                            </div>

                            <div className="cart-info">
                                <strong>{item.service_name}</strong>
                                <p className="muted">{item.service_description}</p>
                                <p className="muted">Длительность: {item.duration_minutes} мин. · {formatPrice(item.unit_price)} за 1 шт.</p>
                            </div>

                            <div className="qty">
                                <button className="btn btn-ghost btn-small" onClick={() => runAction(() => decreaseItem(item.service_id))} disabled={item.quantity <= 1} aria-label="Уменьшить количество">−</button>
                                <span className="qty-value">{item.quantity}</span>
                                <button className="btn btn-ghost btn-small" onClick={() => runAction(() => addItem(item.service_id))} aria-label="Увеличить количество">+</button>
                            </div>

                            <div className="cart-sum">{formatPrice(item.total_price)}</div>

                            <button className="btn btn-danger btn-small" onClick={() => runAction(() => removeItem(item.service_id))}>
                                Удалить
                            </button>
                        </div>
                    ))}

                    <div className="cart-total">
                        <span>Итого:</span>
                        <strong>{formatPrice(getCartTotal())}</strong>
                    </div>
                    <div className="cart-actions">
                        <button className="btn btn-primary" onClick={handlePay} disabled={paying}>
                            {paying ? ' Оформляем...' : 'Оформить заказ'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
