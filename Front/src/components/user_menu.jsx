import { useRole } from "../custom_hooks/use_role";
import { useNavigate } from "react-router-dom";

const BASE_URL = "http://localhost/Capstone/Back/";

export default function UserMenu() {
    const { user } = useRole();
    const navigate = useNavigate();

    const initials = user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() : "?";
    const avatarSrc = user?.profile_picture ? `${BASE_URL}${user.profile_picture}` : null;

    return (
        <button className="user-avatar" onClick={() => navigate("/Settings")} title="Account Settings">
            {avatarSrc ? (
                <img src={avatarSrc} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : (
                initials
            )}
        </button>
    );
}