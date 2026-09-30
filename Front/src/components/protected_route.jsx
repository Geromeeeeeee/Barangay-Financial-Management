import { useState, useEffect } from "react"
import { Navigate, Outlet } from "react-router-dom";
import axios from "axios"
const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";
export function Protected_Route () {
    const [session, setSession] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(()=>{
        const checkSession = async () => {

            try {
                const response = await axios.get(
                    `${API_URL}session.php`, {
                        withCredentials: true
                    }
                )
                if (response.data.status === "logged") {
                    setSession(true);
                } else {
                    setSession(false);
                }
            } catch {
                setSession(false);
            } finally {
                setLoading(false);
            }
        };
        checkSession()
    }, [])

    if(loading){
        return <h1>Loading...</h1>
    }

    if (!session){
        return <Navigate to={"/"} replace/>
    }
    return<Outlet/>
}