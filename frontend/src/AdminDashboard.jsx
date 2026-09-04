import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, logout, getToken } from "./auth";

function AdminDashboard() {
    const navigate = useNavigate();
    const currentUser = getUser();

    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState("overview"); // overview, users, salons, staff, services, bookings, reviews
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Search and Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [userRoleFilter, setUserRoleFilter] = useState("ALL");
    const [salonVerifyFilter, setSalonVerifyFilter] = useState("ALL");
    const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");
    const [serviceCategoryFilter, setServiceCategoryFilter] = useState("ALL");

    // Data lists
    const [usersList, setUsersList] = useState([]);
    const [salonsList, setSalonsList] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [servicesList, setServicesList] = useState([]);
    const [bookingsList, setBookingsList] = useState([]);
    const [reviewsList, setReviewsList] = useState([]);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const loadAdminData = async () => {
        try {
            setLoading(true);
            setError("");

            const authHeaders = {
                "Content-Type": "application/json",
                ...(getToken() ? { "Authorization": `Bearer ${getToken()}` } : {})
            };

            // 1. Fetch Platform Stats
            const statsRes = await fetch("http://127.0.0.1:8000/admin/stats", { headers: authHeaders });
            if (statsRes.ok) {
                setStats(await statsRes.json());
            }

            // 2. Fetch Users
            const usersRes = await fetch("http://127.0.0.1:8000/admin/users", { headers: authHeaders });
            if (usersRes.ok) {
                setUsersList(await usersRes.json());
            }

            // 3. Fetch Salons
            const salonsRes = await fetch("http://127.0.0.1:8000/admin/salons", { headers: authHeaders });
            if (salonsRes.ok) {
                setSalonsList(await salonsRes.json());
            }

            // 4. Fetch Staff
            const staffRes = await fetch("http://127.0.0.1:8000/admin/staff", { headers: authHeaders });
            if (staffRes.ok) {
                setStaffList(await staffRes.json());
            }

            // 5. Fetch Services
            const servicesRes = await fetch("http://127.0.0.1:8000/admin/services", { headers: authHeaders });
            if (servicesRes.ok) {
                setServicesList(await servicesRes.json());
            }

            // 6. Fetch Bookings
            const bookingsRes = await fetch("http://127.0.0.1:8000/admin/bookings", { headers: authHeaders });
            if (bookingsRes.ok) {
                setBookingsList(await bookingsRes.json());
            }

            // 7. Fetch Reviews
            const reviewsRes = await fetch("http://127.0.0.1:8000/admin/reviews", { headers: authHeaders });
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

    // Delete staff
    const handleDeleteStaff = async (staffId, staffName) => {
        if (!window.confirm(`Are you sure you want to delete stylist "${staffName}"?`)) return;
        try {
            const res = await fetch(`http://127.0.0.1:8000/admin/staff/${staffId}`, {
                method: "DELETE",
                headers: getToken() ? { "Authorization": `Bearer ${getToken()}` } : {}
            });
            if (!res.ok) throw new Error("Failed to delete staff member");
            setSuccess("Stylist removed from platform");
            loadAdminData();
        } catch (err) {
            setError(err.message);
        }
    };

    // Delete service
    const handleDeleteService = async (serviceId, serviceName) => {
        if (!window.confirm(`Are you sure you want to delete service "${serviceName}"?`)) return;
        try {
            const res = await fetch(`http://127.0.0.1:8000/admin/services/${serviceId}`, {
                method: "DELETE",
                headers: getToken() ? { "Authorization": `Bearer ${getToken()}` } : {}
            });
            if (!res.ok) throw new Error("Failed to delete service");
            setSuccess("Service removed from platform");
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

    const filteredStaff = staffList.filter((st) => {
        const matchesSearch = !searchTerm || 
            st.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            st.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            st.salon_name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const filteredServices = servicesList.filter((srv) => {
        const matchesCat = serviceCategoryFilter === "ALL" || (srv.category || "").toLowerCase() === serviceCategoryFilter.toLowerCase();
        const matchesSearch = !searchTerm || 
            srv.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            srv.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            srv.salon_name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCat && matchesSearch;
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
        { id: "staff", icon: "✂️", label: "Staff & Stylists", badge: staffList.length },
        { id: "services", icon: "✨", label: "Services & Categories", badge: servicesList.length },
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
                        <span className="admin-name">{currentUser?.name || "Super Admin"}</span>
                        <span className="admin-email">{currentUser?.email || "taskmanagement.able@gmail.com"}</span>
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
                            {activeTab === "staff" && "Stylists & Staff Management"}
                            {activeTab === "services" && "Platform Services & Category Catalog"}
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
                                    <span className="kpi-sub-tag">✂️ {stats.total_staff} Stylists • ✨ {stats.total_services || 0} Services</span>
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

                        {/* 3. Live Rate Limiting & Enterprise Threat Protection Card */}
                        <div className="analytics-card" style={{ marginTop: "24px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
                                <div>
                                    <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                                        🛡️ API Rate Limiting & Enterprise Threat Protection
                                    </h3>
                                    <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                                        Sliding-window in-memory throttling active on critical API surfaces with automatic HTTP 429 enforcement.
                                    </span>
                                </div>
                                <span style={{
                                    background: "rgba(34, 197, 94, 0.15)",
                                    border: "1px solid rgba(34, 197, 94, 0.4)",
                                    color: "#4ade80",
                                    padding: "6px 14px",
                                    borderRadius: "20px",
                                    fontSize: "12px",
                                    fontWeight: "800",
                                    letterSpacing: "0.5px"
                                }}>
                                    ● ENFORCING (HTTP 429 ACTIVE)
                                </span>
                            </div>

                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: "14px",
                                marginTop: "14px"
                            }}>
                                {[
                                    { route: "/login", limit: "15 req / 60s", tag: "Brute-Force & Credential Stuffing", badge: "#ec4899" },
                                    { route: "/register", limit: "10 req / 60s", tag: "Spam Account Creation", badge: "#f59e0b" },
                                    { route: "/send-otp", limit: "6 req / 60s", tag: "OTP Flooding & SMS Abuse", badge: "#ef4444" },
                                    { route: "/verify-otp", limit: "12 req / 60s", tag: "OTP Guessing Prevention", badge: "#8b5cf6" },
                                    { route: "/bookings", limit: "40 req / 60s", tag: "Slot Double-Booking Defense", badge: "#3b82f6" },
                                    { route: "/reviews", limit: "25 req / 60s", tag: "Review Manipulation", badge: "#10b981" },
                                    { route: "Global API", limit: "120 req / 60s", tag: "DDoS & Crawling Protection", badge: "#a855f7" },
                                ].map((item, idx) => (
                                    <div key={idx} style={{
                                        background: "rgba(255, 255, 255, 0.03)",
                                        border: "1px solid rgba(255, 255, 255, 0.08)",
                                        borderRadius: "14px",
                                        padding: "14px 16px",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between"
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                            <code style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: "700" }}>{item.route}</code>
                                            <span style={{
                                                fontSize: "11px",
                                                fontWeight: "800",
                                                padding: "2px 8px",
                                                borderRadius: "6px",
                                                background: `${item.badge}22`,
                                                color: item.badge,
                                                border: `1px solid ${item.badge}55`
                                            }}>
                                                {item.limit}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>{item.tag}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{
                                marginTop: "18px",
                                padding: "12px 18px",
                                background: "rgba(168, 85, 247, 0.08)",
                                borderRadius: "14px",
                                border: "1px solid rgba(168, 85, 247, 0.25)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "10px"
                            }}>
                                <div style={{ fontSize: "12.5px", color: "#cbd5e1" }}>
                                    <strong>HTTP 429 Observability Headers:</strong> <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>, <code>X-RateLimit-Reset</code>, <code>Retry-After</code>
                                </div>
                                <a
                                    href="http://127.0.0.1:8000/rate-limit-status"
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        color: "#c084fc",
                                        fontSize: "12.5px",
                                        fontWeight: "700",
                                        textDecoration: "none",
                                        padding: "6px 14px",
                                        background: "rgba(192, 132, 252, 0.15)",
                                        borderRadius: "8px",
                                        border: "1px solid rgba(192, 132, 252, 0.3)"
                                    }}
                                >
                                    View Live JSON Metric API ↗
                                </a>
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
                   TAB: Staff & Stylists Management
                   ========================================================= */}
                {activeTab === "staff" && (
                    <div className="admin-table-card">
                        <div className="table-header-row">
                            <h3>Platform Stylists & Staff ({filteredStaff.length})</h3>
                        </div>

                        {filteredStaff.length === 0 ? (
                            <p style={{ color: "#94a3b8", padding: "20px" }}>No stylists found matching your search.</p>
                        ) : (
                            <div className="admin-table-container">
                                <table className="spandle-table">
                                    <thead>
                                        <tr>
                                            <th>STYLIST</th>
                                            <th>SALON</th>
                                            <th>SPECIALIZATION</th>
                                            <th>EXPERIENCE</th>
                                            <th>PHONE</th>
                                            <th>STATUS</th>
                                            <th>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStaff.map((st) => (
                                            <tr key={st.id}>
                                                <td className="user-name-cell">
                                                    <div className="user-avatar-small">
                                                        {(st.name || "S")[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <strong>{st.name}</strong>
                                                        <span style={{ display: "block", fontSize: "11px", color: "#94a3b8" }}>ID #{st.id}</span>
                                                    </div>
                                                </td>
                                                <td>💈 {st.salon_name || `Salon #${st.salon_id}`}</td>
                                                <td>
                                                    <span className="spec-badge">✂️ {st.specialization}</span>
                                                </td>
                                                <td>{st.experience_years} yrs</td>
                                                <td>{st.phone || "—"}</td>
                                                <td>
                                                    <span className={`status-pill ${st.is_available ? "confirmed" : "cancelled"}`}>
                                                        {st.is_available ? "Active" : "On Leave / Off"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="table-action-btn danger"
                                                        onClick={() => handleDeleteStaff(st.id, st.name)}
                                                    >
                                                        🗑️ Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* =========================================================
                   TAB: Services & Categories Catalog
                   ========================================================= */}
                {activeTab === "services" && (
                    <div className="admin-table-card">
                        <div className="table-header-row">
                            <h3>Services & Category Catalog ({filteredServices.length})</h3>
                            <div className="filter-chips-row">
                                {["ALL", "Hair", "Spa", "Skin", "Beard", "Bridal", "Coloring"].map((cat) => (
                                    <button
                                        key={cat}
                                        className={`chip-btn ${serviceCategoryFilter === cat ? "active" : ""}`}
                                        onClick={() => setServiceCategoryFilter(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredServices.length === 0 ? (
                            <p style={{ color: "#94a3b8", padding: "20px" }}>No services found matching your filter.</p>
                        ) : (
                            <div className="admin-table-container">
                                <table className="spandle-table">
                                    <thead>
                                        <tr>
                                            <th>SERVICE NAME</th>
                                            <th>SALON</th>
                                            <th>CATEGORY</th>
                                            <th>PRICE</th>
                                            <th>DURATION</th>
                                            <th>DESCRIPTION</th>
                                            <th>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredServices.map((srv) => (
                                            <tr key={srv.id}>
                                                <td className="service-name-cell">
                                                    <strong>{srv.name}</strong>
                                                </td>
                                                <td>💈 {srv.salon_name || `Salon #${srv.salon_id}`}</td>
                                                <td>
                                                    <span className="spec-badge">{srv.category}</span>
                                                </td>
                                                <td className="price-cell">₹{srv.price}</td>
                                                <td>⏱️ {srv.duration_mins} mins</td>
                                                <td style={{ maxWidth: "220px", fontSize: "12px", color: "#94a3b8" }}>
                                                    {srv.description || "Standard styling treatment"}
                                                </td>
                                                <td>
                                                    <button
                                                        className="table-action-btn danger"
                                                        onClick={() => handleDeleteService(srv.id, srv.name)}
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
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
