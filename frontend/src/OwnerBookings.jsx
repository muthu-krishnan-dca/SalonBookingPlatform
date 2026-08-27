import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "./auth";
import OwnerNavbar from "./OwnerNavbar";

function OwnerBookings() {
    const navigate = useNavigate();
    const currentUser = getUser();

    const [salon, setSalon] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [customersMap, setCustomersMap] = useState({});
    const [filter, setFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(null);

    const loadSalonAndBookings = async () => {
        if (!currentUser || !currentUser.user_id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            // 1. Fetch owner's salons / branches
            const salonRes = await fetch(`http://127.0.0.1:8000/salons/owner/${currentUser.user_id}/all`);
            if (salonRes.ok) {
                const salonList = await salonRes.json();
                setSalon(salonList.length > 0 ? salonList[0] : null);

                // 2. Fetch bookings for all owner branches
                const bookingsRes = await fetch(`http://127.0.0.1:8000/bookings/owner/${currentUser.user_id}`);
                if (bookingsRes.ok) {
                    const bookingsData = await bookingsRes.json();
                    setBookings(bookingsData);
                }
            } else {
                setSalon(null);
            }

            // 3. Fetch customer names for quick lookup
            const custRes = await fetch("http://127.0.0.1:8000/customers/");
            if (custRes.ok) {
                const custList = await custRes.json();
                const map = {};
                custList.forEach((c) => {
                    map[c.id] = c;
                });
                setCustomersMap(map);
            }
        } catch (err) {
            console.error("Owner bookings error:", err);
            setError("Server error while loading booking requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSalonAndBookings();
    }, []);

    const handleStatusUpdate = async (bookingId, newStatus) => {
        setActionLoading(bookingId);
        try {
            const res = await fetch(`http://127.0.0.1:8000/bookings/${bookingId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                setBookings((prev) =>
                    prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
                );
            } else {
                alert("Failed to update booking status.");
            }
        } catch (err) {
            console.error("Status update error:", err);
            alert("Error communicating with server.");
        } finally {
            setActionLoading(null);
        }
    };

    const filteredBookings = bookings.filter((b) => {
        if (filter === "ALL") return true;
        return (b.status || "").toUpperCase() === filter;
    });

    const getStatusClass = (status) => {
        switch ((status || "").toLowerCase()) {
            case "confirmed":
                return "badge confirmed";
            case "completed":
                return "badge completed";
            case "cancelled":
                return "badge cancelled";
            default:
                return "badge pending";
        }
    };

    return (
        <div className="owner-layout">
            <OwnerNavbar />

            <main className="owner-main-content">
                <div className="owner-page-header">
                    <div>
                        <h1>📅 Booking Requests</h1>
                        <p>
                            Manage customer appointments for {salon ? <strong>{salon.name}</strong> : "your salon"}.
                        </p>
                    </div>
                </div>

                {loading && <h3>Loading bookings...</h3>}
                {error && <div className="alert error">⚠️ {error}</div>}

                {!loading && !salon && (
                    <div className="empty-state">
                        <p>You haven't set up a salon yet.</p>
                        <button className="submit-btn" onClick={() => navigate("/owner/salon")}>
                            ➕ Register Your Salon First
                        </button>
                    </div>
                )}

                {!loading && salon && (
                    <>
                        {/* Status Filter Tabs */}
                        <div className="filter-tabs">
                            {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((f) => (
                                <button
                                    key={f}
                                    className={`filter-tab ${filter === f ? "active" : ""}`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f === "ALL" ? "All Bookings" : f} (
                                    {f === "ALL"
                                        ? bookings.length
                                        : bookings.filter((b) => (b.status || "").toUpperCase() === f).length}
                                    )
                                </button>
                            ))}
                        </div>

                        {filteredBookings.length === 0 ? (
                            <div className="empty-state">
                                <p>No {filter !== "ALL" ? filter.toLowerCase() : ""} bookings found for this salon.</p>
                            </div>
                        ) : (
                            <div className="booking-grid">
                                {filteredBookings.map((b) => {
                                    const customer = customersMap[b.customer_id];
                                    return (
                                        <div className="booking-card-item owner-booking-card" key={b.id}>
                                            <div className="booking-card-top">
                                                <span className="booking-id">Booking #{b.id}</span>
                                                <span className={getStatusClass(b.status)}>
                                                    {b.status || "PENDING"}
                                                </span>
                                            </div>

                                            <div className="booking-card-body">
                                                <p>
                                                    👤 <strong>Customer:</strong>{" "}
                                                    {customer ? customer.name : `Customer #${b.customer_id}`}
                                                </p>
                                                {customer && customer.email && (
                                                    <p>📧 <strong>Email:</strong> {customer.email}</p>
                                                )}
                                                {customer && customer.phone && (
                                                    <p>📞 <strong>Phone:</strong> {customer.phone}</p>
                                                )}
                                                <p>✂️ <strong>Service:</strong> {b.service}</p>
                                                <p>📅 <strong>Date:</strong> {b.booking_date}</p>
                                                <p>⏰ <strong>Time:</strong> {b.booking_time}</p>
                                            </div>

                                            <div className="owner-booking-actions">
                                                {b.status === "PENDING" && (
                                                    <>
                                                        <button
                                                            className="confirm-action-btn"
                                                            disabled={actionLoading === b.id}
                                                            onClick={() => handleStatusUpdate(b.id, "CONFIRMED")}
                                                        >
                                                            ✅ Confirm
                                                        </button>
                                                        <button
                                                            className="cancel-action-btn"
                                                            disabled={actionLoading === b.id}
                                                            onClick={() => handleStatusUpdate(b.id, "CANCELLED")}
                                                        >
                                                            ❌ Reject
                                                        </button>
                                                    </>
                                                )}

                                                {b.status === "CONFIRMED" && (
                                                    <>
                                                        <button
                                                            className="complete-action-btn"
                                                            disabled={actionLoading === b.id}
                                                            onClick={() => handleStatusUpdate(b.id, "COMPLETED")}
                                                        >
                                                            🎉 Mark Completed
                                                        </button>
                                                        <button
                                                            className="cancel-action-btn"
                                                            disabled={actionLoading === b.id}
                                                            onClick={() => handleStatusUpdate(b.id, "CANCELLED")}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}

                                                {(b.status === "COMPLETED" || b.status === "CANCELLED") && (
                                                    <div className="status-note">
                                                        This appointment is {b.status.toLowerCase()}.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default OwnerBookings;
