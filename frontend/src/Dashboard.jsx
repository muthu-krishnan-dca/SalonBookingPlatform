import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, isAuthenticated, isSalonOwner } from "./auth";
import OwnerDashboard from "./OwnerDashboard";
import CustomerBottomNav from "./CustomerBottomNav";

const SALON_SHOWCASE_SCENES = [
    {
        id: "haircut",
        icon: "✂️",
        tabLabel: "Hair Styling",
        badge: "🔥 Trending 2026",
        title: "Precision Scissor Craft & Modern Fades",
        subtitle: "Tailored to your facial contours by certified styling masters.",
        quote: "“The best fade & styling experience in town!”",
        bgImage: "/mobile-salon-hero.jpg",
        accent: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
        floatingTag: "✂️ Master Barber Certified",
        stats: "15,000+ Styles Crafted"
    },
    {
        id: "spa",
        icon: "💆",
        tabLabel: "Hair Spa & Care",
        badge: "🌿 Luxury Deep Therapy",
        title: "Rejuvenating Moroccan Scalp & Hair Spa",
        subtitle: "Therapeutic hot-towel steam, botanical oils, and nourishing scalp therapy.",
        quote: "“Total stress relief and intensely soft hair.”",
        bgImage: "/salons-bg.jpg",
        accent: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
        floatingTag: "🍃 100% Organic Products",
        stats: "99.4% Client Satisfaction"
    },
    {
        id: "beard",
        icon: "🧔",
        tabLabel: "Royal Grooming",
        badge: "💈 Executive Touch",
        title: "Master Beard Sculpting & Razor Finish",
        subtitle: "Crisp line-ups, botanical beard butter conditioning, and hot-towel treatment.",
        quote: "“Sharp look with unmatched precision.”",
        bgImage: "/salon-bg.jpg",
        accent: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
        floatingTag: "⚡ Razor-Sharp Edge",
        stats: "Over 8,000 Happy Beards"
    },
    {
        id: "facial",
        icon: "✨",
        tabLabel: "Radiant Facial",
        badge: "⭐ Signature Glow",
        title: "Radiant Gold Glow Facial & Cleanup",
        subtitle: "Deep ultrasonic pore detox, skin hydration, and youthful radiance boost.",
        quote: "“Instant natural glow that lasts for weeks!”",
        bgImage: "/mobile-salon-hero.jpg",
        accent: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
        floatingTag: "✨ Instant Radiance & Detox",
        stats: "Rated 4.98 / 5.0"
    }
];

function Dashboard() {
    const navigate = useNavigate();
    const user = getUser();
    const authed = isAuthenticated();
    const isOwner = isSalonOwner();

    // Animated Video Reel State for Desktop
    const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);

    // Auto-advance scenes every 5 seconds if playing
    useEffect(() => {
        if (!isPlaying) return;
        const timer = setInterval(() => {
            setCurrentSceneIdx((prev) => (prev + 1) % SALON_SHOWCASE_SCENES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [isPlaying, currentSceneIdx]);

    // If logged in as Salon Owner, render the complete Owner Dashboard
    if (isOwner) {
        return <OwnerDashboard />;
    }

    const currentScene = SALON_SHOWCASE_SCENES[currentSceneIdx];

    // Otherwise render Customer / General Dashboard
    return (
        <div className="dashboard customer-page-with-bottom-nav">
            {/* Top Auth User Bar */}
            <div className="dashboard-auth-bar">
                {authed ? (
                    <div className="auth-user-bar-group">
                        <button
                            className="customer-profile-btn"
                            onClick={() => navigate("/profile")}
                            title="Click to view & edit Profile"
                        >
                            <div className="customer-avatar-circle">
                                {(user?.name || "C")[0].toUpperCase()}
                            </div>
                            <div className="customer-profile-info">
                                <span className="customer-name-text">{user?.name || "Customer"}</span>
                                <span className="customer-sub-badge">👤 Profile</span>
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="auth-guest-actions">
                        <button className="nav-btn" onClick={() => navigate("/login")}>
                            🔐 Login
                        </button>
                        <button className="nav-btn primary" onClick={() => navigate("/register")}>
                            ➕ Register
                        </button>
                    </div>
                )}
            </div>

            <div className="dashboard-hero">
                <h1>✨ Salon Booking System</h1>
                <h2>Personal Appointment & Styling Hub</h2>
                <p>Explore top-rated salons, discover beauty services, and schedule appointments instantly.</p>
            </div>

            {/* Desktop / Laptop Dashboard Cards (Visible on Laptop & Desktop) */}
            <div className="cards desktop-only-cards">
                <div className="dashboard-card salon-theme">
                    <div className="card-badge">Explore</div>
                    <div className="card-icon-box">💇‍♀️</div>
                    <h3>Available Salons</h3>
                    <p>Explore top salons in your city, check offered services, and book your styling session.</p>
                    <button className="card-btn" onClick={() => navigate("/salons")}>
                        View Salons →
                    </button>
                </div>

                <div className="dashboard-card booking-theme">
                    <div className="card-badge">My Schedule</div>
                    <div className="card-icon-box">📅</div>
                    <h3>My Bookings</h3>
                    <p>View your upcoming appointments, track confirmation statuses, or reschedule bookings.</p>
                    <button className="card-btn" onClick={() => navigate("/bookings")}>
                        My Appointments →
                    </button>
                </div>
            </div>

            {/* Featured Deals & Offers (Ad Banner) */}
            <div className="dashboard-promo-banner" onClick={() => navigate("/salons")}>
                <div className="promo-badge">🔥 Special Weekend Offer</div>
                <div className="promo-content">
                    <div className="promo-icon">🎁</div>
                    <div className="promo-text">
                        <h4>Flat 20% OFF on First Hair Spa & Grooming</h4>
                        <p>Book any premium salon appointment today. Use coupon code: <span className="promo-code">GLOW20</span></p>
                    </div>
                </div>
                <span className="promo-action-tag">Claim Deal →</span>
            </div>

            {/* Cinematic Salon Experience Animation & Video Reel (Desktop & Tablet Showcase) */}
            <div className="desktop-salon-video-showcase">
                <div className="showcase-header-row">
                    <div className="showcase-title-box">
                        <span className="showcase-mini-pill">🎬 LIVE SALON SHOWCASE</span>
                        <h3>Experience Luxury Grooming & Styling</h3>
                    </div>

                    {/* Scene Navigation Tabs */}
                    <div className="showcase-scene-tabs">
                        {SALON_SHOWCASE_SCENES.map((scene, idx) => (
                            <button
                                key={scene.id}
                                className={`scene-tab-btn ${currentSceneIdx === idx ? "active" : ""}`}
                                onClick={() => {
                                    setCurrentSceneIdx(idx);
                                    setIsPlaying(false);
                                }}
                            >
                                <span className="scene-tab-icon">{scene.icon}</span>
                                <span className="scene-tab-text">{scene.tabLabel}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Animated Video / Experience Player Card */}
                <div
                    className="showcase-screen-card"
                    style={{
                        backgroundImage: `linear-gradient(180deg, rgba(16, 12, 28, 0.4) 0%, rgba(10, 7, 20, 0.92) 100%), url(${currentScene.bgImage})`
                    }}
                >
                    {/* Animated Light Sweeps & Glowing Aura */}
                    <div className="video-ambient-glow" />
                    <div className="animated-particle particle-1">✂️</div>
                    <div className="animated-particle particle-2">✨</div>
                    <div className="animated-particle particle-3">💈</div>
                    <div className="animated-particle particle-4">💆</div>

                    {/* Top Screen Overlays */}
                    <div className="screen-top-bar">
                        <div className="screen-live-pill">
                            <span className="live-pulsing-dot" />
                            <span>EXPERIENCE REEL</span>
                        </div>

                        <div className="screen-floating-tag" style={{ background: currentScene.accent }}>
                            {currentScene.floatingTag}
                        </div>

                        {/* Play / Pause Toggle */}
                        <button
                            className="video-play-toggle"
                            onClick={() => setIsPlaying(!isPlaying)}
                            title={isPlaying ? "Pause autoplay" : "Resume autoplay"}
                        >
                            {isPlaying ? (
                                <>
                                    <span className="sound-wave wave-1" />
                                    <span className="sound-wave wave-2" />
                                    <span className="sound-wave wave-3" />
                                    <span style={{ fontSize: "11px", fontWeight: "700" }}>Playing</span>
                                </>
                            ) : (
                                <span>▶ Play Reel</span>
                            )}
                        </button>
                    </div>

                    {/* Center Animated Visualizer Showcase */}
                    <div className="screen-center-content">
                        <span className="screen-badge-highlight">{currentScene.badge}</span>
                        <h2 className="screen-headline">{currentScene.title}</h2>
                        <p className="screen-subheadline">{currentScene.subtitle}</p>

                        <div className="screen-quote-box">
                            <span className="quote-icon">💬</span>
                            <em>{currentScene.quote}</em>
                            <span className="quote-stat">— {currentScene.stats}</span>
                        </div>
                    </div>

                    {/* Bottom Action & Progress Bar */}
                    <div className="screen-bottom-bar">
                        <div className="screen-progress-track">
                            <div
                                key={currentSceneIdx + (isPlaying ? "-playing" : "-paused")}
                                className={`screen-progress-fill ${isPlaying ? "animating" : ""}`}
                            />
                        </div>

                        <div className="screen-cta-row">
                            <div className="screen-benefits">
                                <span>⚡ <strong>1-Click</strong> GPS Detection</span>
                                <span>⭐ <strong>4.9/5</strong> Star Ratings</span>
                                <span>🛡️ <strong>100%</strong> Verified Stylists</span>
                            </div>

                            <button
                                className="screen-book-cta-btn"
                                onClick={() => navigate("/salons")}
                            >
                                💇 Book This Experience →
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Stats Showcase Strip */}
                <div className="showcase-bottom-strip">
                    <div className="strip-item">
                        <span className="strip-num">50+</span>
                        <span className="strip-label">Verified Salons</span>
                    </div>
                    <div className="strip-divider" />
                    <div className="strip-item">
                        <span className="strip-num">10,000+</span>
                        <span className="strip-label">Appointments Handled</span>
                    </div>
                    <div className="strip-divider" />
                    <div className="strip-item">
                        <span className="strip-num">4.9 ★</span>
                        <span className="strip-label">Top Customer Rating</span>
                    </div>
                    <div className="strip-divider" />
                    <div className="strip-item">
                        <span className="strip-num">⚡ Live GPS</span>
                        <span className="strip-label">Nearest Distance Sorting</span>
                    </div>
                </div>
            </div>

            {/* Mobile Salon Showcase Card with Image & Content (Only on Phone screens) */}
            <div className="mobile-salon-story-card mobile-only-home-feed" onClick={() => navigate("/salons")}>
                <div className="story-image-wrapper">
                    <img
                        src="/mobile-salon-hero.jpg"
                        alt="Luxury Beauty Salon Interior"
                        className="story-banner-img"
                    />
                    <div className="story-overlay-gradient" />
                    <div className="story-floating-tags">
                        <span className="story-tag glow">⭐ 4.9 Top Rated</span>
                        <span className="story-tag">🌿 Luxury Spa & Styling</span>
                    </div>
                </div>
                <div className="story-content-box">
                    <h3>✨ Elevate Your Style with Certified Experts</h3>
                    <p>
                        Experience world-class hair styling, rejuvenating skin therapies, and tailored grooming packages from top-rated salons in your city.
                    </p>
                    <div className="story-stats-row">
                        <div className="stat-pill">📍 <strong>50+</strong> Salons</div>
                        <div className="stat-pill">⚡ <strong>1-Click</strong> GPS</div>
                        <div className="stat-pill">⏱️ <strong>Instant</strong> Booking</div>
                    </div>
                    <button
                        className="card-btn story-cta-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate("/salons");
                        }}
                    >
                        💇 Explore Salons & Book Now →
                    </button>
                </div>
            </div>

            {/* Popular Services Quick Categories (Mobile / App Feed) */}
            <div className="home-categories-section mobile-only-home-feed" style={{ maxWidth: "800px", width: "100%", margin: "20px auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", padding: "0 4px" }}>
                    <h3 style={{ margin: 0, fontSize: "18px", color: "#ffffff", fontWeight: "800" }}>
                        ✨ Popular Styling & Beauty Services
                    </h3>
                    <button
                        className="change-target-btn"
                        onClick={() => navigate("/salons")}
                        style={{ fontSize: "13px", color: "#c084fc", fontWeight: "700" }}
                    >
                        View All Salons →
                    </button>
                </div>

                <div className="home-services-grid">
                    {[
                        { icon: "💇‍♂️", label: "Haircut & Styling", desc: "Expert fade, trim & hair wash" },
                        { icon: "💆", label: "Hair Spa & Massage", desc: "Relaxing deep conditioning" },
                        { icon: "✨", label: "Facial & Skin Care", desc: "Glow facial & deep cleanup" },
                        { icon: "🧔", label: "Beard & Shave", desc: "Precision beard shaping & trimming" },
                        { icon: "🎨", label: "Hair Color & Highlights", desc: "Trendy streaks & organic color" },
                        { icon: "💅", label: "Bridal & Grooming", desc: "Complete special occasion packages" }
                    ].map((cat, idx) => (
                        <div
                            key={idx}
                            className="home-service-card"
                            onClick={() => navigate("/salons")}
                        >
                            <div className="service-icon-box">{cat.icon}</div>
                            <div className="service-info-box">
                                <h4>{cat.label}</h4>
                                <p>{cat.desc}</p>
                            </div>
                            <span className="service-arrow">→</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <CustomerBottomNav />
        </div>
    );
}

export default Dashboard;