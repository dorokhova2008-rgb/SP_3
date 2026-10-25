import { useState, useEffect, useContext, useCallback } from "react";
import { CartContext } from "./CartContext";
import { AuthContext } from "./AuthContext";
import { getCart, addToCart, removeFromCart, checkout } from "../api/appointments";

export function CartProvider({ children }) {
    const { user } = useContext(AuthContext);
    const userId = user ? user.user_id : null;

    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(Boolean(userId));
    const [error, setError] = useState(null);

    const loadCart = useCallback(async (silent = false) => {
        if (!userId) {
            setCart([]);
            setError(null);
            return;
        }
        try {
            if (!silent) setLoading(true);
            const data = await getCart(userId);
            setCart(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(err.message || "Не удалось загрузить корзину");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadCart();
    }, [loadCart]);

    async function addItem(serviceId) {
        await addToCart(userId, serviceId);
        await loadCart(true);
    }

    async function decreaseItem(serviceId) {
        await removeFromCart(userId, serviceId, false);
        await loadCart(true);
    }

    async function removeItem(serviceId) {
        await removeFromCart(userId, serviceId, true);
        await loadCart(true);
    }

    async function pay() {
        const result = await checkout(userId);
        await loadCart(true);
        return result;
    }

    function getCartTotal() {
        return cart.reduce((total, item) => total + Number(item.total_price), 0);
    }

    function getCartItemsCount() {
        return cart.reduce((count, item) => count + item.quantity, 0);
    }

    return (
        <CartContext.Provider value={{
            cart,
            loading,
            error,
            loadCart,
            addItem,
            decreaseItem,
            removeItem,
            pay,
            getCartTotal,
            getCartItemsCount
        }}>
            {children}
        </CartContext.Provider>
    );
}
