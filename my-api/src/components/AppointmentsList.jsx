import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices, getCategories } from '../api/appointments';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { calcPrice, formatPrice, getCouponName } from '../utils/price';
import { getServiceImage } from '../utils/images';

export default function AppointmentsList() {
    const { user } = useContext(AuthContext);
    const { cart, addItem, decreaseItem } = useContext(CartContext);
    const navigate = useNavigate();

    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [busyId, setBusyId] = useState(null);
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [servicesData, categoriesData] = await Promise.all([
                getServices(),
                getCategories()
            ]);
            setServices(servicesData);
            setCategories(categoriesData);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Не удалось загрузить услуги. Проверьте подключение к серверу.');
        } finally {
            setLoading(false);
        }
    }

    function showNotice(type, text) {
        setNotice({ type, text });
        setTimeout(() => setNotice(null), 3000);
    }

    function getQuantity(serviceId) {
        const item = cart.find(i => i.service_id === serviceId);
        return item ? item.quantity : 0;
    }

    async function handleAdd(service) {
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            setBusyId(service.service_id);
            await addItem(service.service_id);
            if (getQuantity(service.service_id) === 0) {
                showNotice('success', `«${service.service_name}» добавлена в корзину`);
            }
        } catch (err) {
            console.error(err);
            showNotice('error', err.message || 'Ошибка при добавлении');
        } finally {
            setBusyId(null);
        }
    }

    async function handleRemoveOne(service) {
        try {
            setBusyId(service.service_id);
            await decreaseItem(service.service_id);
        } catch (err) {
            console.error(err);
            showNotice('error', err.message || 'Ошибка при удалении');
        } finally {
            setBusyId(null);
        }
    }

    function handleCategoryChange(categoryId) {
        if (selectedCategories.includes(categoryId)) {
            setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
        } else {
            setSelectedCategories([...selectedCategories, categoryId]);
        }
    }

    function countInCategory(categoryId) {
        return services.filter(s => s.category_id === categoryId).length;
    }

    const filteredServices = selectedCategories.length === 0 
        ? services 
        : services.filter(service => selectedCategories.includes(service.category_id));

    const personalDiscount = user ? user.personal_discount : 0;

    if (loading) return <div className="state">Загрузка услуг...</div>;
    if (error) {
        return (
            <div className="state state-error">
                <h2>{error}</h2>
                <button className="btn btn-primary" onClick={loadData}>Попробовать снова</button>
            </div>
        );
    }

    return (
        <div>
            {notice && <div className={`toast toast-${notice.type}`}>{notice.text}</div>}

            <div className="layout">
                <aside className="aside">
                    <h3>Категории</h3>
                    {categories.map(category => (
                        <label key={category.category_id} className="checkbox-row">
                            <input 
                                type="checkbox" 
                                checked={selectedCategories.includes(category.category_id)}
                                onChange={() => handleCategoryChange(category.category_id)}
                            />
                            <span className="checkbox-name">{category.category_name}</span>
                            <span className="checkbox-count">{countInCategory(category.category_id)}</span>
                        </label>
                    ))}
                    {selectedCategories.length > 0 && (
                        <button className="btn btn-ghost btn-small" onClick={() => setSelectedCategories([])}>
                            Сбросить фильтры
                        </button>
                    )}
                </aside>

                <div className="content">
                    <h1>Каталог услуг</h1>

                    {filteredServices.length === 0 && (
                        <p className="muted">Нет услуг по выбранным категориям.</p>
                    )}

                    <div className="grid">
                        {filteredServices.map((service) => {
                            const price = Number(service.price);
                            const discount = service.service_discount;
                            const finalPrice = calcPrice(price, discount, personalDiscount);
                            const quantity = getQuantity(service.service_id);
                            const busy = busyId === service.service_id;

                            return (
                                <div key={service.service_id} className="card">
                                    <div className="card-img">
                                        <img src={getServiceImage(service.service_name, service.category_name)} alt={service.service_name} />
                                        {discount > 0 && <span className="badge">−{discount}%</span>}
                                    </div>

                                    <div className="card-body">
                                        <span className="card-category">{service.category_name}</span>
                                        <h3>{service.service_name}</h3>
                                        <p>{service.service_description}</p>
                                        <p className="muted">Длительность: {service.duration_minutes} мин.</p>
                                    </div>

                                    <div className="card-footer">
                                        <div className="price-row">
                                            {finalPrice < price && <span className="old-price">{formatPrice(price)}</span>}
                                            <span className="price">{formatPrice(finalPrice)}</span>
                                        </div>
                                        {personalDiscount > 0 && (
                                            <div className="coupon-note">
                                                Купон «{getCouponName(personalDiscount)}»: −{personalDiscount}%
                                            </div>
                                        )}

                                        {quantity === 0 ? (
                                            <button 
                                                className="btn btn-primary btn-wide"
                                                onClick={() => handleAdd(service)}
                                                disabled={busy}
                                            >
                                                {busy ? 'Добавляем...' : 'В корзину'}
                                            </button>
                                        ) : (
                                            <div className="counter">
                                                <button 
                                                    className="btn btn-danger counter-btn" 
                                                    onClick={() => handleRemoveOne(service)} 
                                                    disabled={busy}
                                                    aria-label="Убрать одну штуку"
                                                >
                                                    -
                                                </button>
                                                <span className="counter-value">{quantity} шт.</span>
                                                <button 
                                                    className="btn btn-primary counter-btn" 
                                                    onClick={() => handleAdd(service)} 
                                                    disabled={busy}
                                                    aria-label="Добавить ещё одну"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
