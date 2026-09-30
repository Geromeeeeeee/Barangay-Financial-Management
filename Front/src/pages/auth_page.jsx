import { useState } from "react";
import '../styles/auth.css';
import useAuth from "../custom_hooks/use_auth";
import { useErr } from "../custom_hooks/use_err";
import { useStat } from "../custom_hooks/use_stat";

export default function Auth_Page() {
    const [isLogin, setIsLogin] = useState(true);
    const [stat, setStat] = useStat();
    const [err, setErr] = useErr()
    const {handleSubmit, handleFormChange, accountDetails} = useAuth({isLogin, setErr, setStat, setIsLogin});

    return (
        <main className="auth-page">
            <section className="auth-card">
                <h1>{isLogin ? "Log in" : "Create an account"}</h1>
                <p className="auth-subtitle">
                    {isLogin ? "Enter your details to continue." : "Sign up to get started today."}
                </p>
                {err && (<p className="Font-Error">{err}</p>)}
                {stat && (<p className="Font-Error">{stat}</p>)}

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                    <>
                    <label>First name
                        <input type="text" placeholder="Your name" required 
                        name="firstName" value={accountDetails.firstName} onChange={handleFormChange}/>
                    </label>
                    <label>Last name
                        <input type="text" placeholder="Your name" required 
                        name="lastName" value={accountDetails.lastName} onChange={handleFormChange}/>
                    </label>
                    <label>Email address
                        <input type="email" placeholder="you@example.com" required name="email" value={accountDetails.email} onChange={handleFormChange}/>
                    </label>
                    </>
                    )}
                    <label>Username
                        <input type="text" placeholder="Username" required 
                        name="userName" value={accountDetails.userName} onChange={handleFormChange}/>
                        </label>
                    <label>Password
                        <input type="password" placeholder="••••••••" required name="password" value={accountDetails.password} onChange={handleFormChange}/>
                    </label>
                    {!isLogin && (
                        <label>Confirm password
                            <input type="password" placeholder="••••••••" required name="confirmPass" value={accountDetails.confirmPass} onChange={handleFormChange}/>
                        </label>
                    )}
                    {!isLogin && (
                        <label>Account type
                            <select name="role" value={accountDetails.role} onChange={handleFormChange} className="drop-down">
                                <option value="" disabled>Select an account type</option>
                                <option value="Staff">Staff</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </label>
                    )}
                    
                    {isLogin && <a className="forgot" href="#forgot-password">Forgot password?</a>}
                    <button className="submit-button" type="submit">{isLogin ? "Log in" : "Sign up"}</button>
                </form>

                <p className="auth-switch">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                    <p onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? "Sign up" : "Log in"}
                    </p>
                </p>
            </section>
        </main>
    );
}