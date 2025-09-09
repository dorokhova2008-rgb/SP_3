import { useState } from "react";
import { CartContext } from "./CartContext";

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);

    function addToCart(item) {
        setCart([...cart, item]);
    }

    function removeFromCart(itemId) {
        setCart(cart.filter(item => item.id !== itemId));
    }

    function clearCart() {
        setCart([]);
    }

    function getCartTotal() {
        return cart.reduce((total, item) => total + (item.price || 0), 0);
    }

    function getCartItemsCount() {
        return cart.length;
    }

    return (
        <CartContext.Provider value={{ 
            cart, 
            addToCart, 
            removeFromCart, 
            clearCart,
            getCartTotal,
            getCartItemsCount
        }}>
            {children}
        </CartContext.Provider>
    );
}