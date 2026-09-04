import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "./auth";
import OwnerNavbar from "./OwnerNavbar";

function OwnerDashboard() {
    const navigate = useNavigate();
    const currentUser = getUser();

    const [salon, setSalon] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [customersMap, setCustomersMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(null);

    const loadDashboardData = async () => {
        if (!currentUser || !currentUser.user_id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            // 1. Fetch Owner's Salons / Branches
            const salonRes = await fetch(`http://127.0.0.1:8000/salons/owner/${currentUser.user_id}/all`);
            if (salonRes.ok) {
                const salonList = await salonRes.json();
                setSalon(salonList.length > 0 ? salonList[0] : null);

                // 2. Fetch Bookings for this Owner's Branches
                const bookingsRes = await fetch(`http://127.0.0.1:8000/bookings/owner/${currentUser.user_id}`);
                if (bookingsRes.ok) {
                    const bookingsData = await bookingsRes.json();
                    setBookings(bookingsData);
                }
            } else {
                setSalon(null);
            }

            // 3. Fetch Customers lookup map
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
            console.error("Dashboard error:", err);
            setError("Server connection error while loading dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const handleStatusUpdate = async (bookingId, newStatus) => {
        setActionLoading(bookingId);
        try {
            const res = await fetch(`http://127.0.0.1:8000/bookings/${bookingId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                setBookings((prev) =>
                    prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
                );
            } else {
                alert("Failed to update status.");
            }
        } catch (err) {
            console.error("Status update error:", err);
            alert("Error communicating with server.");
        } finally {
            setActionLoading(null);
        }
    };

    // Calculate Summary Stats
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter((b) => (b.status || "").toUpperCase() === "PENDING").length;
    const confirmedBookings = bookings.filter((b) => (b.status || "").toUpperCase() === "CONFIRMED").length;
    const completedBookings = bookings.filter((b) => (b.status || "").toUpperCase() === "COMPLETED").length;

    const recentBookings = bookings.slice(0, 5);

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

    const handleQuickStatusToggle = async () => {
        if (!salon) return;
        const newStatus = !salon.is_open;
        try {
            const res = await fetch(`http://127.0.0.1:8000/salons/${salon.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_open: newStatus })
            });
            if (res.ok) {
                const updated = await res.json();
                setSalon(updated);
            }
        } catch (err) {
            console.error("Status toggle error:", err);
        }
    };

    return (
        <div className="owner-layout">
            <OwnerNavbar />

            <main className="owner-main-content">
                {/* Welcome Header */}
                <div className="owner-welcome-banner">
                    <div>
                        <h1>Welcome, {currentUser?.name} 👋</h1>
                        <p>Here is what's happening at your salon today.</p>
                    </div>
                    {salon && (
                        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                            <button
                                onClick={handleQuickStatusToggle}
                                style={{
                                    padding: "6px 14px",
                                    borderRadius: "14px",
                                    border: salon.is_open ? "1px solid #10b981" : "1px solid #ef4444",
                                    background: salon.is_open ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                    color: salon.is_open ? "#34d399" : "#f87171",
                                    fontWeight: "800",
                                    fontSize: "12.5px",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px"
                                }}
                                title="Click to quickly switch Online/Offline mode"
                            >
                                <span>{salon.is_open ? "🟢 Online (Bookings Active)" : "🔴 Closed (Bookings Paused)"}</span>
                            </button>

                            <div className="owner-active-salon-badge">
                                <span>💈 {salon.name}</span>
                                <small>📍 {salon.city}</small>
                            </div>
                        </div>
                    )}
                </div>

                {error && <div className="alert error">⚠️ {error}</div>}

                {/* If Owner has not set up a salon yet */}
                {!loading && !salon && (
                    <div className="owner-setup-alert">
                        <div className="setup-alert-content">
                            <h3>💈 Set Up Your Salon Profile</h3>
                            <p>You haven't registered your salon branch yet. Register it now so customers can discover you and book appointments.</p>
                        </div>
                        <button className="submit-btn" onClick={() => navigate("/owner/salon")}>
                            ➕ Register My Salon
                        </button>
                    </div>
                )}

                {/* KPI Summary Stat Cards */}
                <div className="owner-kpi-grid">
                    <div className="owner-kpi-card total">
                        <div className="kpi-icon">📊</div>
                        <div className="kpi-info">
                            <span className="kpi-label">Total Bookings</span>
                            <span className="kpi-value">{totalBookings}</span>
                        </div>
                    </div>

                    <div className="owner-kpi-card pending">
                        <div className="kpi-icon">⏳</div>
                        <div className="kpi-info">
                            <span className="kpi-label">Pending Requests</span>
                            <span className="kpi-value">{pendingBookings}</span>
                        </div>
                    </div>

                    <div className="owner-kpi-card confirmed">
                        <div className="kpi-icon">✅</div>
                        <div className="kpi-info">
                            <span className="kpi-label">Confirmed Bookings</span>
                            <span className="kpi-value">{confirmedBookings}</span>
                        </div>
                    </div>

                    <div className="owner-kpi-card completed">
                        <div className="kpi-icon">🎉</div>
                        <div className="kpi-info">
                            <span className="kpi-label">Completed Sessions</span>
                            <span className="kpi-value">{completedBookings}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Navigation Cards */}
                <div className="owner-shortcuts-grid">
                    <div className="owner-shortcut-card" onClick={() => navigate("/owner/salon")}>
                        <div className="shortcut-icon">💇</div>
                        <h3>My Salon</h3>
                        <p>Manage salon name, address, services, and contact info.</p>
                        <span className="shortcut-link">Manage Salon →</span>
                    </div>

                    <div className="owner-shortcut-card" onClick={() => navigate("/owner/bookings")}>
                        <div className="shortcut-icon">📅</div>
                        <h3>Booking Requests</h3>
                        <p>Accept, confirm, complete, or reject customer appointments.</p>
                        <span className="shortcut-link">View All ({pendingBookings} pending) →</span>
                    </div>

                    <div className="owner-shortcut-card" onClick={() => navigate("/owner/customers")}>
                        <div className="shortcut-icon">👥</div>
                        <h3>Salon Customers</h3>
                        <p>See all customers who have booked at your salon.</p>
                        <span className="shortcut-link">View Customers →</span>
                    </div>

                    <div className="owner-shortcut-card" onClick={() => navigate("/owner/profile")}>
                        <div className="shortcut-icon">👤</div>
                        <h3>My Profile</h3>
                        <p>Update your personal account credentials and details.</p>
                        <span className="shortcut-link">View Profile →</span>
                    </div>
                </div>

                {/* Recent Bookings Section */}
                <div className="owner-recent-section">
                    <div className="section-header">
                        <h2>📋 Recent Bookings</h2>
                        <button className="nav-btn" onClick={() => navigate("/owner/bookings")}>
                            View All Bookings →
                        </button>
                    </div>

                    {loading ? (
                        <p>Loading recent bookings...</p>
                    ) : recentBookings.length === 0 ? (
                        <div className="empty-state">
                            <p>No appointments booked yet. Once customers book, they will appear here!</p>
                        </div>
                    ) : (
                        <div className="owner-table-wrapper">
                            <table className="owner-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Customer</th>
                                        <th>Service</th>
                                        <th>Stylist</th>
                                        <th>Date & Time</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentBookings.map((b) => {
                                        const customer = customersMap[b.customer_id];
                                        return (
                                            <tr key={b.id}>
                                                <td><strong>#{b.id}</strong></td>
                                                <td>
                                                    <div className="table-cust-cell">
                                                        <span className="table-cust-name">
                                                            {customer ? customer.name : `Customer #${b.customer_id}`}
                                                        </span>
                                                        {customer && customer.phone && (
                                                            <small className="table-cust-phone">📞 {customer.phone}</small>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>{b.service}</td>
                                                <td>
                                                    <span style={{ color: "#c084fc", fontWeight: "700", fontSize: "12.5px" }}>
                                                        💈 {b.staff_name || "Any Stylist"}
                                                    </span>
                                                </td>
                                                <td>{b.booking_date} at {b.booking_time}</td>
                                                <td>
                                                    <span className={getStatusClass(b.status)}>
                                                        {b.status || "PENDING"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="table-action-btns">
                                                        {b.status === "PENDING" && (
                                                            <>
                                                                <button
                                                                    className="table-btn-confirm"
                                                                    disabled={actionLoading === b.id}
                                                                    onClick={() => handleStatusUpdate(b.id, "CONFIRMED")}
                                                                    title="Confirm Booking"
                                                                >
                                                                    ✅ Confirm
                                                                </button>
                                                                <button
                                                                    className="table-btn-cancel"
                                                                    disabled={actionLoading === b.id}
                                                                    onClick={() => handleStatusUpdate(b.id, "CANCELLED")}
                                                                    title="Cancel Booking"
                                                                >
                                                                    ❌ Cancel
                                                                </button>
                                                            </>
                                                        )}

                                                        {b.status === "CONFIRMED" && (
                                                            <button
                                                                className="table-btn-complete"
                                                                disabled={actionLoading === b.id}
                                                                onClick={() => handleStatusUpdate(b.id, "COMPLETED")}
                                                                title="Mark Completed"
                                                            >
                                                                🎉 Complete
                                                            </button>
                                                        )}

                                                        {(b.status === "COMPLETED" || b.status === "CANCELLED") && (
                                                            <span className="table-status-done">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default OwnerDashboard;
