import { useState, useEffect } from "react";

export function useRole() {
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    });

    useEffect(() => {
        const sync = () => {
            try {
                setUser(JSON.parse(localStorage.getItem("user") || "null"));
            } catch {
                setUser(null);
            }
        };

        window.addEventListener("storage", sync);
        const interval = setInterval(sync, 300);

        return () => {
            window.removeEventListener("storage", sync);
            clearInterval(interval);
        };
    }, []);

    const role = user?.role || null;

    return {
        user,
        role,
        isAdmin:     role === "admin",
        isTreasurer: role === "treasurer",
        isStaff:     role === "staff",
        isLoggedIn:  !!user,
    };
}