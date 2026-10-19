import { useState, useEffect } from "react";

export function useRole() {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
    });

    useEffect(() => {
        const sync = () => {
            try { setUser(JSON.parse(localStorage.getItem("user") || "null")); } catch { setUser(null); }
        };
        window.addEventListener("storage", sync);
        const interval = setInterval(sync, 300);
        return () => { window.removeEventListener("storage", sync); clearInterval(interval); };
    }, []);

    const role = (user?.role || "").toLowerCase() || null;

    const hasRole = (allowedRoles) => allowedRoles.includes(role);

    return {
        user,
        role,
        hasRole,
        isAdmin:     hasRole(["admin"]),
        isTreasurer: hasRole(["treasurer"]),
        isStaff:     hasRole(["staff"]),
        isSK:        hasRole(["sk_chairman", "sk_member"]),
        isLoggedIn:  !!user,
    };
}