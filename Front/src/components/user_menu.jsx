import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRole } from "../custom_hooks/use_role";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function UserMenu({ onLogoutClick }) {
    const { user } = useRole();
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
    const initials = user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() : "?";

    return (
        <div className="user-menu-wrapper" ref={dropdownRef}>
            <button className="user-avatar" onClick={() => setIsOpen(!isOpen)}>
                {initials}
            </button>

            {isOpen && (
                <div className="user-dropdown">
                    <div className="user-dropdown-header">
                        <p className="user-fullname">{user?.firstName} {user?.lastName}</p>
                        <p className="user-email">{user?.email}</p>
                    </div>
                    <div className="user-dropdown-links">
                        <Link to="/Settings" onClick={() => setIsOpen(false)}>Account Settings</Link>
                        <button onClick={() => { setIsOpen(false); onLogoutClick(); }}>Log out</button>
                    </div>
                </div>
            )}
        </div>
    );
}