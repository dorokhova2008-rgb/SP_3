import { useContext } from "react";
import { ThemeContext } from "./ThemeContext";

export default function Dashboard() {
    const { theme } = useContext(ThemeContext);

    const dashboardStyle = {
        padding: "20px",
        backgroundColor: theme === "dark" ? "#444" : "#f9f9f9",
        color: theme === "dark" ? "#fff" : "#000",
        borderRadius: "8px",
        maxWidth: "800px",
        margin: "0 auto"
    };

    return (
        <div style={dashboardStyle}>
            <h2>Панель управления</h2>
            <p>Это ваша панель управления. Здесь вы можете управлять настройками и просматривать статистику.</p>
            <div>
                <h3>Статистика</h3>
                <ul>
                    <li>Пользователей: 120</li>
                    <li>Заказов: 45</li>
                    <li>Товаров: 78</li>
                </ul>
            </div>
        </div>
    );
}