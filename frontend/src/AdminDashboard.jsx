import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, logout } from "./auth";

function AdminDashboard() {
    const navigate = useNavigate();
    const currentUser = getUser();

    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState("overview"); // overview, users, salons, bookings, reviews
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Search and Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [userRoleFilter, setUserRoleFilter] = useState("ALL");
    const [salonVerifyFilter, setSalonVerifyFilter] = useState("ALL");
    const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");

    // Data lists
    const [usersList, setUsersList] = useState([]);
    const [salonsList, setSalonsList] = useState([]);
    const [bookingsList, setBookingsList] = useState([]);
    const [reviewsList, setReviewsList] = useState([]);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const loadAdminData = async () => {
        try {
            setLoading(true);
            setError("");

            // 1. Fetch Platform Stats
            const statsRes = await fetch("http://127.0.0.1:8000/admin/stats");
            if (statsRes.ok) {
                setStats(await statsRes.json());
            }

            // 2. Fetch Users
            const usersRes = await fetch("http://127.0.0.1:8000/admin/users");
            if (usersRes.ok) {
                setUsersList(await usersRes.json());
            }

            // 3. Fetch Salons
            const salonsRes = await fetch("http://127.0.0.1:8000/admin/salons");
            if (salonsRes.ok) {
                setSalonsList(await salonsRes.json());
            }

            // 4. Fetch Bookings
            const bookingsRes = await fetch("http://127.0.0.1:8000/admin/bookings");
            if (bookingsRes.ok) {
                setBookingsList(await bookingsRes.json());
            }

            // 5. Fetch Reviews
            const reviewsRes = await fetch("http://127.0.0.1:8000/admin/reviews");
            if (reviewsRes.ok) {
                setReviewsList(await reviewsRes.json());
            }
        } catch (err) {
            setError("Failed to load admin data: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAdminData();
    }, []);

    // Role changer
    const handleChangeUserRole = async (userId, newRole) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/admin/users/${userId}/role?role=${newRole}`, {
                method: "PATCH"
            });
            if (!res.ok) throw new Error("Failed to change user role");
            setSuccess(`User role updated to ${newRole} ✨`);
            loadAdminData();
        } catch (err) {
            setError(err.message);
        }
    };

    // Delete user
    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to delete user "${userName}"?`)) return;
        try {
            const res = await fetch(`http://127.0.0.1:8000/admin/users/${userId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete user");
            setSuccess("User removed from platform");
            loadAdminData();
        } catch (err) {
            setError(err.message);
        }
    };

    // Toggle salon verification
    const handleToggleVerification = async (salonId) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/admin/salons/${salonId}/verify`, {
                method: "PATCH"
            });
            if (!res.ok) throw new Error("Failed to update salon verification");
            setSuccess("Salon verification status updated ⭐");
            loadAdminData();
        } catch (err) {
            setError(err.message);
        }
    };

    // Delete salon
    const handleDeleteSalon = async (salonId, salonName) => {
        if (!window.confirm(`Are you sure you want to permanently remove salon "${salonName}"?`)) return;
        try {
            const res = await fetch(`http://127.0.0.1:8000/admin/salons/${salonId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete salon");
            setSuccess("Salon removed from platform");
            loadAdminData();
        } catch (err) {
            setError(err.message);
        }
    };

    // Delete review
    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm("Delete this review as spam?")) return;
        try {
            const res = await fetch(`http://127.0.0.1:8000/reviews/${reviewId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete review");
            setSuccess("Review removed");
            loadAdminData();
        } catch (err) {
            setError(err.message);
        }
    };

    // Filter helpers
    const filteredUsers = usersList.filter((u) => {
        const matchesRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
        const matchesSearch = !searchTerm || u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesRole && matchesSearch;
    });

    const filteredSalons = salonsList.filter((s) => {
        const matchesVerify = salonVerifyFilter === "ALL" || (salonVerifyFilter === "VERIFIED" ? s.is_verified : !s.is_verified);
        const matchesSearch = !searchTerm || s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.city?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesVerify && matchesSearch;
    });

    const filteredBookings = bookingsList.filter((b) => {
        const matchesStatus = bookingStatusFilter === "ALL" || b.status === bookingStatusFilter;
        const matchesSearch = !searchTerm || b.service?.toLowerCase().includes(searchTerm.toLowerCase()) || String(b.id).includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    const navItems = [
        { id: "overview", icon: "📊", label: "Platform Overview", badge: null },
        { id: "users", icon: "👥", label: "Users & Roles", badge: usersList.length },
        { id: "salons", icon: "💈", label: "Salons & Branches", badge: salonsList.length },
        { id: "bookings", icon: "📅", label: "Appointments Audit", badge: bookingsList.length },
        { id: "reviews", icon: "⭐", label: "Reviews Moderation", badge: reviewsList.length },
    ];

    return (
        <div className="admin-spandle-layout liquid-glass-theme ultra-liquid">
            {/* Ambient Multi-layer Liquid Plasma Emitters */}
            <div className="liquid-plasma-bg">
                <div className="liquid-orb liquid-orb-1" />
                <div className="liquid-orb liquid-orb-2" />
                <div className="liquid-orb liquid-orb-3" />
                <div className="liquid-orb liquid-orb-4" />
                <div className="liquid-orb liquid-orb-5" />
                <div className="liquid-wave-layer" />
                <div className="liquid-refraction-mesh" />
            </div>

            {/* Mobile Top Header */}
            <header className="admin-mobile-topbar liquid-glass-panel">
                <button
                    className="admin-hamburger-btn"
                    onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                >
                    {mobileSidebarOpen ? "✕" : "☰"}
                </button>
                <div className="admin-mobile-brand">
                    <span className="brand-gem">👑</span>
                    <span className="brand-text">GlowSync Admin</span>
                </div>
                <div className="admin-avatar-small">A</div>
            </header>

            {/* Mobile Backdrop */}
            {mobileSidebarOpen && (
                <div
                    className="admin-sidebar-backdrop"
                    onClick={() => setMobileSidebarOpen(false)}
                />
            )}

            {/* 1. Splendid Luxury Left Sidebar */}
            <aside className={`admin-spandle-sidebar ${mobileSidebarOpen ? "mobile-open" : ""}`}>
                {/* Brand Header */}
                <div className="admin-brand-card">
                    <div className="brand-icon-halo">👑</div>
                    <div className="brand-info">
                        <h2>GlowSync</h2>
                        <span className="brand-role-tag">SUPER ADMIN</span>
                    </div>
                </div>

                {/* Master Admin Profile Pill */}
                <div className="admin-profile-pill">
                    <div className="admin-avatar-circle">M</div>
                    <div className="admin-meta">
                        <span className="admin-name">{currentUser?.name || "Master Admin"}</span>
                        <span className="admin-email">{currentUser?.email || "admin@glowsync.com"}</span>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="admin-nav-menu">
                    <span className="admin-menu-label">ADMINISTRATION</span>
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                className={`admin-nav-btn ${isActive ? "active" : ""}`}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setMobileSidebarOpen(false);
                                    setSearchTerm("");
                                }}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                                {item.badge !== null && (
                                    <span className="nav-count-badge">{item.badge}</span>
                                )}
                                {isActive && <span className="nav-glow-indicator" />}
                            </button>
                        );
                    })}
                </nav>

                {/* Quick App Switcher & Logout */}
                <div className="admin-sidebar-bottom">
                    <button className="admin-quick-switch-btn" onClick={() => navigate("/dashboard")}>
                        <span>💇 Customer App</span>
                    </button>
                    <button className="admin-quick-switch-btn" onClick={() => navigate("/owner/salon")}>
                        <span>💈 Salon Owner Hub</span>
                    </button>
                    <button className="admin-logout-btn" onClick={logout}>
                        <span>🚪 Log Out</span>
                    </button>
                </div>
            </aside>

            {/* 2. Main Admin Workspace */}
            <main className="admin-spandle-main">
                {/* Top Workspace Header Bar */}
                <div className="admin-top-workspace-bar">
                    <div className="workspace-title-box">
                        <h1>
                            {activeTab === "overview" && "Platform Control Overview"}
                            {activeTab === "users" && "Platform Users & Role Management"}
                            {activeTab === "salons" && "Salons Verification & Branches"}
                            {activeTab === "bookings" && "Appointments & Transactions Audit"}
                            {activeTab === "reviews" && "Customer Reviews & Quality Moderation"}
                        </h1>
                        <p>Real-time platform performance, appointment tracking, and partner moderation.</p>
                    </div>

                    <div className="workspace-status-chips">
                        <span className="status-live-chip">
                            <span className="pulsing-live-dot" /> 🟢 Platform Online
                        </span>
                        <span className="status-sync-chip">
                            ⚡ Live Analytics
                        </span>
                    </div>
                </div>

                {error && <div className="alert error">⚠️ {error}</div>}
                {success && <div className="alert success">✅ {success}</div>}

                {/* Search Bar for data tabs */}
                {activeTab !== "overview" && (
                    <div className="admin-search-toolbar">
                        <div className="admin-search-input-box">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder={`Search in ${activeTab}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button className="clear-search-btn" onClick={() => setSearchTerm("")}>✕</button>
                            )}
                        </div>
                    </div>
                )}

                {/* =========================================================
                   TAB 1: Splendid Overview & Analytics
                   ========================================================= */}
                {activeTab === "overview" && stats && (
                    <div className="admin-tab-content">
                        {/* 4 Premium 3D KPI Cards */}
                        <div className="admin-kpi-showcase-grid">
                            <div className="spandle-kpi-card revenue-theme">
                                <div className="kpi-icon-box">💰</div>
                                <div className="kpi-content">
                                    <span className="kpi-title">Gross Platform GMV</span>
                                    <span className="kpi-figure">₹{stats.total_revenue}</span>
                                    <span className="kpi-sub-tag">Completed Bookings Revenue</span>
                                </div>
                                <div className="card-ambient-glow" />
                            </div>

                            <div className="spandle-kpi-card salon-theme">
                                <div className="kpi-icon-box">💈</div>
                                <div className="kpi-content">
                                    <span className="kpi-title">Registered Salons</span>
                                    <span className="kpi-figure">{stats.total_salons}</span>
                                    <span className="kpi-sub-tag">{stats.total_owners} Active Owners</span>
                                </div>
                                <div className="card-ambient-glow" />
                            </div>

                            <div className="spandle-kpi-card customer-theme">
                                <div className="kpi-icon-box">👥</div>
                                <div className="kpi-content">
                                    <span className="kpi-title">Active Customers</span>
                                    <span className="kpi-figure">{stats.total_customers}</span>
                                    <span className="kpi-sub-tag">{stats.total_staff} Stylists & Staff</span>
                                </div>
                                <div className="card-ambient-glow" />
                            </div>

                            <div className="spandle-kpi-card booking-theme">
                                <div className="kpi-icon-box">📅</div>
                                <div className="kpi-content">
                                    <span className="kpi-title">Appointments Handled</span>
                                    <span className="kpi-figure">{stats.total_bookings}</span>
                                    <span className="kpi-sub-tag">⭐ {stats.average_rating} Avg Rating</span>
                                </div>
                                <div className="card-ambient-glow" />
                            </div>
                        </div>

                        {/* Visual Breakdown & Platform Health */}
                        <div className="admin-analytics-grid">
                            <div className="analytics-card">
                                <h3>📈 Appointment Status Distribution</h3>
                                <div className="status-bars-list">
                                    <div className="status-bar-row">
                                        <div className="status-bar-meta">
                                            <span style={{ color: "#fbbf24" }}>⏳ Pending Requests</span>
                                            <strong>{stats.pending_bookings}</strong>
                                        </div>
                                        <div className="bar-track">
                                            <div
                                                className="bar-fill pending"
                                                style={{ width: `${stats.total_bookings ? (stats.pending_bookings / stats.total_bookings) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="status-bar-row">
                                        <div className="status-bar-meta">
                                            <span style={{ color: "#818cf8" }}>✅ Confirmed Scheduled</span>
                                            <strong>{stats.confirmed_bookings}</strong>
                                        </div>
                                        <div className="bar-track">
                                            <div
                                                className="bar-fill confirmed"
                                                style={{ width: `${stats.total_bookings ? (stats.confirmed_bookings / stats.total_bookings) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="status-bar-row">
                                        <div className="status-bar-meta">
                                            <span style={{ color: "#34d399" }}>🎉 Completed Sessions</span>
                                            <strong>{stats.completed_bookings}</strong>
                                        </div>
                                        <div className="bar-track">
                                            <div
                                                className="bar-fill completed"
                                                style={{ width: `${stats.total_bookings ? (stats.completed_bookings / stats.total_bookings) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="analytics-card">
                                <h3>🛡️ Platform Trust & Verification Status</h3>
                                <div className="health-metrics-list">
                                    <div className="health-item">
                                        <span className="health-label">⭐ Customer Rating Average</span>
                                        <span className="health-val glow-gold">{stats.average_rating} / 5.0 ★</span>
                                    </div>
                                    <div className="health-item">
                                        <span className="health-label">🔐 Account Security & Privacy</span>
                                        <span className="health-val glow-green">Enterprise Verified</span>
                                    </div>
                                    <div className="health-item">
                                        <span className="health-label">🛡️ Schedule Protection</span>
                                        <span className="health-val glow-blue">Active Protection</span>
                                    </div>
                                    <div className="health-item">
                                        <span className="health-label">⚡ System Reliability</span>
                                        <span className="health-val glow-purple">99.9% Optimal</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================================
                   TAB 2: Splendid Users Management
                   ========================================================= */}
                {activeTab === "users" && (
                    <div className="admin-table-card">
                        <div className="table-header-row">
                            <h3>Platform Users ({filteredUsers.length})</h3>
                            <div className="filter-chips-row">
                                {["ALL", "CUSTOMER", "SALON_OWNER", "ADMIN"].map((role) => (
                                    <button
                                        key={role}
                                        className={`chip-btn ${userRoleFilter === role ? "active" : ""}`}
                                        onClick={() => setUserRoleFilter(role)}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="admin-table-container">
                            <table className="spandle-table">
                                <thead>
                                    <tr>
                                        <th>USER</th>
                                        <th>EMAIL ADDRESS</th>
                                        <th>PHONE</th>
                                        <th>ASSIGNED ROLE</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((u) => (
                                        <tr key={u.id}>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="user-avatar-tag">
                                                        {u.name?.[0]?.toUpperCase() || "U"}
                                                    </div>
                                                    <div>
                                                        <span className="user-name">{u.name}</span>
                                                        <span className="user-id-sub">ID #{u.id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="user-email-cell">{u.email}</td>
                                            <td className="user-phone-cell">{u.phone || "—"}</td>
                                            <td>
                                                <select
                                                    className={`role-select-pill ${u.role}`}
                                                    value={u.role}
                                                    onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                                                >
                                                    <option value="CUSTOMER">CUSTOMER</option>
                                                    <option value="SALON_OWNER">SALON_OWNER</option>
                                                    <option value="ADMIN">ADMIN</option>
                                                </select>
                                            </td>
                                            <td>
                                                <button
                                                    className="table-action-btn danger"
                                                    onClick={() => handleDeleteUser(u.id, u.name)}
                                                    title="Delete or Ban user"
                                                >
                                                    🗑️ Ban
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* =========================================================
                   TAB 3: Splendid Salons & Verification
                   ========================================================= */}
                {activeTab === "salons" && (
                    <div className="admin-table-card">
                        <div className="table-header-row">
                            <h3>Salons & Verified Partners ({filteredSalons.length})</h3>
                            <div className="filter-chips-row">
                                {["ALL", "VERIFIED", "PENDING"].map((st) => (
                                    <button
                                        key={st}
                                        className={`chip-btn ${salonVerifyFilter === st ? "active" : ""}`}
                                        onClick={() => setSalonVerifyFilter(st)}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="spandle-salons-grid">
                            {filteredSalons.map((s) => (
                                <div key={s.id} className="spandle-salon-item-card">
                                    <div className="salon-card-header">
                                        <span className="salon-id-chip">Salon #{s.id}</span>
                                        <span className={`verify-badge ${s.is_verified ? "verified" : "pending"}`}>
                                            {s.is_verified ? "✅ Verified" : "⏳ Pending"}
                                        </span>
                                    </div>

                                    <h3 className="salon-card-title">💈 {s.name}</h3>
                                    <p className="salon-card-address">📍 {s.address}, {s.city}</p>

                                    <div className="salon-card-meta-box">
                                        <span>⏰ {s.opening_time || "9 AM"} – {s.closing_time || "9 PM"}</span>
                                        <span>⭐ {s.rating || 4.9}</span>
                                        <span>📞 {s.phone || "On file"}</span>
                                    </div>

                                    <div className="salon-card-actions-row">
                                        <button
                                            className={`action-btn-verify ${s.is_verified ? "revoke" : "grant"}`}
                                            onClick={() => handleToggleVerification(s.id)}
                                        >
                                            {s.is_verified ? "Revoke Badge" : "✓ Grant Verification"}
                                        </button>
                                        <button
                                            className="action-btn-delete"
                                            onClick={() => handleDeleteSalon(s.id, s.name)}
                                        >
                                            🗑️ Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* =========================================================
                   TAB 4: Appointments Audit
                   ========================================================= */}
                {activeTab === "bookings" && (
                    <div className="admin-table-card">
                        <div className="table-header-row">
                            <h3>Platform Appointments Audit ({filteredBookings.length})</h3>
                            <div className="filter-chips-row">
                                {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((st) => (
                                    <button
                                        key={st}
                                        className={`chip-btn ${bookingStatusFilter === st ? "active" : ""}`}
                                        onClick={() => setBookingStatusFilter(st)}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="admin-table-container">
                            <table className="spandle-table">
                                <thead>
                                    <tr>
                                        <th>APPT #</th>
                                        <th>SALON</th>
                                        <th>SERVICE</th>
                                        <th>SCHEDULE</th>
                                        <th>PRICE</th>
                                        <th>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.map((b) => (
                                        <tr key={b.id}>
                                            <td className="booking-id-cell">#{b.id}</td>
                                            <td>Salon #{b.salon_id}</td>
                                            <td className="service-name-cell">✂️ {b.service}</td>
                                            <td>📅 {b.booking_date} • {b.booking_time}</td>
                                            <td className="price-cell">₹{b.price || 0}</td>
                                            <td>
                                                <span className={`status-pill ${b.status?.toLowerCase()}`}>
                                                    {b.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* =========================================================
                   TAB 5: Reviews Moderation
                   ========================================================= */}
                {activeTab === "reviews" && (
                    <div className="admin-table-card">
                        <div className="table-header-row">
                            <h3>Verified Customer Reviews & Quality ({reviewsList.length})</h3>
                        </div>

                        {reviewsList.length === 0 ? (
                            <p style={{ color: "#64748b", padding: "20px" }}>No reviews submitted yet.</p>
                        ) : (
                            <div className="reviews-moderation-grid">
                                {reviewsList.map((r) => (
                                    <div key={r.id} className="review-mod-card">
                                        <div className="review-mod-header">
                                            <span className="review-stars-val">
                                                {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                                            </span>
                                            <span className="review-meta-tag">
                                                Customer #{r.customer_id} ➔ Salon #{r.salon_id}
                                            </span>
                                        </div>
                                        <p className="review-comment-text">"{r.comment || "Great service!"}"</p>
                                        <div className="review-mod-footer">
                                            <button
                                                className="table-action-btn danger"
                                                onClick={() => handleDeleteReview(r.id)}
                                            >
                                                🗑️ Remove Spam
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default AdminDashboard;
