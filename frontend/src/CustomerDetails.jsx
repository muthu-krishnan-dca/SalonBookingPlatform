import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function CustomerDetails() {
    const { customer_id } = useParams();
    const navigate = useNavigate();

    const [customer, setCustomer] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        setLoading(true);

        // Fetch customer profile
        const fetchProfile = fetch(`http://127.0.0.1:8000/customers/${customer_id}`).then(
            (res) => {
                if (!res.ok) throw new Error("Customer not found");
                return res.json();
            }
        );

        // Fetch customer bookings
        const fetchBookings = fetch(
            `http://127.0.0.1:8000/customers/${customer_id}/bookings`
        ).then((res) => (res.ok ? res.json() : []));

        Promise.all([fetchProfile, fetchBookings])
            .then(([custData, bookingsData]) => {
                setCustomer(custData);
                setBookings(bookingsData);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError("Unable to load customer details.");
                setLoading(false);
            });
    }, [customer_id]);

    const handleDelete = async () => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete ${customer?.name}? All associated bookings will also be removed.`
        );
        if (!confirmDelete) return;

        try {
            const res = await fetch(`http://127.0.0.1:8000/customers/${customer_id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                alert("Customer deleted successfully!");
                navigate("/customers");
            } else {
                const data = await res.json();
                alert(data.detail || "Failed to delete customer.");
            }
        } catch (err) {
            console.error("Delete error:", err);
            alert("Error connecting to server to delete.");
        }
    };

    const getStatusClass = (status) => {
        switch ((status || "").toUpperCase()) {
            case "CONFIRMED":
                return "badge confirmed";
            case "CANCELLED":
                return "badge cancelled";
            case "COMPLETED":
                return "badge completed";
            default:
                return "badge pending";
        }
    };

    if (loading) {
        return (
            <div className="customer-details-page">
                <h2>Loading customer profile...</h2>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="customer-details-page">
                <h2>Customer not found</h2>
                <button className="back-btn" onClick={() => navigate("/customers")}>
                    ← Back to Customers
                </button>
            </div>
        );
    }

    return (
        <div className="customer-details-page">
            <div className="page-header">
                <div>
                    <h1>Salon Booking System</h1>
                    <h2>👤 Customer Profile</h2>
                </div>
                <div className="header-actions">
                    <button className="nav-btn" onClick={() => navigate("/customers")}>
                        ← Back to Customers
                    </button>
                </div>
            </div>

            {error && <div className="alert error">⚠️ {error}</div>}

            <div className="customer-details-card">
                <div className="customer-header-section">
                    <div className="customer-avatar large">
                        {customer.name ? customer.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                        <h2>{customer.name}</h2>
                        <span className="customer-tag">Customer #{customer.id}</span>
                    </div>
                </div>

                <div className="profile-details-grid">
                    <div className="detail-row">
                        <span className="label">📧 Email:</span>
                        <span className="value">{customer.email}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">📞 Phone:</span>
                        <span className="value">{customer.phone || "Not provided"}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">📍 Address:</span>
                        <span className="value">{customer.address || "Not provided"}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">🏷️ Role:</span>
                        <span className="value">{customer.role || "CUSTOMER"}</span>
                    </div>
                </div>

                <div className="action-buttons">
                    <button
                        className="edit-btn"
                        onClick={() => navigate(`/edit-customer/${customer.id}`)}
                    >
                        ✏️ Edit Customer
                    </button>
                    <button className="delete-btn" onClick={handleDelete}>
                        🗑️ Delete Customer
                    </button>
                </div>
            </div>

            {/* Customer Bookings Section */}
            <div className="customer-bookings-section">
                <h3>📅 Bookings History ({bookings.length})</h3>

                {bookings.length === 0 ? (
                    <p className="no-bookings">No bookings placed by this customer yet.</p>
                ) : (
                    <div className="customer-bookings-grid">
                        {bookings.map((booking) => (
                            <div className="customer-booking-item" key={booking.id}>
                                <div className="booking-card-top">
                                    <span className="booking-id">Booking #{booking.id}</span>
                                    <span className={getStatusClass(booking.status)}>
                                        {booking.status || "PENDING"}
                                    </span>
                                </div>
                                <p><strong>✂️ Service:</strong> {booking.service}</p>
                                <p><strong>📅 Date:</strong> {booking.booking_date}</p>
                                <p><strong>⏰ Time:</strong> {booking.booking_time}</p>
                                <p><strong>💇 Salon ID:</strong> #{booking.salon_id}</p>

                                <button
                                    className="details-btn small"
                                    onClick={() => navigate(`/bookings/${booking.id}`)}
                                >
                                    View Booking Details
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CustomerDetails;
