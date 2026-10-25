import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { loginRequest, registerRequest, getProfile } from "../api/auth";

function loadSavedUser() {
    try {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(loadSavedUser);
    const userId = user ? user.user_id : null;

    function saveUser(newUser) {
        setUser(newUser);
        if (newUser) {
            localStorage.setItem("user", JSON.stringify(newUser));
        } else {
            localStorage.removeItem("user");
        }
    }

    async function login(email, password) {
        const data = await loginRequest(email, password);
        saveUser(data);
        return data;
    }

    async function register(name, email, password) {
        const data = await registerRequest(name, email, password);
        saveUser(data);
        return data;
    }

    function logout() {
        saveUser(null);
    }

    useEffect(() => {
        if (!userId) return;
        getProfile(userId)
            .then(profile => {
                setUser(profile);
                localStorage.setItem("user", JSON.stringify(profile));
            })
            .catch(err => console.error(err));
    }, [userId]);

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
