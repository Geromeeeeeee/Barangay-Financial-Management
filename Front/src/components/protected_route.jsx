import { useState, useEffect } from "react"
import { Navigate, Outlet } from "react-router-dom";
import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export function Protected_Route({ allowedRoles }) {
    const [session, setSession] = useState(false)
    const [role, setRole] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await axios.get(
                    `${API_URL}session.php`, {
                        withCredentials: true
                    }
                )
                if (response.data.status === "logged") {
                    setSession(true);
                    setRole(response.data.user?.role || null);

                    // Keep localStorage in sync with server
                    if (response.data.user) {
                        localStorage.setItem("user", JSON.stringify(response.data.user));
                    }
                } else {
                    setSession(false);
                    localStorage.removeItem("user");
                }
            } catch {
                setSession(false);
                localStorage.removeItem("user");
            } finally {
                setLoading(false);
            }
        };
        checkSession()
    }, [])

    if (loading) {
        return <h1>Loading...</h1>
    }

    if (!session) {
        return <Navigate to={"/"} replace />
    }

    // Role check (only runs if allowedRoles is passed)
    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to={"/Dashboard"} replace />
    }

    return <Outlet />
}