import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, isCustomer } from "./auth";
import CustomerBottomNav from "./CustomerBottomNav";

function Bookings() {
    const navigate = useNavigate();
    const currentUser = getUser();
    const isCust = isCustomer();

    const [bookings, setBookings] = useState([]);
    const [salonsMap, setSalonsMap] = useState({});
    const [filter, setFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancellingId, setCancellingId] = useState(null);

    const fetchBookingsAndSalons = async () => {
        setLoading(true);
        setError("");

        try {
            // 1. Fetch Bookings
            const bookRes = await fetch("http://127.0.0.1:8000/bookings/");
            if (!bookRes.ok) throw new Error("Failed to fetch bookings");
            const bookingsData = await bookRes.json();

            // 2. Fetch Salons
            const salonRes = await fetch("http://127.0.0.1:8000/salons/");
            const map = {};
            if (salonRes.ok) {
                const salonsData = await salonRes.json();
                salonsData.forEach((s) => {
                    map[s.id] = s;
                });
            }

            setSalonsMap(map);
            setBookings(bookingsData);
        } catch (err) {
            console.error("Error fetching bookings:", err);
            setError("Unable to load appointments from server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookingsAndSalons();
    }, []);

    const handleCancelBooking = async (bookingId) => {
        const confirmCancel = window.confirm(`Are you sure you want to cancel Appointment #${bookingId}?`);
        if (!confirmCancel) return;

        try {
            setCancellingId(bookingId);
            const response = await fetch(`http://127.0.0.1:8000/bookings/${bookingId}/cancel`, {
                method: "PATCH",
            });

            if (response.ok) {
                alert(`Appointment #${bookingId} has been cancelled.`);
                fetchBookingsAndSalons();
            } else {
                const data = await response.json();
                alert(data.detail || "Failed to cancel booking.");
            }
        } catch (err) {
            console.error("Cancel error:", err);
            alert("Error connecting to server.");
        } finally {
            setCancellingId(null);
        }
    };

    // Filter by customer if logged in, and by status
    const displayedBookings = bookings.filter((b) => {
        if (isCust && currentUser?.user_id && filter !== "ALL_USERS") {
            if (b.customer_id !== currentUser.user_id) return false;
        }

        if (filter === "ALL" || filter === "ALL_USERS") return true;
        return (b.status || "").toUpperCase() === filter;
    });

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

    return (
        <div className="salons-page customer-page-with-bottom-nav">
            <div className="page-header salons-header">
                <div>
                    <h1>Salon Booking Platform</h1>
                    <h2>📅 {isCust ? "My Appointments" : "All Customer Bookings"}</h2>
                </div>
                <div className="header-actions">
                    <button className="nav-btn" onClick={() => navigate("/")}>
                        🏠 Dashboard
                    </button>
                    <button className="nav-btn primary" onClick={() => navigate("/salons")}>
                        + Book New Appointment
                    </button>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="filter-tabs" style={{ maxWidth: "1000px", margin: "0 auto 25px auto" }}>
                {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((f) => (
                    <button
                        key={f}
                        className={`filter-tab ${filter === f ? "active" : ""}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === "ALL" ? (isCust ? "My Bookings" : "All Bookings") : f}
                    </button>
                ))}
            </div>

            {loading && (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading your appointments...</p>
                </div>
            )}
            {error && <div className="alert error">⚠️ {error}</div>}

            {!loading && displayedBookings.length === 0 && (
                <div className="empty-state">
                    <span className="empty-icon">📅</span>
                    <h3>No appointments found</h3>
                    <p>You don't have any appointments matching this filter.</p>
                    <button className="card-btn" onClick={() => navigate("/salons")} style={{ maxWidth: "220px", marginTop: "15px" }}>
                        Explore Salons & Book Now
                    </button>
                </div>
            )}

            <div className="booking-grid">
                {displayedBookings.map((booking) => {
                    const salon = salonsMap[booking.salon_id];
                    return (
                        <div key={booking.id} className="booking-card-item">
                            <div className="booking-card-top">
                                <span className="booking-id-tag">Appointment #{booking.id}</span>
                                <span className={getStatusClass(booking.status)}>
                                    {booking.status || "PENDING"}
                                </span>
                            </div>

                            <div className="booking-salon-info">
                                <h3 className="booking-salon-name">
                                    💈 {salon ? salon.name : `Salon #${booking.salon_id}`}
                                </h3>
                                {salon && (
                                    <p className="booking-salon-address">
                                        📍 {salon.address}, {salon.city}
                                    </p>
                                )}
                                <p><strong>✂️ Service:</strong> {booking.service}</p>
                                <p><strong>💈 Stylist:</strong> <span style={{ color: "#c084fc", fontWeight: "700" }}>{booking.staff_name || "Any Stylist"}</span></p>
                                <p><strong>📅 Date:</strong> {booking.booking_date}</p>
                                <p><strong>⏰ Time:</strong> {booking.booking_time}</p>
                                {booking.price > 0 && (
                                    <p><strong>💰 Total Price:</strong> <span style={{ color: "#34d399", fontWeight: "800" }}>₹{booking.price}</span></p>
                                )}
                            </div>

                            <div className="booking-card-actions">
                                {booking.status === "COMPLETED" ? (
                                    <button
                                        className="details-btn"
                                        style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", borderColor: "rgba(251,191,36,0.3)" }}
                                        onClick={() => navigate(`/salons/${booking.salon_id}`)}
                                    >
                                        ⭐ Rate & Review
                                    </button>
                                ) : booking.status !== "CANCELLED" ? (
                                    <button
                                        className="delete-btn"
                                        disabled={cancellingId === booking.id}
                                        onClick={() => handleCancelBooking(booking.id)}
                                    >
                                        {cancellingId === booking.id ? "Cancelling..." : "✕ Cancel Slot"}
                                    </button>
                                ) : null}

                                <button
                                    className="details-btn"
                                    onClick={() => navigate(`/bookings/${booking.id}`)}
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <CustomerBottomNav />
        </div>
    );
}

export default Bookings;
