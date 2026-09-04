import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "./auth";

function LandingPage() {
    const navigate = useNavigate();
    const user = getUser();

    const [faqOpen, setFaqOpen] = useState(null);

    const faqs = [
        {
            q: "How does customer appointment booking work?",
            a: "Simply browse nearby verified salons, choose your desired treatment and favorite stylist, pick an open date/time slot, and confirm. You will receive real-time status updates."
        },
        {
            q: "Can salon owners manage multiple stylists and staff leaves?",
            a: "Yes! Salon owners have a full-featured Owner Portal to manage service menus with custom pricing/durations, assign staff specialties, toggle working hours, and register scheduled day-offs."
        },
        {
            q: "Does GlowSync prevent double-bookings?",
            a: "Absolutely. Our intelligent scheduling engine verifies stylist availability and locks the slot, preventing overlapping appointments."
        },
        {
            q: "Is there any commission for salon owners?",
            a: "We offer a 100% Free Starter Tier with zero commissions to help local salons scale their business digitally."
        }
    ];

    return (
        <div className="landing-page-root" style={{
            minHeight: "100vh",
            background: "linear-gradient(180deg, #0d0918 0%, #150f29 50%, #0a0614 100%)",
            color: "#ffffff",
            overflowX: "hidden"
        }}>
            {/* 1. Marketing Top Navigation Bar */}
            <nav style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 32px",
                maxWidth: "1240px",
                margin: "0 auto"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => navigate("/")}>
                    <span style={{ fontSize: "28px" }}>✨</span>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "900", letterSpacing: "-0.5px" }}>
                            Glow<span style={{ color: "#c084fc" }}>Sync</span>
                        </h2>
                        <span style={{ fontSize: "10px", fontWeight: "800", color: "#38bdf8", letterSpacing: "1px" }}>
                            SALON & BEAUTY ECOSYSTEM
                        </span>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    {user ? (
                        <button
                            className="card-btn"
                            onClick={() => navigate(user.role === "SALON_OWNER" ? "/owner/salon" : user.role === "ADMIN" ? "/admin" : "/dashboard")}
                            style={{ padding: "10px 20px", fontSize: "13.5px" }}
                        >
                            🚀 Open Dashboard ({user.name})
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => navigate("/login")}
                                style={{
                                    background: "transparent",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    color: "#e2e8f0",
                                    padding: "9px 18px",
                                    borderRadius: "14px",
                                    fontWeight: "700",
                                    fontSize: "13px",
                                    cursor: "pointer"
                                }}
                            >
                                Log In
                            </button>
                            <button
                                className="card-btn"
                                onClick={() => navigate("/register")}
                                style={{ padding: "9px 20px", fontSize: "13px" }}
                            >
                                Get Started Free →
                            </button>
                        </>
                    )}
                </div>
            </nav>

            {/* 2. Hero Section */}
            <section style={{
                textAlign: "center",
                padding: "60px 20px 40px 20px",
                maxWidth: "960px",
                margin: "0 auto"
            }}>
                <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 16px",
                    borderRadius: "30px",
                    background: "rgba(168, 85, 247, 0.15)",
                    border: "1px solid rgba(168, 85, 247, 0.4)",
                    color: "#f3e8ff",
                    fontSize: "12.5px",
                    fontWeight: "800",
                    marginBottom: "20px"
                }}>
                    <span>💈 India's #1 Smart Salon & Stylist Booking Ecosystem</span>
                </div>

                <h1 style={{
                    fontSize: "clamp(34px, 6vw, 56px)",
                    fontWeight: "900",
                    lineHeight: "1.15",
                    margin: "0 0 20px 0",
                    letterSpacing: "-1px"
                }}>
                    Discover Elite Salons.<br />
                    <span style={{
                        background: "linear-gradient(90deg, #c084fc 0%, #ec4899 50%, #38bdf8 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent"
                    }}>
                        Book Top Stylists. Glow Everyday.
                    </span>
                </h1>

                <p style={{
                    fontSize: "17px",
                    color: "#cbd5e1",
                    maxWidth: "680px",
                    margin: "0 auto 32px auto",
                    lineHeight: "1.6"
                }}>
                    Experience seamless appointment booking with verified partner salons, transparent pricing, dedicated master stylists, and zero waiting time.
                </p>

                <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
                    <button
                        className="card-btn"
                        onClick={() => navigate("/salons")}
                        style={{ padding: "14px 30px", fontSize: "15.5px" }}
                    >
                        💇 Explore Salons & Book Now →
                    </button>
                    <button
                        onClick={() => navigate("/mobile")}
                        style={{
                            padding: "14px 26px",
                            borderRadius: "14px",
                            background: "linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(56, 189, 248, 0.25) 100%)",
                            border: "1px solid rgba(192, 132, 252, 0.5)",
                            color: "#ffffff",
                            fontWeight: "800",
                            fontSize: "15px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}
                    >
                        <span>📱</span> Try Mobile App Flow
                    </button>
                    <button
                        onClick={() => navigate("/register")}
                        style={{
                            padding: "14px 24px",
                            borderRadius: "14px",
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.18)",
                            color: "#cbd5e1",
                            fontWeight: "700",
                            fontSize: "14px",
                            cursor: "pointer"
                        }}
                    >
                        💈 Register Salon
                    </button>
                </div>

                {/* Hero Stats */}
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "36px",
                    marginTop: "48px",
                    flexWrap: "wrap",
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    paddingTop: "24px"
                }}>
                    <div>
                        <span style={{ fontSize: "28px", fontWeight: "900", color: "#34d399" }}>50+</span>
                        <p style={{ margin: "2px 0 0 0", color: "#94a3b8", fontSize: "12px" }}>Verified Salons</p>
                    </div>
                    <div>
                        <span style={{ fontSize: "28px", fontWeight: "900", color: "#c084fc" }}>10,000+</span>
                        <p style={{ margin: "2px 0 0 0", color: "#94a3b8", fontSize: "12px" }}>Bookings Handled</p>
                    </div>
                    <div>
                        <span style={{ fontSize: "28px", fontWeight: "900", color: "#38bdf8" }}>4.9 ★</span>
                        <p style={{ margin: "2px 0 0 0", color: "#94a3b8", fontSize: "12px" }}>Average Rating</p>
                    </div>
                    <div>
                        <span style={{ fontSize: "28px", fontWeight: "900", color: "#f472b6" }}>100%</span>
                        <p style={{ margin: "2px 0 0 0", color: "#94a3b8", fontSize: "12px" }}>Zero Overlap Guarantee</p>
                    </div>
                </div>
            </section>

            {/* 3. Features Section */}
            <section style={{ maxWidth: "1140px", margin: "40px auto", padding: "0 20px" }}>
                <div style={{ textAlign: "center", marginBottom: "36px" }}>
                    <h2 style={{ fontSize: "30px", fontWeight: "800" }}>Why Choose GlowSync?</h2>
                    <p style={{ color: "#94a3b8", fontSize: "15px" }}>Designed for both clients who value their time and salon owners seeking business growth.</p>
                </div>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "20px"
                }}>
                    <div style={{ background: "#1c1630", borderRadius: "22px", padding: "26px", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontSize: "32px", marginBottom: "14px" }}>🎯</div>
                        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>Cascading Smart Search & GPS</h3>
                        <p style={{ color: "#94a3b8", fontSize: "13.5px", lineHeight: "1.5" }}>
                            Filter salons by Country ➔ State ➔ District ➔ Area with instant live geolocation detection.
                        </p>
                    </div>

                    <div style={{ background: "#1c1630", borderRadius: "22px", padding: "26px", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontSize: "32px", marginBottom: "14px" }}>💈</div>
                        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>Choose Your Favorite Stylist</h3>
                        <p style={{ color: "#94a3b8", fontSize: "13.5px", lineHeight: "1.5" }}>
                            View stylist specialties, experience, and book directly with your trusted barber or beautician.
                        </p>
                    </div>

                    <div style={{ background: "#1c1630", borderRadius: "22px", padding: "26px", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontSize: "32px", marginBottom: "14px" }}>🛡️</div>
                        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>Double-Booking Guard</h3>
                        <p style={{ color: "#94a3b8", fontSize: "13.5px", lineHeight: "1.5" }}>
                            Our real-time backend engine locks open slots and tracks staff leaves to eliminate double-booking errors.
                        </p>
                    </div>
                </div>
            </section>

            {/* 4. Pricing / Partner Tiers */}
            <section style={{ maxWidth: "1080px", margin: "60px auto", padding: "0 20px" }}>
                <div style={{ textAlign: "center", marginBottom: "36px" }}>
                    <h2 style={{ fontSize: "30px", fontWeight: "800" }}>Partner With GlowSync</h2>
                    <p style={{ color: "#94a3b8", fontSize: "15px" }}>Choose the plan that fits your salon or beauty studio.</p>
                </div>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "20px"
                }}>
                    <div style={{ background: "#1c1630", borderRadius: "24px", padding: "28px", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <h3 style={{ margin: "0 0 4px 0", fontSize: "18px" }}>Starter Salon</h3>
                        <span style={{ color: "#34d399", fontSize: "28px", fontWeight: "900" }}>₹0</span>
                        <span style={{ color: "#64748b", fontSize: "13px" }}> / forever</span>
                        <ul style={{ color: "#cbd5e1", fontSize: "13.5px", lineHeight: "2", paddingLeft: "18px", marginTop: "16px" }}>
                            <li>Single Salon Branch</li>
                            <li>Up to 5 Stylists & Staff</li>
                            <li>Unlimited Customer Bookings</li>
                            <li>1-Click Online/Offline Toggle</li>
                        </ul>
                        <button className="card-btn" onClick={() => navigate("/register")} style={{ width: "100%", marginTop: "14px" }}>
                            Get Started Free
                        </button>
                    </div>

                    <div style={{ background: "linear-gradient(145deg, #2b1c4b 0%, #1e1538 100%)", borderRadius: "24px", padding: "28px", border: "1px solid rgba(192,132,252,0.4)", position: "relative" }}>
                        <span style={{ position: "absolute", top: "14px", right: "16px", background: "#ec4899", padding: "3px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: "800" }}>
                            MOST POPULAR
                        </span>
                        <h3 style={{ margin: "0 0 4px 0", fontSize: "18px" }}>Pro Salon Suite</h3>
                        <span style={{ color: "#c084fc", fontSize: "28px", fontWeight: "900" }}>₹999</span>
                        <span style={{ color: "#64748b", fontSize: "13px" }}> / month</span>
                        <ul style={{ color: "#cbd5e1", fontSize: "13.5px", lineHeight: "2", paddingLeft: "18px", marginTop: "16px" }}>
                            <li>Up to 3 Salon Branches</li>
                            <li>Unlimited Stylists & Leave Tracker</li>
                            <li>Verified Gold Partner Badge</li>
                            <li>Priority Discovery in Search</li>
                        </ul>
                        <button className="card-btn" onClick={() => navigate("/register")} style={{ width: "100%", marginTop: "14px" }}>
                            Start 14-Day Free Trial
                        </button>
                    </div>

                    <div style={{ background: "#1c1630", borderRadius: "24px", padding: "28px", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <h3 style={{ margin: "0 0 4px 0", fontSize: "18px" }}>Luxury Chain</h3>
                        <span style={{ color: "#38bdf8", fontSize: "28px", fontWeight: "900" }}>₹2,499</span>
                        <span style={{ color: "#64748b", fontSize: "13px" }}> / month</span>
                        <ul style={{ color: "#cbd5e1", fontSize: "13.5px", lineHeight: "2", paddingLeft: "18px", marginTop: "16px" }}>
                            <li>Unlimited Salon Branches</li>
                            <li>Dedicated Account Manager</li>
                            <li>Custom Branding & Hero Spotlight</li>
                            <li>API Access & Custom Analytics</li>
                        </ul>
                        <button className="card-btn" onClick={() => navigate("/register")} style={{ width: "100%", marginTop: "14px" }}>
                            Contact Enterprise Sales
                        </button>
                    </div>
                </div>
            </section>

            {/* 5. FAQs Accordion */}
            <section style={{ maxWidth: "800px", margin: "60px auto", padding: "0 20px" }}>
                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                    <h2 style={{ fontSize: "28px", fontWeight: "800" }}>Frequently Asked Questions</h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {faqs.map((faq, i) => (
                        <div
                            key={i}
                            onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                            style={{
                                background: "#1b152d",
                                borderRadius: "16px",
                                padding: "18px 22px",
                                border: "1px solid rgba(255,255,255,0.06)",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h4 style={{ margin: 0, fontSize: "15.5px", color: "#ffffff" }}>{faq.q}</h4>
                                <span style={{ color: "#c084fc", fontSize: "18px", fontWeight: "800" }}>
                                    {faqOpen === i ? "−" : "+"}
                                </span>
                            </div>
                            {faqOpen === i && (
                                <p style={{ margin: "12px 0 0 0", color: "#cbd5e1", fontSize: "13.5px", lineHeight: "1.6" }}>
                                    {faq.a}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* 6. Footer */}
            <footer style={{
                borderTop: "1px solid rgba(255,255,255,0.08)",
                padding: "32px 20px",
                textAlign: "center",
                color: "#64748b",
                fontSize: "13px",
                background: "#0c0817"
            }}>
                <p style={{ margin: "0 0 8px 0", color: "#cbd5e1" }}>
                    ✨ <strong>GlowSync</strong> — Next-Gen Salon & Beauty Booking Ecosystem
                </p>
                <p style={{ margin: 0 }}>
                    © {new Date().getFullYear()} GlowSync Inc. All rights reserved. Built with high performance FastAPI & React.
                </p>
            </footer>
        </div>
    );
}

export default LandingPage;
