import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export function useNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get(`${API_URL}admin/get_audit_logs.php`, { withCredentials: true });
            if (Array.isArray(res.data)) {
                const recent = res.data.slice(0, 5);
                setNotifications(recent);
                setUnreadCount(recent.length); 
            }
        } catch (err) {
            console.error("Failed to load notifications", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const clearUnread = () => setUnreadCount(0);

    return { notifications, unreadCount, clearUnread, fetchNotifications };
}