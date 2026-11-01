import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useRole } from "../custom_hooks/use_role";

const BASE_URL = "http://localhost/Capstone/Back/";

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
    const avatarSrc = user?.profile_picture ? `${BASE_URL}${user.profile_picture}` : null;

    return (
        <div className="user-menu-wrapper" ref={dropdownRef}>
            <button className="user-avatar" onClick={() => setIsOpen(!isOpen)}>
                {avatarSrc ? (
                    <img src={avatarSrc} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                ) : (
                    initials
                )}
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