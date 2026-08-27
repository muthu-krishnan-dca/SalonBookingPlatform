import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getUser } from "./auth";

const POPULAR_SLOTS = [
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "02:00 PM",
    "03:30 PM",
    "05:00 PM",
    "06:30 PM",
    "08:00 PM"
];

function BookAppointment() {
    const { salon_id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const currentUser = getUser();

    // Read preselected service if passed via query e.g. ?service=Hair+Spa
    const queryParams = new URLSearchParams(location.search);
    const initialServiceFromQuery = queryParams.get("service") || "";

    const [salon, setSalon] = useState(null);
    const [customerId, setCustomerId] = useState(
        currentUser?.user_id ? String(currentUser.user_id) : (localStorage.getItem("user_id") || "1")
    );
    const [bookingDate, setBookingDate] = useState("");
    const [bookingTime, setBookingTime] = useState("");
    const [service, setService] = useState(initialServiceFromQuery || "Haircut");
    const [servicesList, setServicesList] = useState(["Haircut", "Beard Trim & Styling", "Hair Spa", "Facial", "Hair Coloring"]);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Fetch salon info to show salon name and extract its specific services
    useEffect(() => {
        if (salon_id) {
            fetch(`http://127.0.0.1:8000/salons/${salon_id}`)
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    if (data) {
                        setSalon(data);
                        if (data.description) {
                            const parsed = data.description
                                .split(/[,•|\n]+/)
                                .map((s) => s.trim())
                                .filter(Boolean);
                            if (parsed.length > 0) {
                                setServicesList(parsed);
                                if (initialServiceFromQuery) {
                                    const match = parsed.find(
                                        (s) => s.toLowerCase() === initialServiceFromQuery.toLowerCase()
                                    );
                                    setService(match || initialServiceFromQuery);
                                } else {
                                    setService(parsed[0]);
                                }
                            }
                        }
                    }
                })
                .catch((err) => console.error("Error fetching salon:", err));
        }
    }, [salon_id, initialServiceFromQuery]);

    const handleBooking = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        if (!customerId || !bookingDate || !bookingTime || !service) {
            setErrorMessage("Please fill in all the required fields.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("http://127.0.0.1:8000/bookings/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customer_id: parseInt(customerId, 10),
                    salon_id: parseInt(salon_id, 10),
                    booking_date: bookingDate,
                    booking_time: bookingTime,
                    service: service,
                    status: "PENDING",
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage("🎉 Appointment requested successfully! The salon owner will confirm your slot.");
                alert(`Appointment for "${service}" at ${salon?.name || "the salon"} booked successfully! The owner will review and confirm.`);
                navigate("/bookings");
            } else {
                setErrorMessage(data.detail || "Booking failed. Please try again.");
            }
        } catch (error) {
            console.error("Booking error:", error);
            setErrorMessage("Unable to connect to the backend server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="salons-page">
            <div className="page-header salons-header">
                <div>
                    <h1>Salon Booking System</h1>
                    <h2>📅 Schedule Appointment</h2>
                </div>
                <div className="header-actions">
                    <button className="nav-btn" onClick={() => navigate(`/salons/${salon_id}`)}>
                        ← Back to Salon
                    </button>
                    <button className="nav-btn" onClick={() => navigate("/bookings")}>
                        📅 My Bookings
                    </button>
                </div>
            </div>

            <div className="booking-card" style={{ maxWidth: "540px", margin: "0 auto" }}>
                {salon && (
                    <div className="booking-salon-info">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span className="card-badge">Selected Salon</span>
                            <span style={{
                                fontSize: "11.5px",
                                fontWeight: "800",
                                padding: "2px 8px",
                                borderRadius: "10px",
                                background: salon.is_open !== false ? "rgba(16, 185, 129, 0.18)" : "rgba(239, 68, 68, 0.18)",
                                color: salon.is_open !== false ? "#34d399" : "#f87171",
                                border: salon.is_open !== false ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)"
                            }}>
                                {salon.is_open !== false ? "🟢 Open & Online" : "🔴 Closed / Offline"}
                            </span>
                        </div>
                        <h3 style={{ marginTop: "6px", fontSize: "20px" }}>💈 {salon.name}</h3>
                        <p>📍 {salon.address}, {salon.city}</p>
                        <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                            ⏰ <strong>Business Hours:</strong> {salon.opening_time || "09:00 AM"} – {salon.closing_time || "09:00 PM"}
                        </p>
                        {salon.phone && <p>📞 {salon.phone}</p>}
                    </div>
                )}

                {salon && salon.is_open === false && (
                    <div className="alert error" style={{ margin: "14px 0" }}>
                        ⛔ <strong>Online Bookings Currently Paused:</strong> This salon owner has temporarily turned off online appointments for today. You cannot book appointments right now.
                    </div>
                )}

                {successMessage && (
                    <div className="alert success">
                        {successMessage}
                    </div>
                )}

                {errorMessage && (
                    <div className="alert error">
                        ⚠️ {errorMessage}
                    </div>
                )}

                <form onSubmit={handleBooking} className="booking-form">
                    <div className="form-group">
                        <label>Booking For (Customer):</label>
                        <input
                            type="text"
                            value={currentUser?.name ? `${currentUser.name} (${currentUser.email || "Customer"})` : `Customer ID #${customerId}`}
                            disabled
                            style={{ opacity: 0.85, cursor: "not-allowed", background: "rgba(255, 255, 255, 0.05)" }}
                        />
                    </div>

                    <div className="form-group">
                        <label>Select Offered Service *</label>
                        <select
                            value={service}
                            onChange={(e) => setService(e.target.value)}
                            disabled={salon?.is_open === false}
                            required
                        >
                            {servicesList.map((svc, idx) => (
                                <option key={idx} value={svc}>
                                    ✂️ {svc}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Appointment Date *</label>
                        <input
                            type="date"
                            value={bookingDate}
                            min={new Date().toISOString().split("T")[0]}
                            onChange={(e) => setBookingDate(e.target.value)}
                            disabled={salon?.is_open === false}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Select Time Slot *</label>
                        <div className="time-slots-picker">
                            {POPULAR_SLOTS.map((slot, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    disabled={salon?.is_open === false}
                                    className={`slot-chip ${bookingTime === slot ? "selected" : ""}`}
                                    onClick={() => setBookingTime(slot)}
                                >
                                    ⏰ {slot}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Or enter custom time (e.g. 04:15 PM)"
                            value={bookingTime}
                            onChange={(e) => setBookingTime(e.target.value)}
                            style={{ marginTop: "8px" }}
                            disabled={salon?.is_open === false}
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="back-btn"
                            onClick={() => navigate(`/salons/${salon_id}`)}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={loading || salon?.is_open === false}
                            style={{
                                opacity: salon?.is_open === false ? 0.6 : 1,
                                cursor: salon?.is_open === false ? "not-allowed" : "pointer"
                            }}
                        >
                            {loading
                                ? "Booking..."
                                : salon?.is_open === false
                                ? "🔴 Online Bookings Closed"
                                : "✨ Confirm & Request Appointment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default BookAppointment;
