import { useNavigate, useLocation } from "react-router-dom";

function CustomerBottomNav() {
    const navigate = useNavigate();
    const location = useLocation();

    const currentPath = location.pathname;

    const isActive = (itemPaths) => {
        return itemPaths.some((p) => {
            if (p === "/" || p === "/dashboard") {
                return currentPath === "/" || currentPath === "/dashboard";
            }
            return currentPath.startsWith(p);
        });
    };

    const isHomeActive = isActive(["/", "/dashboard"]);
    const isSalonsActive = isActive(["/salons", "/salon"]);
    const isBookingsActive = isActive(["/bookings", "/book"]);
    const isProfileActive = isActive(["/profile"]);

    return (
        <nav className="customer-bottom-nav instagram-style" aria-label="Mobile Bottom Navigation">
            <div className="bottom-nav-inner">
                {/* 1. Home (Instagram Style) */}
                <button
                    className={`bottom-nav-item ${isHomeActive ? "active" : ""}`}
                    onClick={() => navigate("/dashboard")}
                    aria-label="Home"
                    title="Home"
                >
                    <span className="bottom-nav-icon">
                        {isHomeActive ? (
                            <svg viewBox="0 0 24 24" width="25" height="25" fill="currentColor">
                                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                        )}
                    </span>
                    {isHomeActive && <span className="bottom-nav-dot" />}
                </button>

                {/* 2. Salons / Explore */}
                <button
                    className={`bottom-nav-item ${isSalonsActive ? "active" : ""}`}
                    onClick={() => navigate("/salons")}
                    aria-label="Salons"
                    title="Salons"
                >
                    <span className="bottom-nav-icon">
                        {isSalonsActive ? (
                            <svg viewBox="0 0 24 24" width="25" height="25" fill="currentColor">
                                <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12zm-7-8c-1.66 0-3-1.34-3-3H7c0 2.76 2.24 5 5 5s5-2.24 5-5h-2c0 1.66-1.34 3-3 3z" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                                <path d="M3 6h18" />
                                <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                        )}
                    </span>
                    {isSalonsActive && <span className="bottom-nav-dot" />}
                </button>

                {/* 3. Bookings / Calendar */}
                <button
                    className={`bottom-nav-item ${isBookingsActive ? "active" : ""}`}
                    onClick={() => navigate("/bookings")}
                    aria-label="Bookings"
                    title="Bookings"
                >
                    <span className="bottom-nav-icon">
                        {isBookingsActive ? (
                            <svg viewBox="0 0 24 24" width="25" height="25" fill="currentColor">
                                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        )}
                    </span>
                    {isBookingsActive && <span className="bottom-nav-dot" />}
                </button>

                {/* 4. Profile */}
                <button
                    className={`bottom-nav-item ${isProfileActive ? "active" : ""}`}
                    onClick={() => navigate("/profile")}
                    aria-label="Profile"
                    title="Profile"
                >
                    <span className="bottom-nav-icon">
                        {isProfileActive ? (
                            <svg viewBox="0 0 24 24" width="25" height="25" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        )}
                    </span>
                    {isProfileActive && <span className="bottom-nav-dot" />}
                </button>
            </div>
        </nav>
    );
}

export default CustomerBottomNav;
