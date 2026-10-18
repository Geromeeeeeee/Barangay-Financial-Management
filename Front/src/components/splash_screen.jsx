import sealLogo from "../assets/barangay-malagasang-logo.jpg";
import '../styles/auth.css';

export default function Splash_Screen() {
    return (
        <div className="splash-screen">
            <div className="splash-content">
                <div className="splash-logo">
                    <img src={sealLogo} alt="Barangay Malagasang II-A Seal" className="splash-logo-img" />
                </div>
                <h1 className="splash-title">Barangay Malagasang II-A</h1>
                <p className="splash-subtitle">Financial Management System</p>
                <div className="splash-loader">
                    <span></span><span></span><span></span>
                </div>
            </div>
        </div>
    );
}