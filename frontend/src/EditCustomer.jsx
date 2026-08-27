import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function EditCustomer() {
    const { customer_id } = useParams();
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch(`http://127.0.0.1:8000/customers/${customer_id}`)
            .then((res) => {
                if (!res.ok) throw new Error("Customer not found");
                return res.json();
            })
            .then((data) => {
                setName(data.name || "");
                setEmail(data.email || "");
                setPhone(data.phone || "");
                setAddress(data.address || "");
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching customer:", err);
                setError("Unable to load customer profile.");
                setLoading(false);
            });
    }, [customer_id]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError("");

        try {
            const res = await fetch(`http://127.0.0.1:8000/customers/${customer_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    phone: phone || null,
                    address: address || null,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                alert("Customer profile updated successfully!");
                navigate(`/customers/${customer_id}`);
            } else {
                setError(data.detail || "Failed to update customer.");
            }
        } catch (err) {
            console.error("Update error:", err);
            setError("Server connection error during update.");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="booking-page">
                <h2>Loading customer data...</h2>
            </div>
        );
    }

    return (
        <div className="booking-page">
            <h1>Salon Booking System</h1>
            <h2>✏️ Edit Customer #{customer_id}</h2>

            <div className="booking-card">
                {error && <div className="alert error">⚠️ {error}</div>}

                <form onSubmit={handleUpdate} className="booking-form">
                    <div className="form-group">
                        <label>Customer Name:</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Email Address:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Phone Number:</label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Address / City:</label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="back-btn"
                            onClick={() => navigate(`/customers/${customer_id}`)}
                        >
                            ← Cancel
                        </button>
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={updating}
                        >
                            {updating ? "Updating..." : "Update Customer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditCustomer;
