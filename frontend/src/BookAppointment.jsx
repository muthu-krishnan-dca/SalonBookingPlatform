import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getUser } from "./auth";

const POPULAR_SLOTS = [
    "09:30 AM",
    "10:30 AM",
    "11:30 AM",
    "01:00 PM",
    "02:30 PM",
    "04:00 PM",
    "05:30 PM",
    "07:00 PM",
    "08:00 PM"
];

function BookAppointment() {
    const { salon_id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const currentUser = getUser();

    const queryParams = new URLSearchParams(location.search);
    const initialServiceId = queryParams.get("service_id") || "";
    const initialServiceName = queryParams.get("service") || "";
    const initialStaffId = queryParams.get("staff_id") || "";

    const [salon, setSalon] = useState(null);
    const [services, setServices] = useState([]);
    const [staffList, setStaffList] = useState([]);

    const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId);
    const [selectedStaffId, setSelectedStaffId] = useState(initialStaffId);
    const [bookingDate, setBookingDate] = useState("");
    const [bookingTime, setBookingTime] = useState("");

    const [availabilityStatus, setAvailabilityStatus] = useState(null); // { available: bool, reason: str }
    const [checkingAvailability, setCheckingAvailability] = useState(false);

    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (salon_id) {
            // 1. Fetch Salon
            fetch(`http://127.0.0.1:8000/salons/${salon_id}`)
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => setSalon(data))
                .catch((err) => console.error(err));

            // 2. Fetch Services
            fetch(`http://127.0.0.1:8000/services/salon/${salon_id}`)
                .then((res) => (res.ok ? res.json() : []))
                .then((data) => {
                    setServices(data);
                    if (!selectedServiceId && data.length > 0) {
                        const match = initialServiceName
                            ? data.find((s) => s.name.toLowerCase() === initialServiceName.toLowerCase())
                            : data[0];
                        setSelectedServiceId(match ? String(match.id) : String(data[0].id));
                    }
                });

            // 3. Fetch Staff
            fetch(`http://127.0.0.1:8000/staff/salon/${salon_id}`)
                .then((res) => (res.ok ? res.json() : []))
                .then((data) => {
                    setStaffList(data);
                    if (initialStaffId) {
                        setSelectedStaffId(String(initialStaffId));
                    }
                });
        }
    }, [salon_id]);

    // Live check availability whenever stylist, date, or time changes
    useEffect(() => {
        if (selectedStaffId && bookingDate && bookingTime) {
            setCheckingAvailability(true);
            fetch(`http://127.0.0.1:8000/staff/${selectedStaffId}/check-availability?date=${bookingDate}&time=${encodeURIComponent(bookingTime)}`)
                .then((res) => res.json())
                .then((data) => {
                    setAvailabilityStatus(data);
                })
                .catch((err) => console.error("Availability check err:", err))
                .finally(() => setCheckingAvailability(false));
        } else {
            setAvailabilityStatus(null);
        }
    }, [selectedStaffId, bookingDate, bookingTime]);

    const activeService = services.find((s) => String(s.id) === String(selectedServiceId)) || services[0];
    const activeStaff = staffList.find((st) => String(st.id) === String(selectedStaffId));

    const handleBooking = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        if (!currentUser || !currentUser.user_id) {
            setErrorMessage("Please log in to book your appointment.");
            navigate("/login");
            return;
        }

        if (!bookingDate || !bookingTime) {
            setErrorMessage("Please select an appointment date and time slot.");
            return;
        }

        if (availabilityStatus && !availabilityStatus.available) {
            setErrorMessage(`⚠️ Slot unavailable: ${availabilityStatus.reason}`);
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
                    customer_id: currentUser.user_id,
                    salon_id: parseInt(salon_id, 10),
                    service_id: activeService ? activeService.id : null,
                    staff_id: activeStaff ? activeStaff.id : null,
                    booking_date: bookingDate,
                    booking_time: bookingTime,
                    service: activeService ? activeService.name : "Hair Styling",
                    price: activeService ? activeService.price : 0.0,
                    status: "PENDING",
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage("🎉 Appointment requested successfully! The salon owner will confirm your slot.");
                alert(`Appointment for "${activeService?.name || 'Styling'}" ${activeStaff ? `with ${activeStaff.name}` : ''} scheduled successfully!`);
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
                    <h1>Salon Booking Platform</h1>
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

            <div className="booking-card" style={{ maxWidth: "580px", margin: "0 auto" }}>
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
                    </div>
                )}

                {salon && salon.is_open === false && (
                    <div className="alert error" style={{ margin: "14px 0" }}>
                        ⛔ <strong>Online Bookings Currently Paused:</strong> This salon owner has temporarily turned off online appointments for today.
                    </div>
                )}

                {successMessage && <div className="alert success">{successMessage}</div>}
                {errorMessage && <div className="alert error">⚠️ {errorMessage}</div>}

                <form onSubmit={handleBooking} className="booking-form">
                    {/* 1. Customer Info */}
                    <div className="form-group">
                        <label>Booking Customer:</label>
                        <input
                            type="text"
                            value={currentUser?.name ? `${currentUser.name} (${currentUser.email})` : "Guest Customer"}
                            disabled
                            style={{ opacity: 0.85, cursor: "not-allowed", background: "rgba(255, 255, 255, 0.05)" }}
                        />
                    </div>

                    {/* 2. Select Service */}
                    <div className="form-group">
                        <label>Select Treatment / Service *</label>
                        <select
                            value={selectedServiceId}
                            onChange={(e) => setSelectedServiceId(e.target.value)}
                            disabled={salon?.is_open === false}
                            required
                        >
                            {services.map((svc) => (
                                <option key={svc.id} value={svc.id}>
                                    ✨ {svc.name} — ₹{svc.price} ({svc.duration_mins || 30} mins)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Service Summary Highlight */}
                    {activeService && (
                        <div style={{
                            background: "rgba(124, 58, 237, 0.15)",
                            border: "1px solid rgba(168, 85, 247, 0.3)",
                            borderRadius: "14px",
                            padding: "10px 16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "13px"
                        }}>
                            <span style={{ color: "#e2e8f0" }}>⏱️ Duration: <strong>{activeService.duration_mins || 30} mins</strong></span>
                            <span style={{ color: "#34d399", fontWeight: "800", fontSize: "16px" }}>₹{activeService.price}</span>
                        </div>
                    )}

                    {/* 3. Select Stylist */}
                    <div className="form-group" style={{ marginTop: "14px" }}>
                        <label>Choose Preferred Stylist / Staff</label>
                        <select
                            value={selectedStaffId}
                            onChange={(e) => setSelectedStaffId(e.target.value)}
                            disabled={salon?.is_open === false}
                        >
                            <option value="">⚡ Any Available Stylist</option>
                            {staffList.map((st) => (
                                <option key={st.id} value={st.id}>
                                    💈 {st.name} — {st.specialization} ({st.is_available ? "Available" : "Off-Duty"})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 4. Select Date */}
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

                    {/* 5. Select Time Slot */}
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
                            placeholder="Or enter custom time (e.g. 03:15 PM)"
                            value={bookingTime}
                            onChange={(e) => setBookingTime(e.target.value)}
                            style={{ marginTop: "8px" }}
                            disabled={salon?.is_open === false}
                            required
                        />
                    </div>

                    {/* Availability Guard Notice */}
                    {checkingAvailability && (
                        <div style={{ color: "#38bdf8", fontSize: "12px", padding: "4px 0" }}>
                            🔍 Checking stylist schedule & availability...
                        </div>
                    )}

                    {availabilityStatus && (
                        <div style={{
                            padding: "8px 14px",
                            borderRadius: "10px",
                            fontSize: "12.5px",
                            fontWeight: "700",
                            background: availabilityStatus.available ? "rgba(52,211,153,0.15)" : "rgba(239,68,68,0.15)",
                            color: availabilityStatus.available ? "#34d399" : "#f87171",
                            border: availabilityStatus.available ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(239,68,68,0.3)"
                        }}>
                            {availabilityStatus.available ? "✅ Stylist & time slot are available!" : `⛔ ${availabilityStatus.reason}`}
                        </div>
                    )}

                    <div className="form-actions" style={{ marginTop: "20px" }}>
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
                            disabled={loading || salon?.is_open === false || (availabilityStatus && !availabilityStatus.available)}
                            style={{
                                opacity: salon?.is_open === false || (availabilityStatus && !availabilityStatus.available) ? 0.6 : 1,
                                cursor: salon?.is_open === false || (availabilityStatus && !availabilityStatus.available) ? "not-allowed" : "pointer"
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
