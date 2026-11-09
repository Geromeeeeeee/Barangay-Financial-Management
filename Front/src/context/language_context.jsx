import { createContext, useContext, useState, useEffect } from "react";

const translations = {
    en: {
        dashboard: "Dashboard",
        revenue: "Revenue",
        expenditures: "Expenditures",
        reports: "Reports",
        settings: "Settings",
        logout: "Logout",
        welcome: "Welcome",
        totalRevenue: "Total Revenue",
        totalExpenditures: "Total Expenditures",
        remaining: "Remaining",
        addClearance: "Issue New Clearance",
        profileInfo: "Profile Information",
        security: "Security & Password",
        saveChanges: "Save Changes",
        cancel: "Cancel",
        // Add more as needed
    },
    tl: {
        dashboard: "Dashboard",
        revenue: "Kita",
        expenditures: "Gastos",
        reports: "Ulat",
        settings: "Mga Setting",
        logout: "Mag-logout",
        welcome: "Maligayang Pagdating",
        totalRevenue: "Kabuuang Kita",
        totalExpenditures: "Kabuuang Gastos",
        remaining: "Natitira",
        addClearance: "Maglabas ng Clearance",
        profileInfo: "Impormasyon ng Profile",
        security: "Seguridad at Password",
        saveChanges: "I-save ang mga Pagbabago",
        cancel: "Kanselahin",
        // Add more as needed
    }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState("en");

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser && storedUser.language) {
            setLanguage(storedUser.language);
        }
    }, []);

    const t = (key) => translations[language][key] || key;

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}