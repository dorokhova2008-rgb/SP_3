import { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeContext } from './context/ThemeContext';
import { ThemeProvider } from './context/ThemeProvider';
import { AuthProvider } from './context/AuthProvider';
import { CartProvider } from './context/CartProvider';
import Menu from './components/Menu';
import AppointmentsList from './components/AppointmentsList';
import Cart from './components/Cart';
import Login from './components/Login';
import ResetPassword from './components/ResetPassword';
import Admin from './components/Admin';

function AppContent() {
    const { theme } = useContext(ThemeContext);

    return (
        <div className={`app app-${theme}`}>
            <BrowserRouter>
                <Menu />
                <main className="page">
                    <Routes>
                        <Route path="/" element={<AppointmentsList />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </main>
            </BrowserRouter>
        </div>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <CartProvider>
                    <AppContent />
                </CartProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
