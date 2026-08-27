import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, logout } from "./auth";
import CustomerBottomNav from "./CustomerBottomNav";

function CustomerProfile() {
    const navigate = useNavigate();
    const currentUser = getUser();

    const [userStats, setUserStats] = useState({ totalBookings: 0, activeBookings: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookingsCount = async () => {
            if (!currentUser || !currentUser.user_id) {
                setLoading(false);
                return;
            }
            try {
                const res = await fetch(`http://127.0.0.1:8000/bookings/customer/${currentUser.user_id}`);
                if (res.ok) {
                    const bookings = await res.json();
                    const active = bookings.filter((b) => b.status === "PENDING" || b.status === "CONFIRMED").length;
                    setUserStats({ totalBookings: bookings.length, activeBookings: active });
                }
            } catch (err) {
                console.error("Fetch bookings count error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBookingsCount();
    }, []);

    return (
        <div className="dashboard customer-page-with-bottom-nav">
            {/* Header */}
            <div className="dashboard-hero" style={{ marginBottom: "25px" }}>
                <h1>👤 My Profile</h1>
                <h2>Customer Account Details</h2>
                <p>Manage your account info, track appointments, and security settings.</p>
            </div>

            {/* Profile Card */}
            <div className="salon-card owner-profile-card" style={{ maxWidth: "550px", width: "100%", margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                    <div className="customer-avatar large" style={{ margin: "0 auto 14px auto" }}>
                        {(currentUser?.name || "U")[0].toUpperCase()}
                    </div>
                    <h3 style={{ fontSize: "24px", color: "#ffffff", margin: "0 0 6px 0" }}>
                        {currentUser?.name || "Customer User"}
                    </h3>
                    <span className="user-role-badge customer" style={{ fontSize: "12px", padding: "4px 14px" }}>
                        ✨ Valued Customer
                    </span>
                </div>

                {/* Stats Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                    <div className="owner-kpi-card" style={{ padding: "14px", flexDirection: "column", textAlign: "center" }}>
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>Total Bookings</span>
                        <strong style={{ fontSize: "24px", color: "#c084fc" }}>
                            {loading ? "..." : userStats.totalBookings}
                        </strong>
                    </div>
                    <div className="owner-kpi-card" style={{ padding: "14px", flexDirection: "column", textAlign: "center" }}>
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>Active Bookings</span>
                        <strong style={{ fontSize: "24px", color: "#34d399" }}>
                            {loading ? "..." : userStats.activeBookings}
                        </strong>
                    </div>
                </div>

                {/* Details List */}
                <div className="owner-details-list">
                    <div className="detail-row">
                        <span className="detail-label">📧 Email Address:</span>
                        <span className="detail-value">{currentUser?.email || "Not Provided"}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">🆔 Customer ID:</span>
                        <span className="detail-value">#{currentUser?.user_id || "N/A"}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">🛡️ Role:</span>
                        <span className="detail-value">Customer</span>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "25px" }}>
                    <button
                        className="card-btn"
                        onClick={() => navigate("/bookings")}
                    >
                        📅 View My Appointments →
                    </button>
                    <button
                        className="logout-btn"
                        style={{ width: "100%", padding: "12px", fontSize: "14px" }}
                        onClick={logout}
                    >
                        🚪 Logout from Account
                    </button>
                </div>
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <CustomerBottomNav />
        </div>
    );
}

export default CustomerProfile;
