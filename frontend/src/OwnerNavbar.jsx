import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getUser, logout } from "./auth";

function OwnerNavbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = getUser();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close mobile drawer when route changes
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const navItems = [
        { path: "/dashboard", icon: "🏠", label: "Dashboard", sub: "Overview & Stats" },
        { path: "/owner/salon", icon: "💇", label: "My Salon", sub: "Branches & Hours" },
        { path: "/owner/bookings", icon: "📅", label: "Bookings", sub: "Incoming Requests" },
        { path: "/owner/customers", icon: "👥", label: "Customers", sub: "Client Records" },
        { path: "/owner/profile", icon: "👤", label: "My Profile", sub: "Account Settings" },
    ];

    const ownerInitial = (user?.name || "O")[0].toUpperCase();

    return (
        <>
            {/* Mobile Top Header with Hamburger Toggle (Only visible on small screens) */}
            <header className="owner-mobile-topbar">
                <button
                    className="owner-hamburger-btn"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle Navigation Menu"
                >
                    {mobileOpen ? "✕" : "☰"}
                </button>

                <div className="owner-mobile-brand" onClick={() => navigate("/dashboard")}>
                    <span className="mobile-brand-icon">✨</span>
                    <span className="mobile-brand-name">Salon Booking</span>
                    <span className="mobile-brand-badge">OWNER</span>
                </div>

                <div className="owner-mobile-avatar" onClick={() => navigate("/owner/profile")}>
                    {ownerInitial}
                </div>
            </header>

            {/* Mobile Backdrop Overlay */}
            {mobileOpen && (
                <div
                    className="owner-sidebar-backdrop"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Main Left Sidebar (Fixed on Desktop, Drawer on Mobile) */}
            <aside className={`owner-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
                {/* 1. Sidebar Brand Section */}
                <div className="owner-sidebar-brand" onClick={() => navigate("/dashboard")}>
                    <div className="sidebar-brand-icon-box">✨</div>
                    <div className="sidebar-brand-info">
                        <h2 className="sidebar-brand-title">Salon Booking</h2>
                        <span className="sidebar-brand-badge">💈 OWNER PORTAL</span>
                    </div>
                </div>

                {/* 2. Owner Profile Card inside Sidebar */}
                <div className="owner-sidebar-profile" onClick={() => navigate("/owner/profile")}>
                    <div className="sidebar-avatar-circle">{ownerInitial}</div>
                    <div className="sidebar-profile-info">
                        <span className="sidebar-profile-name">{user?.name || "Salon Owner"}</span>
                        <span className="sidebar-profile-role">SALON OWNER</span>
                    </div>
                </div>

                {/* 3. Vertical Navigation Menu */}
                <nav className="owner-sidebar-nav">
                    <span className="sidebar-section-heading">MAIN MENU</span>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                                onClick={() => navigate(item.path)}
                            >
                                <span className="sidebar-nav-icon">{item.icon}</span>
                                <div className="sidebar-nav-text">
                                    <span className="sidebar-nav-label">{item.label}</span>
                                    <span className="sidebar-nav-sub">{item.sub}</span>
                                </div>
                                {isActive && <span className="sidebar-active-indicator" />}
                            </button>
                        );
                    })}
                </nav>

                {/* 4. Bottom Sidebar Actions */}
                <div className="owner-sidebar-footer">
                    <button
                        className="sidebar-customer-view-btn"
                        onClick={() => navigate("/salons")}
                        title="Switch to customer salon discovery view"
                    >
                        <span>🌐 View Customer Salons</span>
                    </button>

                    <button
                        className="sidebar-logout-btn"
                        onClick={logout}
                        title="Logout from owner account"
                    >
                        <span>🚪 Log Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default OwnerNavbar;
