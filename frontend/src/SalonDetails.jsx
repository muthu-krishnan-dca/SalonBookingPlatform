import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUser } from "./auth";

function SalonDetails() {
    const { salon_id } = useParams();
    const navigate = useNavigate();
    const currentUser = getUser();

    const [salon, setSalon] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`http://127.0.0.1:8000/salons/${salon_id}`)
            .then((response) => {
                if (!response.ok) throw new Error("Salon not found");
                return response.json();
            })
            .then((data) => {
                setSalon(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error:", error);
                setLoading(false);
            });
    }, [salon_id]);

    const parseServices = (desc) => {
        if (!desc) {
            return [
                { name: "Haircut & Styling", desc: "Expert cut and blow dry" },
                { name: "Beard Trim & Grooming", desc: "Precision beard shaping & wash" },
                { name: "Hair Spa & Conditioning", desc: "Deep nourishing hair therapy" },
                { name: "Facial & Skin Care", desc: "Rejuvenating organic facial" },
                { name: "Hair Coloring", desc: "Global color and highlights" },
            ];
        }
        return desc.split(/[,•|\n]+/).map((s) => ({
            name: s.trim(),
            desc: "Professional salon care & styling",
        })).filter((item) => item.name);
    };

    if (loading) {
        return (
            <div className="salons-page" style={{ textAlign: "center", paddingTop: "80px" }}>
                <h2>Loading salon details...</h2>
            </div>
        );
    }

    if (!salon) {
        return (
            <div className="salons-page" style={{ textAlign: "center", paddingTop: "80px" }}>
                <h2>Salon not found</h2>
                <button className="nav-btn" onClick={() => navigate("/salons")}>
                    ← Back to Salons
                </button>
            </div>
        );
    }

    const services = parseServices(salon.description);

    return (
        <div className="salons-page">
            <div className="page-header salons-header">
                <div>
                    <h1>Salon Booking System</h1>
                    <h2>💈 {salon.name}</h2>
                </div>
                <div className="header-actions">
                    <button className="nav-btn" onClick={() => navigate("/salons")}>
                        ← All Salons
                    </button>
                    <button className="nav-btn" onClick={() => navigate("/bookings")}>
                        📅 My Bookings
                    </button>
                </div>
            </div>

            <div className="salon-shop-container">
                {/* Main Salon Details Card */}
                <div className="salon-shop-hero-card">
                    <div className="shop-hero-top">
                        <div>
                            <span className="card-badge">Verified Partner Salon</span>
                            <h2 className="shop-title">💇 {salon.name}</h2>
                            <p className="shop-location-text">
                                📍 <strong>Address:</strong> {salon.address}, {salon.city}
                            </p>
                        </div>
                        <button
                            className={`card-btn shop-book-btn ${salon.is_open === false ? "disabled-btn" : ""}`}
                            onClick={() => {
                                if (salon.is_open === false) {
                                    alert("This salon has temporarily paused online bookings. Please check back during operating hours.");
                                } else {
                                    navigate(`/book/${salon.id}`);
                                }
                            }}
                            style={{
                                background: salon.is_open === false ? "#4b5563" : undefined,
                                cursor: salon.is_open === false ? "not-allowed" : "pointer",
                                opacity: salon.is_open === false ? 0.75 : 1
                            }}
                        >
                            {salon.is_open === false ? "🔴 Closed for Online Bookings" : "📅 Book Appointment Now →"}
                        </button>
                    </div>

                    {salon.is_open === false && (
                        <div className="alert error" style={{ margin: "14px 0 0 0" }}>
                            ⏸️ <strong>Online Bookings Paused:</strong> The owner has temporarily stopped accepting new appointments for today. You can still view salon services and operating hours below.
                        </div>
                    )}

                    <div className="shop-info-grid">
                        <div className="shop-info-item">
                            <span className="info-icon">📞</span>
                            <div>
                                <span className="info-label">Contact Phone</span>
                                <span className="info-val">{salon.phone || "Available on request"}</span>
                            </div>
                        </div>

                        <div className="shop-info-item">
                            <span className="info-icon">⏰</span>
                            <div>
                                <span className="info-label">Working Hours</span>
                                <span className="info-val">{salon.opening_time || "09:00 AM"} – {salon.closing_time || "09:00 PM"}</span>
                            </div>
                        </div>

                        <div className="shop-info-item">
                            <span className="info-icon">📍</span>
                            <div>
                                <span className="info-label">City / Region</span>
                                <span className="info-val">{salon.city}</span>
                            </div>
                        </div>

                        <div className="shop-info-item">
                            <span className="info-icon">✨</span>
                            <div>
                                <span className="info-label">Operating Status</span>
                                <span
                                    className="info-val"
                                    style={{
                                        color: salon.is_open === false ? "#f87171" : "#10b981",
                                        fontWeight: 700
                                    }}
                                >
                                    {salon.is_open === false ? "🔴 Closed / Offline" : "🟢 Open & Accepting Bookings"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Offered Services Menu */}
                    <div className="shop-services-section">
                        <h3>✂️ Services & Treatments</h3>
                        <p className="section-sub">Choose any service to book your personalized styling slot:</p>

                        <div className="shop-services-grid">
                            {services.map((svc, i) => (
                                <div className="service-card" key={i}>
                                    <div className="service-card-info">
                                        <h4>✨ {svc.name}</h4>
                                        <p>{svc.desc}</p>
                                    </div>
                                    <button
                                        className="service-book-btn"
                                        disabled={salon.is_open === false}
                                        onClick={() =>
                                            navigate(
                                                `/book/${salon.id}?service=${encodeURIComponent(
                                                    svc.name
                                                )}`
                                            )
                                        }
                                        style={{
                                            opacity: salon.is_open === false ? 0.6 : 1,
                                            cursor: salon.is_open === false ? "not-allowed" : "pointer"
                                        }}
                                    >
                                        {salon.is_open === false ? "Closed" : "Book Service →"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SalonDetails;