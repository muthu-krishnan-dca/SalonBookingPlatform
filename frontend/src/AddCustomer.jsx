import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AddCustomer() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const validateForm = () => {
        if (!name.trim()) {
            setError("Customer name is required.");
            return false;
        }

        if (name.trim().length < 2) {
            setError("Name must be at least 2 characters long.");
            return false;
        }

        if (!email.trim()) {
            setError("Email address is required.");
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError("Please enter a valid email address.");
            return false;
        }

        if (phone.trim()) {
            const phoneRegex = /^[0-9+\s\-()]{7,15}$/;
            if (!phoneRegex.test(phone.trim())) {
                setError("Please enter a valid phone number (7-15 digits).");
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // 2️⃣ Form Validation Check
        if (!validateForm()) {
            return;
        }

        setSubmitting(true);

        try {
            // 3️⃣ Backend Connection: POST /customers
            const res = await fetch("http://127.0.0.1:8000/customers/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    phone: phone.trim() || null,
                    address: address.trim() || null,
                    password: "customer123",
                    role: "CUSTOMER",
                }),
            });

            const data = await res.json();

            // 5️⃣ Success & 6️⃣ Error Handling
            if (res.ok) {
                alert("Customer added successfully!");
                navigate("/customers");
            } else {
                setError(data.detail || "Failed to add customer. Please try again.");
            }
        } catch (err) {
            console.error("Add customer error:", err);
            setError("Unable to connect to server. Please ensure the backend is running.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="booking-page">
            <div className="page-header" style={{ maxWidth: "480px", margin: "0 auto 20px auto" }}>
                <div>
                    <h1>Salon Booking System</h1>
                    <h2>👤 Add New Customer</h2>
                </div>
            </div>

            <div className="booking-card">
                {error && <div className="alert error">⚠️ {error}</div>}

                <form onSubmit={handleSubmit} className="booking-form" noValidate>
                    <div className="form-group">
                        <label>Name *</label>
                        <input
                            type="text"
                            placeholder="Enter customer full name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (error) setError("");
                            }}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Email *</label>
                        <input
                            type="email"
                            placeholder="e.g. customer@example.com"
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
                            placeholder="e.g. 9876543210"
                            value={phone}
                            onChange={(e) => {
                                setPhone(e.target.value);
                                if (error) setError("");
                            }}
                        />
                    </div>

                    <div className="form-group">
                        <label>Address / City</label>
                        <input
                            type="text"
                            placeholder="Enter customer address or city"
                            value={address}
                            onChange={(e) => {
                                setAddress(e.target.value);
                                if (error) setError("");
                            }}
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="back-btn"
                            onClick={() => navigate("/customers")}
                        >
                            ← Back
                        </button>
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={submitting}
                        >
                            {submitting ? "Adding..." : "➕ Add Customer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddCustomer;
