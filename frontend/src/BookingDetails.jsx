import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function BookingDetails() {
    const { booking_id } = useParams();
    const navigate = useNavigate();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Form states for update
    const [customerId, setCustomerId] = useState("");
    const [salonId, setSalonId] = useState("");
    const [bookingDate, setBookingDate] = useState("");
    const [bookingTime, setBookingTime] = useState("");
    const [service, setService] = useState("");
    const [status, setStatus] = useState("PENDING");

    useEffect(() => {
        fetch(`http://127.0.0.1:8000/bookings/${booking_id}`)
            .then((res) => {
                if (!res.ok) throw new Error("Booking not found");
                return res.json();
            })
            .then((data) => {
                setBooking(data);
                setCustomerId(data.customer_id);
                setSalonId(data.salon_id);
                setBookingDate(data.booking_date);
                setBookingTime(data.booking_time);
                setService(data.service);
                setStatus(data.status || "PENDING");
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError("Unable to load booking details.");
                setLoading(false);
            });
    }, [booking_id]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");
        setError("");

        try {
            const response = await fetch(`http://127.0.0.1:8000/bookings/${booking_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customer_id: parseInt(customerId, 10),
                    salon_id: parseInt(salonId, 10),
                    booking_date: bookingDate,
                    booking_time: bookingTime,
                    service: service,
                    status: status,
                }),
            });

            const updatedData = await response.json();

            if (response.ok) {
                setBooking(updatedData);
                setMessage("✅ Booking updated successfully!");
                setIsEditing(false);
            } else {
                setError(updatedData.detail || "Failed to update booking.");
            }
        } catch (err) {
            console.error("Update error:", err);
            setError("Server connection error during update.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const confirmDelete = window.confirm(`Are you sure you want to delete Booking #${booking_id}?`);
        if (!confirmDelete) return;

        try {
            const response = await fetch(`http://127.0.0.1:8000/bookings/${booking_id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                alert(`Booking #${booking_id} deleted successfully!`);
                navigate("/bookings");
            } else {
                const data = await response.json();
                alert(data.detail || "Failed to delete booking.");
            }
        } catch (err) {
            console.error("Delete error:", err);
            alert("Error connecting to server to delete.");
        }
    };

    if (loading) {
        return (
            <div className="booking-details-page">
                <h2>Loading booking details...</h2>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="booking-details-page">
                <h2>Booking not found</h2>
                <button className="back-btn" onClick={() => navigate("/bookings")}>
                    ← Back to Bookings
                </button>
            </div>
        );
    }

    return (
        <div className="booking-details-page">
            <h1>Salon Booking System</h1>
            <h2>Booking Details — #{booking.id}</h2>

            <div className="booking-details-card">
                {message && <div className="alert success">{message}</div>}
                {error && <div className="alert error">⚠️ {error}</div>}

                {!isEditing ? (
                    <div className="view-mode">
                        <div className="detail-row">
                            <span className="label">Booking ID:</span>
                            <span className="value">#{booking.id}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">✂️ Service:</span>
                            <span className="value">{booking.service}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">📅 Date:</span>
                            <span className="value">{booking.booking_date}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">⏰ Time:</span>
                            <span className="value">{booking.booking_time}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">💇 Salon ID:</span>
                            <span className="value">#{booking.salon_id}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">👤 Customer ID:</span>
                            <span className="value">#{booking.customer_id}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">📌 Status:</span>
                            <span className={`badge ${booking.status?.toLowerCase()}`}>
                                {booking.status || "PENDING"}
                            </span>
                        </div>

                        <div className="action-buttons">
                            <button
                                className="back-btn"
                                onClick={() => navigate("/bookings")}
                            >
                                ← Back
                            </button>
                            <button
                                className="edit-btn"
                                onClick={() => navigate(`/edit-booking/${booking.id}`)}
                            >
                                ✏️ Edit Booking
                            </button>
                            <button
                                className="delete-btn"
                                onClick={handleDelete}
                            >
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleUpdate} className="edit-form">
                        <div className="form-group">
                            <label>Service:</label>
                            <input
                                type="text"
                                value={service}
                                onChange={(e) => setService(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Booking Date:</label>
                            <input
                                type="date"
                                value={bookingDate}
                                onChange={(e) => setBookingDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Booking Time:</label>
                            <input
                                type="time"
                                value={bookingTime}
                                onChange={(e) => setBookingTime(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Status:</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="PENDING">PENDING</option>
                                <option value="CONFIRMED">CONFIRMED</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="CANCELLED">CANCELLED</option>
                            </select>
                        </div>

                        <div className="action-buttons">
                            <button
                                type="button"
                                className="back-btn"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default BookingDetails;
