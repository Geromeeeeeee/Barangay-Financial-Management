import "../styles/auth.css";
import sealLogo from "../assets/barangay-malagasang-logo.jpg";
import splashPhoto from "../assets/Malagasang-2A-5.jpg";

export default function Splash_Screen() {
    return (
        <div className="splash-screen">
            <div 
                className="splash-bg-animated" 
                style={{ backgroundImage: `url(${splashPhoto})` }}
            ></div>
            <div className="splash-overlay"></div>
            
            <div className="splash-content">
                <div className="splash-logo">
                    <img src={sealLogo} alt="Barangay Malagasang II-A Seal" className="splash-logo-img" />
                </div>
                <h1 className="splash-title">Barangay Malagasang II-A</h1>
                <p className="splash-subtitle">Financial Management System</p>
                <div className="splash-loader">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    );
}