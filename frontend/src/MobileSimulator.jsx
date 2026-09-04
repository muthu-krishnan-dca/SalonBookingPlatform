import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, setUser as setAuthUser, getToken } from "./auth";

const TIME_SLOTS = [
    "09:30 AM",
    "10:30 AM",
    "11:30 AM",
    "01:00 PM",
    "02:30 PM",
    "04:00 PM",
    "05:30 PM",
    "07:00 PM"
];

function MobileSimulator() {
    const navigate = useNavigate();
    const existingUser = getUser();

    // Device Frame State: "iphone" | "android" | "fullscreen"
    const [deviceType, setDeviceType] = useState("iphone");

    // Flow Step: "login" | "discover" | "service" | "stylist" | "datetime" | "confirm" | "manage"
    const [currentStep, setCurrentStep] = useState(existingUser ? "discover" : "login");

    // Auth Form State inside mobile
    const [loginEmail, setLoginEmail] = useState(existingUser?.email || "customer@glowsync.com");
    const [loginPass, setLoginPass] = useState("password123");
    const [currentUser, setCurrentUser] = useState(existingUser);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState("");

    // Booking Flow State
    const [salons, setSalons] = useState([]);
    const [selectedSalon, setSelectedSalon] = useState(null);
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split("T")[0];
    });
    const [selectedSlot, setSelectedSlot] = useState("10:30 AM");
    const [availabilityCheck, setAvailabilityCheck] = useState(null);
    const [checkingSlot, setCheckingSlot] = useState(false);

    // Bookings & Final Status
    const [confirmedBooking, setConfirmedBooking] = useState(null);
    const [myBookings, setMyBookings] = useState([]);
    const [bookingSubmitting, setBookingSubmitting] = useState(false);
    const [flowError, setFlowError] = useState("");

    // 1. Fetch Salons on mount
    useEffect(() => {
        fetch("http://127.0.0.1:8000/salons/")
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => {
                setSalons(data);
                if (data.length > 0 && !selectedSalon) {
                    setSelectedSalon(data[0]);
                }
            })
            .catch((err) => console.error("Mobile Salons fetch error:", err));
    }, []);

    // 2. Fetch Services & Staff when Salon changes
    useEffect(() => {
        if (selectedSalon?.id) {
            // Fetch Services
            fetch(`http://127.0.0.1:8000/services/salon/${selectedSalon.id}`)
                .then((res) => (res.ok ? res.json() : []))
                .then((srvs) => {
                    setServices(srvs);
                    if (srvs.length > 0) setSelectedService(srvs[0]);
                });

            // Fetch Staff
            fetch(`http://127.0.0.1:8000/staff/salon/${selectedSalon.id}`)
                .then((res) => (res.ok ? res.json() : []))
                .then((stf) => {
                    setStaffList(stf);
                    if (stf.length > 0) setSelectedStaff(stf[0]);
                });
        }
    }, [selectedSalon]);

    const [mobileBookedSlots, setMobileBookedSlots] = useState([]);

    // Fetch booked slots whenever selectedSalon, selectedStaff, or selectedDate changes
    useEffect(() => {
        if (selectedSalon?.id && selectedDate) {
            const staffParam = selectedStaff?.id ? `&staff_id=${selectedStaff.id}` : "";
            fetch(`http://127.0.0.1:8000/bookings/booked-slots?salon_id=${selectedSalon.id}&date=${selectedDate}${staffParam}`)
                .then((res) => (res.ok ? res.json() : { booked_slots: [] }))
                .then((data) => setMobileBookedSlots(data.booked_slots || []))
                .catch((err) => console.error("Mobile booked slots error:", err));
        } else {
            setMobileBookedSlots([]);
        }
    }, [selectedSalon, selectedStaff, selectedDate]);

    // 3. Live availability check when staff, date, or slot changes
    useEffect(() => {
        if (selectedDate && selectedSlot) {
            setCheckingSlot(true);
            const staffParam = selectedStaff?.id ? `&staff_id=${selectedStaff.id}` : "";
            fetch(`http://127.0.0.1:8000/bookings/booked-slots?salon_id=${selectedSalon.id}&date=${selectedDate}${staffParam}`)
                .then((res) => (res.ok ? res.json() : { booked_slots: [] }))
                .then((data) => {
                    const isBooked = (data.booked_slots || []).includes(selectedSlot);
                    if (isBooked) {
                        setAvailabilityCheck({
                            available: false,
                            reason: `Already another booked. This time slot (${selectedSlot}) is already booked. Please choose another time.`
                        });
                    } else if (selectedStaff?.id) {
                        fetch(`http://127.0.0.1:8000/staff/${selectedStaff.id}/check-availability?date=${selectedDate}&time=${encodeURIComponent(selectedSlot)}`)
                            .then((sRes) => sRes.json())
                            .then((sData) => setAvailabilityCheck(sData))
                            .catch(() => setAvailabilityCheck({ available: true, reason: "Stylist is available" }));
                    } else {
                        setAvailabilityCheck({ available: true, reason: "Time slot is available" });
                    }
                })
                .catch(() => setAvailabilityCheck({ available: true }))
                .finally(() => setCheckingSlot(false));
        }
    }, [selectedSalon, selectedStaff, selectedDate, selectedSlot]);

    // 4. Fetch My Bookings for customer
    const loadCustomerBookings = () => {
        const uid = currentUser?.user_id || currentUser?.id;
        if (uid) {
            fetch(`http://127.0.0.1:8000/bookings/customer/${uid}`)
                .then((res) => (res.ok ? res.json() : []))
                .then((bks) => setMyBookings(bks))
                .catch((err) => console.error("Bookings fetch error:", err));
        }
    };

    useEffect(() => {
        if (currentStep === "manage") {
            loadCustomerBookings();
        }
    }, [currentStep, currentUser]);

    // Handle Mobile Quick Login / Auth
    const handleMobileLogin = async (e) => {
        e?.preventDefault();
        setAuthError("");
        setAuthLoading(true);

        try {
            const res = await fetch("http://127.0.0.1:8000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: loginEmail.trim(), password: loginPass.trim() })
            });

            if (res.ok) {
                const data = await res.json();
                setCurrentUser(data);
                setAuthUser(data);
                setCurrentStep("discover");
            } else {
                // If account doesn't exist, create a demo customer instantly
                const regRes = await fetch("http://127.0.0.1:8000/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: "Alex Customer",
                        email: loginEmail.trim(),
                        password: loginPass.trim(),
                        role: "CUSTOMER",
                        phone: "9876543210"
                    })
                });

                if (regRes.ok) {
                    const loginRetry = await fetch("http://127.0.0.1:8000/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: loginEmail.trim(), password: loginPass.trim() })
                    });
                    const lData = await loginRetry.json();
                    setCurrentUser(lData);
                    setAuthUser(lData);
                    setCurrentStep("discover");
                } else {
                    setAuthError("Please check email/password or register a new customer account.");
                }
            }
        } catch (err) {
            setAuthError("Network error: " + err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    // Confirm & Execute Real Booking
    const handleConfirmBooking = async () => {
        if (!selectedSalon || !selectedService || !selectedStaff) {
            setFlowError("Please select salon, service, and stylist.");
            return;
        }

        const uid = currentUser?.user_id || currentUser?.id || 1;
        setBookingSubmitting(true);
        setFlowError("");

        try {
            const payload = {
                customer_id: uid,
                salon_id: selectedSalon.id,
                service_id: selectedService.id,
                staff_id: selectedStaff.id,
                booking_date: selectedDate,
                booking_time: selectedSlot,
                service: selectedService.name,
                price: selectedService.price,
                status: "PENDING"
            };

            const res = await fetch("http://127.0.0.1:8000/bookings/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const bk = await res.json();
                setConfirmedBooking(bk);
                setCurrentStep("manage");
                loadCustomerBookings();
            } else {
                const errData = await res.json();
                setFlowError(errData.detail || "Booking slot unavailable. Double booking conflict detected.");
            }
        } catch (err) {
            setFlowError("Server connection error: " + err.message);
        } finally {
            setBookingSubmitting(false);
        }
    };

    // Cancel appointment inside mobile app
    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm(`Cancel Appointment #${bookingId}?`)) return;
        try {
            const res = await fetch(`http://127.0.0.1:8000/bookings/${bookingId}/cancel`, {
                method: "PATCH"
            });
            if (res.ok) {
                loadCustomerBookings();
            }
        } catch (err) {
            alert("Error cancelling: " + err.message);
        }
    };

    const stepsList = [
        { id: "login", label: "1. Login", icon: "🔐" },
        { id: "discover", label: "2. Discover Salon", icon: "💈" },
        { id: "service", label: "3. Service", icon: "✨" },
        { id: "stylist", label: "4. Stylist", icon: "✂️" },
        { id: "datetime", label: "5. Date & Slot", icon: "📅" },
        { id: "confirm", label: "6. Book", icon: "💳" },
        { id: "manage", label: "7. Manage", icon: "📋" }
    ];

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(180deg, #090611 0%, #120c22 50%, #08050e 100%)",
            color: "#ffffff",
            padding: "24px 16px",
            fontFamily: "'Outfit', sans-serif"
        }}>
            {/* Top Bar / Header */}
            <header style={{
                maxWidth: "1100px",
                margin: "0 auto 24px auto",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                paddingBottom: "16px"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => navigate("/")}>
                    <span style={{ fontSize: "28px" }}>✨</span>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "900" }}>
                            GlowSync <span style={{ color: "#c084fc", fontSize: "14px", fontWeight: "700" }}>Mobile App Simulator</span>
                        </h2>
                        <span style={{ fontSize: "11px", color: "#38bdf8", fontWeight: "700" }}>
                            CUSTOMER FLOW: Login ➔ Discover ➔ Service ➔ Stylist ➔ Date/Time ➔ Book ➔ Manage
                        </span>
                    </div>
                </div>

                {/* Device Frame & Web Switchers */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                        display: "flex",
                        background: "rgba(255,255,255,0.06)",
                        padding: "4px",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.1)"
                    }}>
                        <button
                            onClick={() => setDeviceType("iphone")}
                            style={{
                                background: deviceType === "iphone" ? "#a855f7" : "transparent",
                                color: "#ffffff",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontWeight: "700",
                                fontSize: "12px",
                                cursor: "pointer"
                            }}
                        >
                            📱 iPhone 16 Pro
                        </button>
                        <button
                            onClick={() => setDeviceType("android")}
                            style={{
                                background: deviceType === "android" ? "#38bdf8" : "transparent",
                                color: "#ffffff",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontWeight: "700",
                                fontSize: "12px",
                                cursor: "pointer"
                            }}
                        >
                            🤖 Galaxy S24
                        </button>
                    </div>

                    <button
                        onClick={() => navigate("/")}
                        style={{
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.2)",
                            color: "#cbd5e1",
                            padding: "8px 16px",
                            borderRadius: "12px",
                            fontSize: "12.5px",
                            fontWeight: "700",
                            cursor: "pointer"
                        }}
                    >
                        🌐 Web Mode
                    </button>
                </div>
            </header>

            {/* Visual Step Progress Tracker (Requirement Highlight) */}
            <div style={{
                maxWidth: "960px",
                margin: "0 auto 28px auto",
                display: "flex",
                justifyContent: "space-between",
                gap: "8px",
                overflowX: "auto",
                padding: "8px 4px"
            }}>
                {stepsList.map((st, i) => {
                    const isActive = currentStep === st.id;
                    return (
                        <button
                            key={st.id}
                            onClick={() => setCurrentStep(st.id)}
                            style={{
                                flex: "1",
                                minWidth: "110px",
                                padding: "8px 10px",
                                borderRadius: "10px",
                                background: isActive ? "linear-gradient(135deg, #9333ea 0%, #ec4899 100%)" : "rgba(255,255,255,0.04)",
                                border: isActive ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
                                color: isActive ? "#ffffff" : "#94a3b8",
                                fontSize: "11px",
                                fontWeight: "800",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                textAlign: "center",
                                whiteSpace: "nowrap"
                            }}
                        >
                            <span>{st.icon}</span> {st.label}
                        </button>
                    );
                })}
            </div>

            {/* Central Phone Simulator Mockup */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", paddingBottom: "40px" }}>
                <div style={{
                    width: "390px",
                    height: "812px",
                    background: "#0f0a1d",
                    borderRadius: deviceType === "iphone" ? "54px" : "38px",
                    boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.85), 0 0 0 12px #272138, 0 0 0 14px rgba(255, 255, 255, 0.15)",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    border: "2px solid rgba(255,255,255,0.12)"
                }}>
                    {/* Status Bar */}
                    <div style={{
                        height: "44px",
                        padding: "0 24px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#ffffff",
                        zIndex: 10,
                        background: "rgba(15, 10, 29, 0.8)",
                        backdropFilter: "blur(10px)"
                    }}>
                        <span>9:41</span>
                        {/* Dynamic Island / Notch */}
                        <div style={{
                            width: deviceType === "iphone" ? "120px" : "14px",
                            height: deviceType === "iphone" ? "28px" : "14px",
                            background: "#000000",
                            borderRadius: deviceType === "iphone" ? "20px" : "50%",
                            margin: "0 auto"
                        }} />
                        <span style={{ fontSize: "11px" }}>5G • 100% 🔋</span>
                    </div>

                    {/* App Internal Viewport Container */}
                    <div style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "16px 16px 80px 16px",
                        position: "relative"
                    }}>
                        {flowError && (
                            <div style={{
                                background: "rgba(239, 68, 68, 0.2)",
                                border: "1px solid #ef4444",
                                color: "#fca5a5",
                                padding: "10px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                marginBottom: "14px"
                            }}>
                                ⚠️ {flowError}
                            </div>
                        )}

                        {/* ===================================================
                           SCREEN 1: LOGIN
                           =================================================== */}
                        {currentStep === "login" && (
                            <div>
                                <div style={{ textAlign: "center", padding: "30px 10px 20px 10px" }}>
                                    <span style={{ fontSize: "42px" }}>✨</span>
                                    <h3 style={{ margin: "10px 0 4px 0", fontSize: "22px", fontWeight: "900" }}>GlowSync Mobile</h3>
                                    <p style={{ color: "#94a3b8", fontSize: "12.5px", margin: 0 }}>Customer App Sign In</p>
                                </div>

                                <form onSubmit={handleMobileLogin} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div>
                                        <label style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700" }}>Email / Mobile</label>
                                        <input
                                            type="text"
                                            value={loginEmail}
                                            onChange={(e) => setLoginEmail(e.target.value)}
                                            style={{
                                                width: "100%",
                                                boxSizing: "border-box",
                                                padding: "12px",
                                                borderRadius: "12px",
                                                background: "#1c1530",
                                                border: "1px solid rgba(255,255,255,0.12)",
                                                color: "#ffffff",
                                                marginTop: "4px"
                                            }}
                                            placeholder="Enter email"
                                        />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700" }}>Password</label>
                                        <input
                                            type="password"
                                            value={loginPass}
                                            onChange={(e) => setLoginPass(e.target.value)}
                                            style={{
                                                width: "100%",
                                                boxSizing: "border-box",
                                                padding: "12px",
                                                borderRadius: "12px",
                                                background: "#1c1530",
                                                border: "1px solid rgba(255,255,255,0.12)",
                                                color: "#ffffff",
                                                marginTop: "4px"
                                            }}
                                            placeholder="Enter password"
                                        />
                                    </div>

                                    {authError && (
                                        <div style={{ color: "#f87171", fontSize: "11.5px" }}>{authError}</div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={authLoading}
                                        style={{
                                            background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
                                            border: "none",
                                            color: "#ffffff",
                                            padding: "13px",
                                            borderRadius: "14px",
                                            fontWeight: "800",
                                            fontSize: "14px",
                                            cursor: "pointer",
                                            marginTop: "10px"
                                        }}
                                    >
                                        {authLoading ? "Authenticating..." : "1-Click Customer Login →"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCurrentUser({ user_id: 1, name: "Guest Customer", role: "CUSTOMER" });
                                            setCurrentStep("discover");
                                        }}
                                        style={{
                                            background: "rgba(255,255,255,0.06)",
                                            border: "1px solid rgba(255,255,255,0.12)",
                                            color: "#cbd5e1",
                                            padding: "11px",
                                            borderRadius: "12px",
                                            fontSize: "12px",
                                            fontWeight: "700",
                                            cursor: "pointer"
                                        }}
                                    >
                                        ⚡ Continue as Guest Client
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* ===================================================
                           SCREEN 2: DISCOVER SALONS
                           =================================================== */}
                        {currentStep === "discover" && (
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#38bdf8", fontWeight: "800" }}>📍 NEARBY SALONS</span>
                                        <h3 style={{ margin: "2px 0 0 0", fontSize: "18px", fontWeight: "900" }}>Discover Top Salons</h3>
                                    </div>
                                    <span style={{ background: "#1e1633", padding: "4px 8px", borderRadius: "8px", fontSize: "11px", color: "#c084fc", fontWeight: "700" }}>
                                        {salons.length} Places
                                    </span>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {salons.map((s) => (
                                        <div
                                            key={s.id}
                                            onClick={() => {
                                                setSelectedSalon(s);
                                                setCurrentStep("service");
                                            }}
                                            style={{
                                                background: selectedSalon?.id === s.id ? "linear-gradient(135deg, #2b1a4a 0%, #1c1333 100%)" : "#171128",
                                                border: selectedSalon?.id === s.id ? "1.5px solid #c084fc" : "1px solid rgba(255,255,255,0.08)",
                                                borderRadius: "18px",
                                                padding: "14px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                <div>
                                                    <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "800" }}>💈 {s.name}</h4>
                                                    <p style={{ margin: 0, color: "#94a3b8", fontSize: "11.5px" }}>📍 {s.address}, {s.city}</p>
                                                </div>
                                                <span style={{ background: "rgba(52, 211, 153, 0.15)", color: "#34d399", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "800" }}>
                                                    ⭐ {s.rating || 4.9}
                                                </span>
                                            </div>

                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "11px", color: "#cbd5e1" }}>
                                                <span>⏰ {s.opening_time} - {s.closing_time}</span>
                                                <span style={{ color: "#c084fc", fontWeight: "800" }}>Select Services →</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ===================================================
                           SCREEN 3: SELECT SERVICE
                           =================================================== */}
                        {currentStep === "service" && (
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                                    <button onClick={() => setCurrentStep("discover")} style={{ background: "none", border: "none", color: "#c084fc", fontSize: "16px", cursor: "pointer" }}>←</button>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{selectedSalon?.name}</span>
                                        <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "900" }}>Select Service</h3>
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {services.map((srv) => {
                                        const isSelected = selectedService?.id === srv.id;
                                        return (
                                            <div
                                                key={srv.id}
                                                onClick={() => {
                                                    setSelectedService(srv);
                                                    setCurrentStep("stylist");
                                                }}
                                                style={{
                                                    background: isSelected ? "linear-gradient(135deg, #2b1a4a 0%, #1c1333 100%)" : "#171128",
                                                    border: isSelected ? "1.5px solid #a855f7" : "1px solid rgba(255,255,255,0.08)",
                                                    borderRadius: "16px",
                                                    padding: "14px",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <div>
                                                        <h4 style={{ margin: "0 0 2px 0", fontSize: "14px", fontWeight: "800" }}>✨ {srv.name}</h4>
                                                        <span style={{ fontSize: "11px", color: "#38bdf8", fontWeight: "700" }}>{srv.category} • ⏱️ {srv.duration_mins} mins</span>
                                                    </div>
                                                    <span style={{ fontSize: "16px", fontWeight: "900", color: "#34d399" }}>₹{srv.price}</span>
                                                </div>
                                                <p style={{ margin: "6px 0 0 0", color: "#94a3b8", fontSize: "11px" }}>{srv.description || "Expert styling treatment"}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ===================================================
                           SCREEN 4: SELECT STYLIST
                           =================================================== */}
                        {currentStep === "stylist" && (
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                                    <button onClick={() => setCurrentStep("service")} style={{ background: "none", border: "none", color: "#c084fc", fontSize: "16px", cursor: "pointer" }}>←</button>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{selectedService?.name}</span>
                                        <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "900" }}>Choose Stylist</h3>
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {staffList.map((st) => {
                                        const isSelected = selectedStaff?.id === st.id;
                                        return (
                                            <div
                                                key={st.id}
                                                onClick={() => {
                                                    setSelectedStaff(st);
                                                    setCurrentStep("datetime");
                                                }}
                                                style={{
                                                    background: isSelected ? "linear-gradient(135deg, #2b1a4a 0%, #1c1333 100%)" : "#171128",
                                                    border: isSelected ? "1.5px solid #ec4899" : "1px solid rgba(255,255,255,0.08)",
                                                    borderRadius: "16px",
                                                    padding: "14px",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "12px"
                                                }}
                                            >
                                                <div style={{
                                                    width: "44px",
                                                    height: "44px",
                                                    borderRadius: "50%",
                                                    background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "18px",
                                                    fontWeight: "800"
                                                }}>
                                                    {(st.name || "S")[0]}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: "0 0 2px 0", fontSize: "14px", fontWeight: "800" }}>{st.name}</h4>
                                                    <span style={{ fontSize: "11px", color: "#c084fc", fontWeight: "700" }}>✂️ {st.specialization}</span>
                                                    <div style={{ fontSize: "10.5px", color: "#94a3b8", marginTop: "2px" }}>{st.experience_years} yrs exp • 📞 {st.phone || "On file"}</div>
                                                </div>
                                                <span style={{ color: "#ec4899", fontSize: "14px" }}>➔</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ===================================================
                           SCREEN 5: SELECT DATE & TIME SLOT
                           =================================================== */}
                        {currentStep === "datetime" && (
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                                    <button onClick={() => setCurrentStep("stylist")} style={{ background: "none", border: "none", color: "#c084fc", fontSize: "16px", cursor: "pointer" }}>←</button>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>Stylist: {selectedStaff?.name}</span>
                                        <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "900" }}>Select Date & Slot</h3>
                                    </div>
                                </div>

                                <div style={{ marginBottom: "14px" }}>
                                    <label style={{ fontSize: "11.5px", color: "#cbd5e1", fontWeight: "700" }}>📅 Appointment Date</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "10px",
                                            borderRadius: "12px",
                                            background: "#1c1530",
                                            border: "1px solid rgba(255,255,255,0.12)",
                                            color: "#ffffff",
                                            marginTop: "6px"
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: "11.5px", color: "#cbd5e1", fontWeight: "700" }}>⏰ Available Time Slots</label>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginTop: "8px" }}>
                                        {TIME_SLOTS.map((slot) => {
                                            const isSelected = selectedSlot === slot;
                                            const isBooked = mobileBookedSlots.includes(slot);
                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    disabled={isBooked}
                                                    onClick={() => {
                                                        if (!isBooked) setSelectedSlot(slot);
                                                    }}
                                                    style={{
                                                        padding: "10px",
                                                        borderRadius: "12px",
                                                        background: isBooked
                                                            ? "rgba(239, 68, 68, 0.08)"
                                                            : isSelected
                                                            ? "linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)"
                                                            : "#171128",
                                                        border: isBooked
                                                            ? "1px solid rgba(239, 68, 68, 0.3)"
                                                            : isSelected
                                                            ? "1.5px solid #38bdf8"
                                                            : "1px solid rgba(255,255,255,0.08)",
                                                        color: isBooked ? "#fca5a5" : "#ffffff",
                                                        fontWeight: "700",
                                                        fontSize: "12px",
                                                        cursor: isBooked ? "not-allowed" : "pointer",
                                                        opacity: isBooked ? 0.45 : 1
                                                    }}
                                                    title={isBooked ? "Already another booked" : `Select ${slot}`}
                                                >
                                                    {isBooked ? `⛔ ${slot}` : slot}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Live Slot Availability Indicator */}
                                <div style={{
                                    marginTop: "16px",
                                    padding: "10px",
                                    borderRadius: "12px",
                                    background: availabilityCheck?.available === false ? "rgba(239, 68, 68, 0.15)" : "rgba(52, 211, 153, 0.15)",
                                    border: availabilityCheck?.available === false ? "1px solid #ef4444" : "1px solid #34d399",
                                    fontSize: "11.5px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px"
                                }}>
                                    <span>{availabilityCheck?.available === false ? "❌" : "✅"}</span>
                                    <span>
                                        {checkingSlot ? "Verifying stylist schedule..." : availabilityCheck?.reason || "Slot is open and ready to book!"}
                                    </span>
                                </div>

                                <button
                                    onClick={() => setCurrentStep("confirm")}
                                    disabled={availabilityCheck?.available === false}
                                    style={{
                                        width: "100%",
                                        marginTop: "18px",
                                        background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
                                        border: "none",
                                        color: "#ffffff",
                                        padding: "13px",
                                        borderRadius: "14px",
                                        fontWeight: "800",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                        opacity: availabilityCheck?.available === false ? 0.5 : 1
                                    }}
                                >
                                    Proceed to Confirmation →
                                </button>
                            </div>
                        )}

                        {/* ===================================================
                           SCREEN 6: BOOK / CONFIRMATION
                           =================================================== */}
                        {currentStep === "confirm" && (
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                                    <button onClick={() => setCurrentStep("datetime")} style={{ background: "none", border: "none", color: "#c084fc", fontSize: "16px", cursor: "pointer" }}>←</button>
                                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "900" }}>Review & Book</h3>
                                </div>

                                <div style={{ background: "#1c1432", borderRadius: "18px", padding: "16px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "14px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px", marginBottom: "10px" }}>
                                        <span style={{ color: "#94a3b8", fontSize: "12px" }}>Salon</span>
                                        <strong style={{ fontSize: "13px" }}>💈 {selectedSalon?.name}</strong>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px", marginBottom: "10px" }}>
                                        <span style={{ color: "#94a3b8", fontSize: "12px" }}>Service</span>
                                        <strong style={{ fontSize: "13px" }}>✨ {selectedService?.name}</strong>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px", marginBottom: "10px" }}>
                                        <span style={{ color: "#94a3b8", fontSize: "12px" }}>Dedicated Stylist</span>
                                        <strong style={{ fontSize: "13px" }}>✂️ {selectedStaff?.name}</strong>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px", marginBottom: "10px" }}>
                                        <span style={{ color: "#94a3b8", fontSize: "12px" }}>Date & Slot</span>
                                        <strong style={{ fontSize: "13px" }}>📅 {selectedDate} @ {selectedSlot}</strong>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "4px" }}>
                                        <span style={{ color: "#ffffff", fontSize: "14px", fontWeight: "800" }}>Total Amount</span>
                                        <span style={{ color: "#34d399", fontSize: "18px", fontWeight: "900" }}>₹{selectedService?.price}</span>
                                    </div>
                                </div>

                                {flowError && (
                                    <div style={{
                                        background: "rgba(239, 68, 68, 0.15)",
                                        border: "1px solid #ef4444",
                                        borderRadius: "12px",
                                        padding: "12px",
                                        color: "#fca5a5",
                                        fontSize: "12px",
                                        marginBottom: "14px",
                                        lineHeight: "1.4"
                                    }}>
                                        ⚠️ {flowError}
                                    </div>
                                )}

                                <button
                                    onClick={handleConfirmBooking}
                                    disabled={bookingSubmitting}
                                    style={{
                                        width: "100%",
                                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                        border: "none",
                                        color: "#ffffff",
                                        padding: "14px",
                                        borderRadius: "14px",
                                        fontWeight: "900",
                                        fontSize: "15px",
                                        cursor: "pointer",
                                        boxShadow: "0 4px 20px rgba(16, 185, 129, 0.4)"
                                    }}
                                >
                                    {bookingSubmitting ? "Locking Slot..." : "⚡ Confirm Booking Now"}
                                </button>
                            </div>
                        )}

                        {/* ===================================================
                           SCREEN 7: MANAGE BOOKINGS
                           =================================================== */}
                        {currentStep === "manage" && (
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "900" }}>My Appointments</h3>
                                    <button
                                        onClick={() => setCurrentStep("discover")}
                                        style={{ background: "#a855f7", border: "none", color: "#fff", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                                    >
                                        + Book New
                                    </button>
                                </div>

                                {confirmedBooking && (
                                    <div style={{
                                        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)",
                                        border: "1px solid #10b981",
                                        borderRadius: "16px",
                                        padding: "14px",
                                        marginBottom: "14px",
                                        textAlign: "center"
                                    }}>
                                        <span style={{ fontSize: "28px" }}>🎉</span>
                                        <h4 style={{ margin: "4px 0", fontSize: "15px", color: "#34d399" }}>Booking Confirmed!</h4>
                                        <p style={{ margin: 0, fontSize: "11.5px", color: "#cbd5e1" }}>Appointment ID #{confirmedBooking.id} is registered with zero-overlap guarantee.</p>
                                    </div>
                                )}

                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {myBookings.length === 0 ? (
                                        <p style={{ color: "#94a3b8", textAlign: "center", padding: "30px 10px", fontSize: "12.5px" }}>No active bookings found.</p>
                                    ) : (
                                        myBookings.map((b) => (
                                            <div
                                                key={b.id}
                                                style={{
                                                    background: "#19122c",
                                                    borderRadius: "16px",
                                                    padding: "12px",
                                                    border: "1px solid rgba(255,255,255,0.08)"
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#c084fc" }}>Appt #{b.id}</span>
                                                    <span style={{
                                                        padding: "2px 8px",
                                                        borderRadius: "6px",
                                                        fontSize: "10.5px",
                                                        fontWeight: "800",
                                                        background: b.status === "CONFIRMED" ? "rgba(52, 211, 153, 0.2)" : b.status === "CANCELLED" ? "rgba(239, 68, 68, 0.2)" : "rgba(251, 191, 36, 0.2)",
                                                        color: b.status === "CONFIRMED" ? "#34d399" : b.status === "CANCELLED" ? "#fca5a5" : "#fbbf24"
                                                    }}>
                                                        {b.status}
                                                    </span>
                                                </div>

                                                <div style={{ fontSize: "13.5px", fontWeight: "800", marginBottom: "2px" }}>✂️ {b.service}</div>
                                                <div style={{ fontSize: "11px", color: "#94a3b8" }}>📅 {b.booking_date} • ⏰ {b.booking_time}</div>
                                                <div style={{ fontSize: "11px", color: "#34d399", fontWeight: "700", marginTop: "4px" }}>₹{b.price || 0}</div>

                                                {b.status !== "CANCELLED" && (
                                                    <button
                                                        onClick={() => handleCancelBooking(b.id)}
                                                        style={{
                                                            marginTop: "8px",
                                                            width: "100%",
                                                            background: "rgba(239, 68, 68, 0.15)",
                                                            border: "1px solid rgba(239, 68, 68, 0.4)",
                                                            color: "#fca5a5",
                                                            padding: "6px",
                                                            borderRadius: "8px",
                                                            fontSize: "11px",
                                                            fontWeight: "700",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        Cancel Appointment
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Instagram-Style Bottom Navigation inside Mobile Device Frame */}
                    <div style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "56px",
                        background: "rgba(18, 12, 34, 0.95)",
                        backdropFilter: "blur(12px)",
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                        display: "flex",
                        justifyContent: "space-around",
                        alignItems: "center",
                        padding: "0 10px",
                        zIndex: 20
                    }}>
                        <button
                            onClick={() => setCurrentStep("discover")}
                            style={{ background: "none", border: "none", color: currentStep === "discover" ? "#c084fc" : "#94a3b8", fontSize: "10px", fontWeight: "700", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}
                        >
                            <span style={{ fontSize: "18px" }}>🏠</span>
                            <span>Home</span>
                        </button>
                        <button
                            onClick={() => setCurrentStep("discover")}
                            style={{ background: "none", border: "none", color: currentStep === "service" || currentStep === "stylist" ? "#c084fc" : "#94a3b8", fontSize: "10px", fontWeight: "700", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}
                        >
                            <span style={{ fontSize: "18px" }}>💈</span>
                            <span>Salons</span>
                        </button>
                        <button
                            onClick={() => setCurrentStep("manage")}
                            style={{ background: "none", border: "none", color: currentStep === "manage" ? "#c084fc" : "#94a3b8", fontSize: "10px", fontWeight: "700", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}
                        >
                            <span style={{ fontSize: "18px" }}>📅</span>
                            <span>Bookings</span>
                        </button>
                        <button
                            onClick={() => setCurrentStep("login")}
                            style={{ background: "none", border: "none", color: currentStep === "login" ? "#c084fc" : "#94a3b8", fontSize: "10px", fontWeight: "700", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}
                        >
                            <span style={{ fontSize: "18px" }}>👤</span>
                            <span>Profile</span>
                        </button>
                    </div>

                    {/* Bottom Home Indicator Bar */}
                    <div style={{
                        position: "absolute",
                        bottom: "6px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "134px",
                        height: "4px",
                        background: "rgba(255,255,255,0.4)",
                        borderRadius: "2px",
                        zIndex: 30
                    }} />
                </div>
            </div>
        </div>
    );
}

export default MobileSimulator;
