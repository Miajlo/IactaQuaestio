import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User, Lock, Mail, LogIn, UserPlus, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import "../styles/AuthForm.css";
import authService from "../services/authService.ts";

function AuthForm() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        // Check if already logged in
        if (authService.isAuthenticated()) {
            navigate("/");
        }

        if (location.state?.isLogin !== undefined) {
            setIsLogin(location.state.isLogin);
        }
    }, [location.state, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage("");

        try {
            if (isLogin) {
                // Login
                await authService.login({
                    username: email, // OAuth2 uses 'username' field
                    password: password
                });

                setMessage("Login successful! Redirecting...");
                setIsSuccess(true);

                setTimeout(() => {
                    navigate("/");
                }, 1500);
            } else {
                // Register
                await authService.register({
                    email: email,
                    password: password
                });

                setMessage("Registration successful! Please login.");
                setIsSuccess(true);

                // Switch to login mode after successful registration
                setTimeout(() => {
                    setIsLogin(true);
                    setPassword("");
                    setMessage("");
                }, 2000);
            }
        } catch (error: any) {
            console.error("Auth error:", error);
            let errorMessage;
            const detail = error.response?.data?.detail;

            if (typeof detail === 'string') 
                errorMessage = detail;
            else if (detail && typeof detail === 'object')
                errorMessage = JSON.stringify(detail);
            else {
                errorMessage = isLogin ?
                               "Login failed. Please check your credentials." : 
                               "Registration failed. Email might already be registered.";
            }

            setMessage(errorMessage);
            setIsSuccess(false);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setEmail("");
        setPassword("");
        setMessage("");
        setIsSuccess(false);
    };

    return (
        <div className="auth-container">
            <button onClick={() => navigate('/')} className="back-to-home">
                <ArrowLeft/>
                <span>Back to Home</span>
            </button>

            <div className="auth-card">
                <div className="auth-header">
                    <div className="header-icon-wrapper">
                        {isLogin ? <LogIn className="header-icon" /> : <UserPlus className="header-icon" />}
                    </div>
                    <h1 className="auth-title">{isLogin ? "Welcome Back" : "Create Account"}</h1>
                    <p className="auth-subtitle">
                        {isLogin ? "Sign in to continue to your account" : "Sign up to get started"}
                    </p>
                </div>

                <div className="auth-form-wrapper">
                    <div className="auth-tabs">
                        <button
                            type="button"
                            onClick={() => setIsLogin(true)}
                            className={`auth-tab ${isLogin ? 'active' : ''}`}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsLogin(false)}
                            className={`auth-tab ${!isLogin ? 'active' : ''}`}
                        >
                            Register
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">
                                <Mail />
                                Email Address
                            </label>
                            <input
                                type="email"
                                placeholder="your.email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <Lock />
                                Password
                            </label>
                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-input"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="submit-btn"
                        >
                            {isLoading ? (
                                <span className="loading-spinner">
                                    <svg className="spinner" viewBox="0 0 24 24">
                                        <circle
                                            className="spinner-circle"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                        />
                                        <path
                                            className="spinner-path"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    {isLogin ? "Signing in..." : "Creating account..."}
                                </span>
                            ) : (
                                <>
                                    {isLogin ? <LogIn className="btn-icon" /> : <UserPlus className="btn-icon" />}
                                    {isLogin ? "Sign In" : "Sign Up"}
                                </>
                            )}
                        </button>

                        {message && (
                            <div className={`message-box ${isSuccess ? 'success' : 'error'}`}>
                                {isSuccess ? <CheckCircle /> : <AlertCircle />}
                                <p className="message-text">{message}</p>
                            </div>
                        )}
                    </form>

                    <div className="auth-footer">
                        <p className="footer-text">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <button onClick={toggleMode} className="toggle-btn">
                                {isLogin ? "Sign up" : "Sign in"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthForm;
