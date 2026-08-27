import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const fetchCustomers = () => {
        setLoading(true);
        fetch("http://127.0.0.1:8000/customers/")
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch customers");
                return res.json();
            })
            .then((data) => {
                setCustomers(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error:", err);
                setError("Unable to load customers from backend.");
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleDelete = async (customerId, customerName) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete customer "${customerName}" (#${customerId})? This will also remove their associated bookings.`
        );
        if (!confirmDelete) return;

        try {
            const res = await fetch(`http://127.0.0.1:8000/customers/${customerId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                alert(`Customer #${customerId} deleted successfully!`);
                setCustomers((prev) => prev.filter((c) => c.id !== customerId));
            } else {
                const data = await res.json();
                alert(data.detail || "Failed to delete customer.");
            }
        } catch (err) {
            console.error("Delete error:", err);
            alert("Error connecting to server to delete customer.");
        }
    };

    return (
        <div className="customers-page">
            <div className="page-header">
                <div>
                    <h1>Salon Booking System</h1>
                    <h2>👤 Customers List</h2>
                </div>
                <div className="header-actions">
                    <button className="nav-btn" onClick={() => navigate("/")}>
                        🏠 Dashboard
                    </button>
                    <button
                        className="nav-btn primary"
                        onClick={() => navigate("/add-customer")}
                    >
                        + Add Customer
                    </button>
                </div>
            </div>

            {loading && <h3>Loading customers...</h3>}
            {error && <div className="alert error">⚠️ {error}</div>}

            {!loading && !error && customers.length === 0 && (
                <div className="empty-state">
                    <p>No customers found.</p>
                    <button
                        onClick={() => navigate("/add-customer")}
                        className="submit-btn"
                    >
                        Add First Customer
                    </button>
                </div>
            )}

            <div className="customer-grid">
                {customers.map((cust) => (
                    <div className="customer-card" key={cust.id}>
                        <div className="customer-card-header">
                            <div className="customer-avatar">
                                {cust.name ? cust.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div>
                                <h3>{cust.name}</h3>
                                <span className="customer-tag">Customer #{cust.id}</span>
                            </div>
                        </div>

                        <div className="customer-info">
                            <p>📧 <strong>Email:</strong> {cust.email}</p>
                            <p>📞 <strong>Phone:</strong> {cust.phone || "Not specified"}</p>
                            <p>📍 <strong>Address:</strong> {cust.address || "Not specified"}</p>
                        </div>

                        <div className="customer-card-actions">
                            <button
                                className="details-btn"
                                onClick={() => navigate(`/customers/${cust.id}`)}
                            >
                                View Details
                            </button>
                            <button
                                className="delete-btn"
                                onClick={() => handleDelete(cust.id, cust.name)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Customers;
