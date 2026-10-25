import { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { ThemeContext } from '../context/ThemeContext';
import { getCouponName } from '../utils/price';

export default function Menu() {
    const { user, logout } = useContext(AuthContext);
    const { getCartItemsCount } = useContext(CartContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/');
    }

    const linkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

    return (
        <nav className="menu">
            <NavLink to="/" end className={linkClass}>Каталог</NavLink>
            <NavLink to="/cart" className={linkClass}>Корзина ({getCartItemsCount()})</NavLink>
            {user && user.role_name === 'admin' && (
                <NavLink to="/admin" className={linkClass}>Админ-панель</NavLink>
            )}

            <button className="btn btn-ghost btn-small menu-theme" onClick={toggleTheme}>
                {theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
            </button>

            {user ? (
                <div className="menu-user">
                    <span className="user-name">
                        Привет, {user.user_name}!
                        {user.personal_discount > 0 && (
                            <span className="user-coupon">
                                Купон «{getCouponName(user.personal_discount)}» −{user.personal_discount}%
                            </span>
                        )}
                    </span>
                    <button className="btn btn-danger btn-small" onClick={handleLogout}>Выйти</button>
                </div>
            ) : (
                <NavLink to="/login" className="nav-link">Вход</NavLink>
            )}
        </nav>
    );
}
