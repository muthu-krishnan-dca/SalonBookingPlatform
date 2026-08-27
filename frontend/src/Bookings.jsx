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

    const fetchBookingsAndSalons = async () => {
        setLoading(true);
        setError("");

        try {
            // 1. Fetch Bookings
            const bookRes = await fetch("http://127.0.0.1:8000/bookings/");
            if (!bookRes.ok) throw new Error("Failed to fetch bookings");
            const bookingsData = await bookRes.json();

            // 2. Fetch Salons to map Salon ID -> Salon Details
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

    const handleDelete = async (bookingId) => {
        const confirmDelete = window.confirm(`Are you sure you want to cancel/delete Booking #${bookingId}?`);
        if (!confirmDelete) return;

        try {
            const response = await fetch(`http://127.0.0.1:8000/bookings/${bookingId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                alert(`Booking #${bookingId} deleted successfully!`);
                setBookings((prev) => prev.filter((b) => b.id !== bookingId));
            } else {
                const data = await response.json();
                alert(data.detail || "Failed to delete booking.");
            }
        } catch (err) {
            console.error("Delete error:", err);
            alert("Error connecting to server to delete booking.");
        }
    };

    // Filter by customer if logged in, and by status
    const displayedBookings = bookings.filter((b) => {
        // If customer is logged in, show their bookings by default unless viewing all
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
                    <h1>Salon Booking System</h1>
                    <h2>📅 {isCust ? "My Appointments" : "All Customer Bookings"}</h2>
                </div>
                <div className="header-actions">
                    <button className="nav-btn" onClick={() => navigate("/")}>
                        🏠 Dashboard
                    </button>
                    <button className="nav-btn primary" onClick={() => navigate("/salons")}>
                        + Book New
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
                {isCust && (
                    <button
                        className={`filter-tab ${filter === "ONLY_MINE" ? "active" : ""}`}
                        onClick={() => setFilter("ONLY_MINE")}
                        style={{ borderColor: "#a855f7", color: "#c084fc" }}
                    >
                        👤 My Bookings Only
                    </button>
                )}
            </div>

            {loading && <p style={{ textAlign: "center", color: "#cbd5e1" }}>Loading appointments...</p>}
            {error && <div className="alert error">⚠️ {error}</div>}

            {!loading && displayedBookings.length === 0 && (
                <div className="empty-state">
                    <h3>No appointments found</h3>
                    <p>There are no bookings matching the selected status.</p>
                    <button className="card-btn" onClick={() => navigate("/salons")} style={{ maxWidth: "200px", marginTop: "15px" }}>
                        Explore Salons & Book
                    </button>
                </div>
            )}

            <div className="booking-grid">
                {displayedBookings.map((booking) => {
                    const salon = salonsMap[booking.salon_id];
                    return (
                        <div key={booking.id} className="booking-card-item">
                            <div className="booking-card-top">
                                <span className="booking-id-tag">Booking #{booking.id}</span>
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
                                <p><strong>📅 Date:</strong> {booking.booking_date}</p>
                                <p><strong>⏰ Time:</strong> {booking.booking_time}</p>
                            </div>

                            <div className="booking-card-actions">
                                <button
                                    className="details-btn"
                                    onClick={() => navigate(`/bookings/${booking.id}`)}
                                >
                                    View Details & Edit
                                </button>
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDelete(booking.id)}
                                >
                                    Cancel
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
