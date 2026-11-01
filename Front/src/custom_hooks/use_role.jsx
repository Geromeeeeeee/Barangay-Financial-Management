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
        window.addEventListener("focus", sync);
        const interval = setInterval(sync, 500); 

        return () => {
            window.removeEventListener("storage", sync);
            window.removeEventListener("focus", sync);
            clearInterval(interval);
        };
    }, []);

    const role = (user?.role || "").toLowerCase() || null;

    return {
        user,
        role,
        isAdmin:     role === "admin",
        isTreasurer: role === "treasurer",
        isStaff:     role === "staff",
        isSK:        role === "sk_chairman" || role === "sk_member",
        isLoggedIn:  !!user,
    };
}