import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { setUser, isAuthenticated } from "./auth";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // If user is already authenticated, redirect to dashboard
    useEffect(() => {
        if (isAuthenticated()) {
            navigate("/dashboard");
        }
    }, [navigate]);

    const validateForm = () => {
        if (!email.trim()) {
            setError("Email address is required.");
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError("Please enter a valid email address.");
            return false;
        }

        if (!password) {
            setError("Password is required.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!validateForm()) return;

        setSubmitting(true);

        try {
            const res = await fetch("http://127.0.0.1:8000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password: password,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                // Save user session to localStorage
                const userRole = (data.role || "CUSTOMER").toUpperCase();
                setUser({
                    user_id: data.user_id,
                    name: data.name || email.split("@")[0],
                    email: data.email || email,
                    role: userRole,
                    access_token: data.access_token,
                });

                localStorage.setItem("user_id", String(data.user_id));

                // Navigate directly to role-specific home
                if (userRole === "SALON_OWNER") {
                    navigate("/owner/dashboard");
                } else if (userRole === "ADMIN") {
                    navigate("/admin");
                } else {
                    navigate("/dashboard");
                }
            } else {
                setError(data.detail || "Invalid email or password.");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("Unable to connect to server. Please check backend connection.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Welcome Back</h2>
                    <p>Login to access your personalized dashboard</p>
                </div>

                {error && <div className="alert error">⚠️ {error}</div>}

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="Enter your registered email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (error) setError("");
                            }}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <div className="form-label-row">
                            <label>Password</label>
                            <Link to="/forgot-password" className="forgot-link">
                                Forgot Password?
                            </Link>
                        </div>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (error) setError("");
                            }}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={submitting}
                    >
                        {submitting ? "LOGGING IN..." : "LOGIN"}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Don't have an account?{" "}
                        <Link to="/register" className="auth-link">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
