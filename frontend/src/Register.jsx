import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("CUSTOMER");

    // Optional / Conditional Salon fields for Salon Owners
    const [salonName, setSalonName] = useState("");
    const [salonCity, setSalonCity] = useState("");
    const [salonAddress, setSalonAddress] = useState("");
    const [salonDescription, setSalonDescription] = useState("");
    const [salonPhone, setSalonPhone] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const validateForm = () => {
        if (!name.trim()) {
            setError("Name is required.");
            return false;
        }

        if (name.trim().length < 2) {
            setError("Name must be at least 2 characters.");
            return false;
        }

        if (!email.trim()) {
            setError("Email is required.");
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError("Please enter a valid email address.");
            return false;
        }

        if (!password || password.length < 6) {
            setError("Password must be at least 6 characters.");
            return false;
        }

        if (phone.trim()) {
            const phoneRegex = /^[0-9+\s\-()]{7,15}$/;
            if (!phoneRegex.test(phone.trim())) {
                setError("Please enter a valid phone number (7-15 digits).");
                return false;
            }
        }

        if (role === "SALON_OWNER") {
            if (!salonName.trim()) {
                setError("Please enter your Salon Name.");
                return false;
            }
            if (!salonCity.trim()) {
                setError("Please enter your Salon City.");
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!validateForm()) return;

        setSubmitting(true);

        try {
            const payload = {
                name: name.trim(),
                email: email.trim(),
                password: password,
                phone: phone.trim() || null,
                address: address.trim() || null,
                role: role,
            };

            if (role === "SALON_OWNER") {
                payload.salon_name = salonName.trim();
                payload.salon_city = salonCity.trim();
                payload.salon_address = salonAddress.trim() || address.trim() || null;
                payload.salon_description = salonDescription.trim() || null;
                payload.salon_phone = salonPhone.trim() || phone.trim() || null;
            }

            const res = await fetch("http://127.0.0.1:8000/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                alert("Registration successful! Please login.");
                navigate("/login");
            } else {
                setError(data.detail || "Registration failed. Please try again.");
            }
        } catch (err) {
            console.error("Register error:", err);
            setError("Unable to connect to server. Please check backend.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Create Your Account</h2>
                </div>

                {error && <div className="alert error">⚠️ {error}</div>}

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (error) setError("");
                            }}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (error) setError("");
                            }}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Phone</label>
                        <input
                            type="tel"
                            placeholder="Enter phone number"
                            value={phone}
                            onChange={(e) => {
                                setPhone(e.target.value);
                                if (error) setError("");
                            }}
                        />
                    </div>

                    <div className="form-group">
                        <label>Address</label>
                        <input
                            type="text"
                            placeholder="Enter your address"
                            value={address}
                            onChange={(e) => {
                                setAddress(e.target.value);
                                if (error) setError("");
                            }}
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
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

                    <div className="form-group">
                        <label>Account Type</label>
                        <select
                            value={role}
                            onChange={(e) => {
                                setRole(e.target.value);
                                if (error) setError("");
                            }}
                            className="auth-select"
                        >
                            <option value="CUSTOMER">CUSTOMER</option>
                            <option value="SALON_OWNER">SALON_OWNER</option>
                        </select>
                    </div>

                    {/* Conditional Salon Details for Salon Owner */}
                    {role === "SALON_OWNER" && (
                        <div className="owner-register-fields">
                            <div className="form-group">
                                <label>Salon Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Royal Glow Unisex Salon"
                                    value={salonName}
                                    onChange={(e) => {
                                        setSalonName(e.target.value);
                                        if (error) setError("");
                                    }}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Salon City *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Chennai, Madurai"
                                    value={salonCity}
                                    onChange={(e) => {
                                        setSalonCity(e.target.value);
                                        if (error) setError("");
                                    }}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Salon Address</label>
                                <input
                                    type="text"
                                    placeholder="Salon street / landmark"
                                    value={salonAddress}
                                    onChange={(e) => {
                                        setSalonAddress(e.target.value);
                                        if (error) setError("");
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Offered Services</label>
                                <input
                                    type="text"
                                    placeholder="Haircut, Spa, Facial, Styling"
                                    value={salonDescription}
                                    onChange={(e) => {
                                        setSalonDescription(e.target.value);
                                        if (error) setError("");
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Salon Contact Phone</label>
                                <input
                                    type="tel"
                                    placeholder="e.g. 9876543210"
                                    value={salonPhone}
                                    onChange={(e) => {
                                        setSalonPhone(e.target.value);
                                        if (error) setError("");
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={submitting}
                    >
                        {submitting ? "REGISTERING..." : "REGISTER"}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{" "}
                        <Link to="/login" className="auth-link">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;
