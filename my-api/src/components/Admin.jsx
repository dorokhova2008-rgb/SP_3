import { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getServices, getCategories } from '../api/appointments';
import { getUsers, setUserDiscount, setServiceDiscount, addCategory } from '../api/admin';
import { COUPON_TYPES, calcPrice, formatPrice } from '../utils/price';

function ServiceRow({ service, onSave }) {
    const [value, setValue] = useState(String(service.service_discount));
    const [saving, setSaving] = useState(false);

    const discount = Number(value);
    const isValid = value !== '' && Number.isInteger(discount) && discount >= 0 && discount <= 100;
    const changed = isValid && discount !== service.service_discount;

    async function handleSave() {
        setSaving(true);
        await onSave(service, discount);
        setSaving(false);
    }

    return (
        <tr>
            <td>{service.service_name}</td>
            <td>{service.category_name}</td>
            <td>{formatPrice(service.price)}</td>
            <td>
                <input
                    type="number"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className={`input-small ${isValid ? '' : 'invalid'}`}
                /> %
            </td>
            <td>{formatPrice(calcPrice(service.price, isValid ? discount : 0))}</td>
            <td>
                <button className="btn btn-primary btn-small" onClick={handleSave} disabled={!changed || saving}>
                    {saving ? '...' : 'Сохранить'}
                </button>
            </td>
        </tr>
    );
}

export default function Admin() {
    const { user } = useContext(AuthContext);
    const adminId = user ? user.user_id : null;
    const isAdmin = user && user.role_name === 'admin';

    const [users, setUsers] = useState([]);
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(null);

    const [categoryName, setCategoryName] = useState('');
    const [categoryDescription, setCategoryDescription] = useState('');
    const [categoryError, setCategoryError] = useState(null);

    useEffect(() => {
        if (isAdmin) loadData();
    }, [isAdmin]);

    async function loadData() {
        try {
            setLoading(true);
            const [usersData, servicesData, categoriesData] = await Promise.all([
                getUsers(adminId),
                getServices(),
                getCategories()
            ]);
            setUsers(usersData);
            setServices(servicesData);
            setCategories(categoriesData);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    }

    function showNotice(type, text) {
        setNotice({ type, text });
        setTimeout(() => setNotice(null), 3500);
    }

    async function handleUserDiscount(targetUser, discount) {
        try {
            const updated = await setUserDiscount(adminId, targetUser.user_id, discount);
            setUsers(users.map(u => u.user_id === updated.user_id ? { ...u, personal_discount: updated.personal_discount } : u));
            showNotice('success', `Пользователю ${targetUser.user_name} назначена скидка ${discount}%`);
        } catch (err) {
            showNotice('error', err.message);
        }
    }

    async function handleServiceDiscount(service, discount) {
        try {
            const updated = await setServiceDiscount(adminId, service.service_id, discount);
            setServices(services.map(s => s.service_id === service.service_id ? { ...s, service_discount: updated.service_discount } : s));
            showNotice('success', `Скидка на «${service.service_name}»: ${discount}%`);
        } catch (err) {
            showNotice('error', err.message);
        }
    }

    async function handleAddCategory(e) {
        e.preventDefault();
        setCategoryError(null);

        if (!categoryName.trim()) {
            setCategoryError('Введите название категории');
            return;
        }

        try {
            const created = await addCategory(adminId, categoryName.trim(), categoryDescription.trim());
            setCategories([...categories, created]);
            setCategoryName('');
            setCategoryDescription('');
            showNotice('success', `Категория «${created.category_name}» добавлена и появилась в фильтре каталога`);
        } catch (err) {
            setCategoryError(err.message);
        }
    }

    if (!user) return <Navigate to="/login" />;
    if (!isAdmin) return <Navigate to="/" />;

    if (loading) return <div className="state">Загрузка данных...</div>;
    if (error) {
        return (
            <div className="state state-error">
                <h2>{error}</h2>
                <button className="btn btn-primary" onClick={loadData}>Попробовать снова</button>
            </div>
        );
    }

    const saleCount = services.filter(s => s.service_discount > 0).length;
    const salePercent = services.length > 0 ? Math.round(saleCount * 100 / services.length) : 0;

    return (
        <div className="admin">
            <h1>Админ-панель</h1>

            {notice && <div className={`toast toast-${notice.type}`}>{notice.text}</div>}

            <section className="panel">
                <h2>Категории</h2>
                <div className="chips">
                    {categories.map(c => (
                        <span key={c.category_id} className="chip">{c.category_name}</span>
                    ))}
                </div>

                <form onSubmit={handleAddCategory} className="inline-form" noValidate>
                    <input
                        type="text"
                        placeholder="Название категории"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        className={categoryError ? 'invalid' : ''}
                    />
                    <input
                        type="text"
                        placeholder="Описание (необязательно)"
                        value={categoryDescription}
                        onChange={(e) => setCategoryDescription(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary">Добавить категорию</button>
                </form>
                {categoryError && <div className="field-error">{categoryError}</div>}
            </section>

            <section className="panel">
                <h2>Персональные скидки пользователей</h2>
                <p className="muted">Каждому пользователю назначается один из видов скидочных купонов.</p>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr><th>Пользователь</th><th>Email</th><th>Роль</th><th>Купон</th></tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.user_id}>
                                    <td>{u.user_name}</td>
                                    <td>{u.email}</td>
                                    <td>{u.role_name}</td>
                                    <td>
                                        <select
                                            value={u.personal_discount}
                                            onChange={(e) => handleUserDiscount(u, Number(e.target.value))}
                                        >
                                            {COUPON_TYPES.map(c => (
                                                <option key={c.value} value={c.value}>
                                                    {c.name}{c.value > 0 ? ` (−${c.value}%)` : ''}
                                                </option>
                                            ))}
                                            {!COUPON_TYPES.some(c => c.value === u.personal_discount) && (
                                                <option value={u.personal_discount}>Купон −{u.personal_discount}%</option>
                                            )}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="panel">
                <h2>Скидки на услуги</h2>
                <p className="muted">Со скидкой: {saleCount} из {services.length} услуг ({salePercent}%)</p>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr><th>Услуга</th><th>Категория</th><th>Цена</th><th>Скидка</th><th>Цена со скидкой</th><th></th></tr>
                        </thead>
                        <tbody>
                            {services.map(s => (
                                <ServiceRow key={s.service_id} service={s} onSave={handleServiceDiscount} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
