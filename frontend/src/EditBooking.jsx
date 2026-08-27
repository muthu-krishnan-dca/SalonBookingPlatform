import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function EditBooking() {
    const { booking_id } = useParams();
    const navigate = useNavigate();

    const [customerId, setCustomerId] = useState("");
    const [salonId, setSalonId] = useState("");
    const [service, setService] = useState("");
    const [bookingDate, setBookingDate] = useState("");
    const [bookingTime, setBookingTime] = useState("");
    const [status, setStatus] = useState("PENDING");

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState("");

    // Load existing booking details
    useEffect(() => {
        fetch(`http://127.0.0.1:8000/bookings/${booking_id}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Booking not found");
                }
                return res.json();
            })
            .then((data) => {
                setCustomerId(data.customer_id);
                setSalonId(data.salon_id);
                setService(data.service);
                setBookingDate(data.booking_date);
                setBookingTime(data.booking_time);
                setStatus(data.status || "PENDING");
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error loading booking:", err);
                setError("Unable to load booking details.");
                setLoading(false);
            });
    }, [booking_id]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
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
                    service: service,
                    booking_date: bookingDate,
                    booking_time: bookingTime,
                    status: status,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Booking updated successfully!");
                navigate("/bookings");
            } else {
                setError(data.detail || "Failed to update booking.");
            }
        } catch (err) {
            console.error("Update error:", err);
            setError("Server connection error while updating.");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="booking-page">
                <h2>Loading booking data...</h2>
            </div>
        );
    }

    if (error && !customerId) {
        return (
            <div className="booking-page">
                <div className="alert error">⚠️ {error}</div>
                <button className="back-btn" onClick={() => navigate("/bookings")}>
                    ← Back to All Bookings
                </button>
            </div>
        );
    }

    return (
        <div className="booking-page">
            <h1>Salon Booking System</h1>
            <h2>Edit Booking #{booking_id}</h2>

            <div className="booking-card">
                {error && <div className="alert error">⚠️ {error}</div>}

                <form onSubmit={handleUpdate} className="booking-form">
                    <div className="form-group">
                        <label>Customer ID:</label>
                        <input
                            type="number"
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Select Service:</label>
                        <select
                            value={service}
                            onChange={(e) => setService(e.target.value)}
                            required
                        >
                            <option value="Haircut">💇 Haircut</option>
                            <option value="Beard Trim & Styling">✂️ Beard Trim & Styling</option>
                            <option value="Hair Spa & Treatment">💆 Hair Spa & Treatment</option>
                            <option value="Facial & Skin Care">✨ Facial & Skin Care</option>
                            <option value="Hair Coloring">🎨 Hair Coloring</option>
                            <option value="Bridal / Groom Makeup">💄 Bridal / Groom Makeup</option>
                        </select>
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

                    <div className="form-actions">
                        <button
                            type="button"
                            className="back-btn"
                            onClick={() => navigate(`/bookings/${booking_id}`)}
                        >
                            ← Back
                        </button>
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={updating}
                        >
                            {updating ? "Updating..." : "Update Booking"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditBooking;
