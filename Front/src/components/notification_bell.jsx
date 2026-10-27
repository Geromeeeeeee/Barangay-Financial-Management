import { useState, useRef, useEffect } from "react";
import { useNotifications } from "../custom_hooks/use_notifications";
import "../styles/layout.css";

export default function NotificationBell() {
    const { notifications, unreadCount, clearUnread } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) clearUnread();
    };

    const formatTime = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="notification-wrapper" ref={dropdownRef}>
            <button className="notification-btn" onClick={handleToggle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                    </div>
                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <p className="muted" style={{ padding: '15px', textAlign: 'center' }}>No recent activity</p>
                        ) : (
                            notifications.map((n) => (
                                <div key={n.id} className="notification-item">
                                    <div className="notif-dot"></div>
                                    <div className="notif-content">
                                        <p className="notif-title">{n.action}</p>
                                        <p className="notif-desc">{n.details}</p>
                                        <p className="notif-time">{n.username} · {formatTime(n.created_at)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}