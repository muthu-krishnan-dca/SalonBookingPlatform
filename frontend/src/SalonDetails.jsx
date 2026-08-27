import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUser } from "./auth";

function SalonDetails() {
    const { salon_id } = useParams();
    const navigate = useNavigate();
    const currentUser = getUser();

    const [salon, setSalon] = useState(null);
    const [services, setServices] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [activeSection, setActiveSection] = useState("services"); // services, stylists, reviews
    const [loading, setLoading] = useState(true);

    // Review Modal
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewMsg, setReviewMsg] = useState("");

    const loadAllDetails = async () => {
        try {
            setLoading(true);

            // 1. Salon
            const salonRes = await fetch(`http://127.0.0.1:8000/salons/${salon_id}`);
            if (!salonRes.ok) throw new Error("Salon not found");
            const salonData = await salonRes.json();
            setSalon(salonData);

            // 2. Services
            const srvRes = await fetch(`http://127.0.0.1:8000/services/salon/${salon_id}`);
            if (srvRes.ok) setServices(await srvRes.json());

            // 3. Staff
            const staffRes = await fetch(`http://127.0.0.1:8000/staff/salon/${salon_id}`);
            if (staffRes.ok) setStaffList(await staffRes.json());

            // 4. Reviews
            const revRes = await fetch(`http://127.0.0.1:8000/reviews/salon/${salon_id}`);
            if (revRes.ok) setReviews(await revRes.json());
        } catch (err) {
            console.error("Error loading salon details:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllDetails();
    }, [salon_id]);

    const handleOpenReview = () => {
        if (!currentUser) {
            alert("Please log in to submit a review.");
            navigate("/login");
            return;
        }
        setIsReviewModalOpen(true);
        setReviewMsg("");
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            setSubmittingReview(true);
            const res = await fetch("http://127.0.0.1:8000/reviews/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer_id: currentUser.user_id,
                    salon_id: parseInt(salon_id, 10),
                    rating: parseInt(reviewRating, 10),
                    comment: reviewComment.trim()
                })
            });
            if (!res.ok) throw new Error("Failed to submit review");
            setReviewMsg("Thank you! Your review has been published ⭐");
            setReviewComment("");
            setTimeout(() => {
                setIsReviewModalOpen(false);
                loadAllDetails();
            }, 1200);
        } catch (err) {
            setReviewMsg("Error: " + err.message);
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) {
        return (
            <div className="salons-page" style={{ textAlign: "center", paddingTop: "80px" }}>
                <div className="spinner"></div>
                <h2>Loading salon & stylist details...</h2>
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

    return (
        <div className="salons-page">
            <div className="page-header salons-header">
                <div>
                    <h1>Salon Booking Platform</h1>
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
                {/* Main Salon Hero Card */}
                <div className="salon-shop-hero-card">
                    <div className="shop-hero-top">
                        <div>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                                <span className="card-badge" style={{ position: "static" }}>
                                    {salon.is_verified ? "✅ Verified Partner Salon" : "💈 Partner Salon"}
                                </span>
                                <span style={{ color: "#fbbf24", fontWeight: "800", fontSize: "14px" }}>
                                    ⭐ {salon.rating || 4.9} ({reviews.length} reviews)
                                </span>
                            </div>

                            <h2 className="shop-title">💇 {salon.name}</h2>
                            <p className="shop-location-text">
                                📍 <strong>Address:</strong> {salon.address}, {salon.city}
                            </p>
                        </div>

                        <button
                            className={`card-btn shop-book-btn ${salon.is_open === false ? "disabled-btn" : ""}`}
                            onClick={() => {
                                if (salon.is_open === false) {
                                    alert("This salon has temporarily paused online bookings.");
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

                    {/* Section Switcher Tabs */}
                    <div style={{
                        display: "flex",
                        gap: "10px",
                        margin: "25px 0 15px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                        paddingBottom: "12px",
                        overflowX: "auto"
                    }}>
                        <button
                            onClick={() => setActiveSection("services")}
                            style={{
                                padding: "8px 18px",
                                borderRadius: "12px",
                                background: activeSection === "services" ? "linear-gradient(145deg, #7c3aed 0%, #6366f1 100%)" : "transparent",
                                border: "1px solid " + (activeSection === "services" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"),
                                color: activeSection === "services" ? "#ffffff" : "#94a3b8",
                                fontWeight: "800",
                                fontSize: "13.5px",
                                cursor: "pointer"
                            }}
                        >
                            ✨ Services & Menu ({services.length})
                        </button>

                        <button
                            onClick={() => setActiveSection("stylists")}
                            style={{
                                padding: "8px 18px",
                                borderRadius: "12px",
                                background: activeSection === "stylists" ? "linear-gradient(145deg, #7c3aed 0%, #6366f1 100%)" : "transparent",
                                border: "1px solid " + (activeSection === "stylists" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"),
                                color: activeSection === "stylists" ? "#ffffff" : "#94a3b8",
                                fontWeight: "800",
                                fontSize: "13.5px",
                                cursor: "pointer"
                            }}
                        >
                            💈 Our Stylists & Team ({staffList.length})
                        </button>

                        <button
                            onClick={() => setActiveSection("reviews")}
                            style={{
                                padding: "8px 18px",
                                borderRadius: "12px",
                                background: activeSection === "reviews" ? "linear-gradient(145deg, #7c3aed 0%, #6366f1 100%)" : "transparent",
                                border: "1px solid " + (activeSection === "reviews" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"),
                                color: activeSection === "reviews" ? "#ffffff" : "#94a3b8",
                                fontWeight: "800",
                                fontSize: "13.5px",
                                cursor: "pointer"
                            }}
                        >
                            ⭐ Customer Reviews ({reviews.length})
                        </button>
                    </div>

                    {/* SECTION 1: Services Catalog */}
                    {activeSection === "services" && (
                        <div className="shop-services-section">
                            <div className="shop-services-grid">
                                {services.map((svc) => (
                                    <div className="service-card" key={svc.id} style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        gap: "12px"
                                    }}>
                                        <div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                                <span style={{ fontSize: "11px", fontWeight: "800", color: "#c084fc", background: "rgba(168,85,247,0.2)", padding: "2px 8px", borderRadius: "6px" }}>
                                                    {svc.category || "Hair"}
                                                </span>
                                                <span style={{ fontSize: "17px", fontWeight: "800", color: "#34d399" }}>
                                                    ₹{svc.price}
                                                </span>
                                            </div>
                                            <h4 style={{ margin: "0 0 4px 0", color: "#ffffff", fontSize: "16px" }}>✨ {svc.name}</h4>
                                            <p style={{ margin: "0 0 8px 0", color: "#cbd5e1", fontSize: "13px" }}>{svc.description || "Expert treatment & care."}</p>
                                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>⏱️ Duration: {svc.duration_mins || 30} mins</span>
                                        </div>

                                        <button
                                            className="service-book-btn"
                                            disabled={salon.is_open === false}
                                            onClick={() =>
                                                navigate(
                                                    `/book/${salon.id}?service_id=${svc.id}&service=${encodeURIComponent(
                                                        svc.name
                                                    )}&price=${svc.price}`
                                                )
                                            }
                                            style={{
                                                opacity: salon.is_open === false ? 0.6 : 1,
                                                cursor: salon.is_open === false ? "not-allowed" : "pointer",
                                                marginTop: "8px"
                                            }}
                                        >
                                            {salon.is_open === false ? "Closed" : "Book Service →"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECTION 2: Stylists & Team */}
                    {activeSection === "stylists" && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                            {staffList.map((st) => (
                                <div key={st.id} style={{
                                    background: "#1e1833",
                                    borderRadius: "20px",
                                    padding: "20px",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    gap: "14px",
                                    boxShadow: "0 6px 16px rgba(0,0,0,0.5)"
                                }}>
                                    <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                                        <div style={{
                                            width: "50px",
                                            height: "50px",
                                            borderRadius: "50%",
                                            background: "linear-gradient(145deg, #a855f7 0%, #ec4899 100%)",
                                            color: "#ffffff",
                                            fontSize: "20px",
                                            fontWeight: "800",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}>
                                            {st.name[0]?.toUpperCase() || "S"}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: "0 0 2px 0", color: "#ffffff", fontSize: "16px" }}>{st.name}</h4>
                                            <span style={{ color: "#c084fc", fontSize: "12px", fontWeight: "700" }}>{st.specialization}</span>
                                        </div>
                                    </div>

                                    <div style={{ background: "#161126", borderRadius: "12px", padding: "8px 12px", fontSize: "12px", color: "#cbd5e1", display: "flex", justifyContent: "space-between" }}>
                                        <span>🌟 {st.experience_years || 3}+ Yrs Exp</span>
                                        <span style={{ color: st.is_available ? "#34d399" : "#f87171", fontWeight: "700" }}>
                                            {st.is_available ? "🟢 On Duty" : "🔴 Off Duty"}
                                        </span>
                                    </div>

                                    <button
                                        className="card-btn"
                                        disabled={salon.is_open === false || !st.is_available}
                                        onClick={() => navigate(`/book/${salon.id}?staff_id=${st.id}&staff_name=${encodeURIComponent(st.name)}`)}
                                        style={{
                                            padding: "8px 16px",
                                            fontSize: "13px",
                                            width: "100%",
                                            opacity: salon.is_open === false || !st.is_available ? 0.6 : 1
                                        }}
                                    >
                                        ✂️ Book with {st.name} →
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* SECTION 3: Reviews */}
                    {activeSection === "reviews" && (
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                                <h3>⭐ Verified Customer Ratings</h3>
                                <button
                                    className="card-btn"
                                    onClick={handleOpenReview}
                                    style={{ width: "auto", padding: "8px 18px", fontSize: "13px" }}
                                >
                                    ✍️ Leave a Review
                                </button>
                            </div>

                            {reviews.length === 0 ? (
                                <p style={{ color: "#94a3b8" }}>No reviews yet. Be the first to share your experience!</p>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {reviews.map((r) => (
                                        <div key={r.id} style={{
                                            background: "#1c1630",
                                            borderRadius: "16px",
                                            padding: "16px 20px",
                                            border: "1px solid rgba(255,255,255,0.06)"
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                                <span style={{ color: "#fbbf24", fontWeight: "800" }}>
                                                    {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                                                </span>
                                                <span style={{ color: "#64748b", fontSize: "12px" }}>Customer #{r.customer_id}</span>
                                            </div>
                                            <p style={{ margin: 0, color: "#e2e8f0", fontSize: "13.5px" }}>"{r.comment || "Great styling and very professional staff!"}"</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Leave Review Modal */}
            {isReviewModalOpen && (
                <div className="modal-backdrop" style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.75)",
                    backdropFilter: "blur(6px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 200,
                    padding: "16px"
                }}>
                    <div className="modal-card" style={{
                        background: "#1e1833",
                        borderRadius: "24px",
                        padding: "28px",
                        maxWidth: "460px",
                        width: "100%",
                        border: "1px solid rgba(192,132,252,0.3)"
                    }}>
                        <h3 style={{ margin: "0 0 12px 0", color: "#ffffff" }}>⭐ Review {salon.name}</h3>

                        {reviewMsg && <div className="alert success" style={{ marginBottom: "14px" }}>{reviewMsg}</div>}

                        <form onSubmit={handleSubmitReview}>
                            <div className="form-group" style={{ marginBottom: "14px" }}>
                                <label style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: "700" }}>Star Rating</label>
                                <select
                                    className="form-input"
                                    value={reviewRating}
                                    onChange={(e) => setReviewRating(e.target.value)}
                                >
                                    <option value="5">★★★★★ (5 Stars - Outstanding)</option>
                                    <option value="4">★★★★☆ (4 Stars - Very Good)</option>
                                    <option value="3">★★★☆☆ (3 Stars - Good)</option>
                                    <option value="2">★★☆☆☆ (2 Stars - Fair)</option>
                                    <option value="1">★☆☆☆☆ (1 Star - Poor)</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: "20px" }}>
                                <label style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: "700" }}>Your Experience / Feedback</label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    placeholder="Tell others about the hygiene, stylist skill, ambience..."
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    type="button"
                                    onClick={() => setIsReviewModalOpen(false)}
                                    style={{
                                        padding: "10px 18px",
                                        borderRadius: "12px",
                                        background: "rgba(255,255,255,0.06)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        color: "#cbd5e1",
                                        cursor: "pointer"
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={submittingReview}
                                    style={{ width: "auto", padding: "10px 24px" }}
                                >
                                    {submittingReview ? "Submitting..." : "Post Review ⭐"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SalonDetails;