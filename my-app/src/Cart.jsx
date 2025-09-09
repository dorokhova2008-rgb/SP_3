import { useContext } from "react";
import { CartContext } from "./CartContext";
import { ThemeContext } from "./ThemeContext";

export default function Cart() {
    const { cart, removeFromCart, clearCart, getCartTotal } = useContext(CartContext);
    const { theme } = useContext(ThemeContext);

    const cartStyle = {
        padding: "20px",
        backgroundColor: theme === "dark" ? "#444" : "#f9f9f9",
        color: theme === "dark" ? "#fff" : "#000",
        borderRadius: "8px",
        maxWidth: "800px",
        margin: "0 auto"
    };

    const itemStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px",
        borderBottom: `1px solid ${theme === "dark" ? "#666" : "#ddd"}`,
        marginBottom: "10px"
    };

    const buttonStyle = {
        padding: "5px 10px",
        backgroundColor: theme === "dark" ? "#ff4444" : "#ff6b6b",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer"
    };

    return (
        <div style={cartStyle}>
            <h2>Корзина</h2>
            
            {cart.length === 0 ? (
                <p>Корзина пуста</p>
            ) : (
                <>
                    {cart.map((item, index) => (
                        <div key={index} style={itemStyle}>
                            <div>
                                <h3>{item.name}</h3>
                                <p>Цена: {item.price} руб.</p>
                            </div>
                            <button 
                                style={buttonStyle}
                                onClick={() => removeFromCart(item.id)}
                            >
                                Удалить
                            </button>
                        </div>
                    ))}
                    
                    <div style={{ 
                        marginTop: "20px", 
                        padding: "10px", 
                        borderTop: `2px solid ${theme === "dark" ? "#666" : "#ddd"}` 
                    }}>
                        <h3>Общая сумма: {getCartTotal()} руб.</h3>
                        <button 
                            style={{
                                ...buttonStyle,
                                backgroundColor: theme === "dark" ? "#4CAF50" : "#2ecc71",
                                padding: "10px 15px"
                            }}
                            onClick={clearCart}
                        >
                            Очистить корзину
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}