import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "./auth";
import OwnerNavbar from "./OwnerNavbar";

function OwnerSalon() {
    const navigate = useNavigate();
    const currentUser = getUser();

    const [salons, setSalons] = useState([]);
    const [selectedSalonId, setSelectedSalonId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Form state for creating or editing salon branch
    const [isEditing, setIsEditing] = useState(false);
    const [editingSalonId, setEditingSalonId] = useState(null); // null = Add new branch, number = edit existing
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [phone, setPhone] = useState("");
    const [isOpen, setIsOpen] = useState(true);
    const [openingTime, setOpeningTime] = useState("09:00 AM");
    const [closingTime, setClosingTime] = useState("09:00 PM");
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [detectingLocation, setDetectingLocation] = useState(false);
    const [locationSuccess, setLocationSuccess] = useState("");
    const [locationError, setLocationError] = useState("");
    const [deletingId, setDeletingId] = useState(null);
    const [statusToggling, setStatusToggling] = useState(false);

    const fetchOwnerSalons = async () => {
        if (!currentUser || !currentUser.user_id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");
            const res = await fetch(`http://127.0.0.1:8000/salons/owner/${currentUser.user_id}/all`);
            if (res.ok) {
                const data = await res.json();
                setSalons(data);
                if (data.length > 0) {
                    if (!selectedSalonId || !data.some((s) => s.id === selectedSalonId)) {
                        setSelectedSalonId(data[0].id);
                    }
                } else {
                    setSelectedSalonId(null);
                }
            } else {
                setError("Failed to load salon branches.");
            }
        } catch (err) {
            console.error("Fetch salon error:", err);
            setError("Server connection error while fetching your salon branches.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOwnerSalons();
    }, []);

    // Open form for adding a new branch
    const handleAddNewBranch = () => {
        setEditingSalonId(null);
        setName(salons.length > 0 ? `${salons[0].name} Branch` : "");
        setDescription(salons.length > 0 ? (salons[0].description || "") : "Haircut (₹150), Beard Trim (₹80), Facial (₹400), Hair Spa (₹600)");
        setAddress("");
        setCity("");
        setPhone(currentUser?.phone || "");
        setIsOpen(true);
        setOpeningTime("09:00 AM");
        setClosingTime("09:00 PM");
        setFormError("");
        setLocationSuccess("");
        setLocationError("");
        setIsEditing(true);
    };

    // Open form for editing an existing branch
    const handleEditBranch = (salonToEdit) => {
        setEditingSalonId(salonToEdit.id);
        setName(salonToEdit.name);
        setDescription(salonToEdit.description || "");
        setAddress(salonToEdit.address);
        setCity(salonToEdit.city);
        setPhone(salonToEdit.phone || "");
        setIsOpen(salonToEdit.is_open !== false);
        setOpeningTime(salonToEdit.opening_time || "09:00 AM");
        setClosingTime(salonToEdit.closing_time || "09:00 PM");
        setFormError("");
        setLocationSuccess("");
        setLocationError("");
        setIsEditing(true);
    };

    // Quick 1-Click Toggle for Store Online / Offline Status
    const handleToggleOnlineStatus = async (salonItem) => {
        const newStatus = !salonItem.is_open;
        setStatusToggling(true);
        try {
            const res = await fetch(`http://127.0.0.1:8000/salons/${salonItem.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_open: newStatus })
            });
            if (res.ok) {
                const updated = await res.json();
                setSalons((prev) => prev.map((s) => (s.id === salonItem.id ? updated : s)));
            } else {
                alert("Failed to update status. Please try again.");
            }
        } catch (err) {
            console.error("Status toggle error:", err);
            alert("Server connection error while updating online status.");
        } finally {
            setStatusToggling(false);
        }
    };

    // Delete a salon branch
    const handleDeleteBranch = async (salonId, salonName) => {
        if (!window.confirm(`Are you sure you want to delete branch "${salonName}"? This action cannot be undone.`)) {
            return;
        }

        setDeletingId(salonId);
        try {
            const res = await fetch(`http://127.0.0.1:8000/salons/${salonId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                alert(`Branch "${salonName}" deleted successfully.`);
                fetchOwnerSalons();
            } else {
                const data = await res.json();
                alert(data.detail || "Failed to delete branch.");
            }
        } catch (err) {
            console.error("Delete salon error:", err);
            alert("Server connection error while deleting branch.");
        } finally {
            setDeletingId(null);
        }
    };

    // Real-Time GPS Detection & Reverse Geocoding
    const handleAutoDetectGPS = () => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser.");
            return;
        }

        setDetectingLocation(true);
        setLocationError("");
        setLocationSuccess("");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                    );
                    if (res.ok) {
                        const data = await res.json();
                        const addr = data.address || {};

                        const streetPart = [
                            addr.building || addr.amenity || addr.shop,
                            addr.road || addr.street,
                            addr.suburb || addr.neighbourhood || addr.residential,
                        ].filter(Boolean).join(", ");

                        const cityPart =
                            addr.city ||
                            addr.town ||
                            addr.village ||
                            addr.county ||
                            addr.state_district ||
                            "";

                        const detectedAddress = streetPart || data.display_name.split(",").slice(0, 3).join(", ");
                        const detectedCity = cityPart || (data.display_name.split(",").slice(-3, -2)[0] || "").trim();

                        if (detectedAddress) setAddress(detectedAddress);
                        if (detectedCity) setCity(detectedCity);

                        setLocationSuccess(`✅ Real GPS Location Detected: ${detectedAddress}, ${detectedCity}`);
                    } else {
                        setLocationSuccess(`✅ GPS Coordinates Found: Lat ${latitude.toFixed(4)}, Lon ${longitude.toFixed(4)}`);
                    }
                } catch (err) {
                    console.error("Geocoding fetch error:", err);
                    setLocationSuccess(`✅ GPS Coordinates Found: Lat ${latitude.toFixed(4)}, Lon ${longitude.toFixed(4)}`);
                } finally {
                    setDetectingLocation(false);
                }
            },
            (err) => {
                console.error("GPS Error:", err);
                let msg = "Could not get your location.";
                if (err.code === 1) msg = "Location permission denied. Please allow location access in your browser.";
                else if (err.code === 2) msg = "Location position unavailable.";
                else if (err.code === 3) msg = "Location request timed out.";
                setLocationError(msg);
                setDetectingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleSaveSalon = async (e) => {
        e.preventDefault();
        setFormError("");

        if (!name.trim() || !address.trim() || !city.trim()) {
            setFormError("Salon name, address, and city are required.");
            return;
        }

        setSaving(true);

        try {
            const isUpdate = editingSalonId !== null;
            const endpoint = isUpdate
                ? `http://127.0.0.1:8000/salons/${editingSalonId}`
                : "http://127.0.0.1:8000/salons/";
            const method = isUpdate ? "PUT" : "POST";

            const res = await fetch(endpoint, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || null,
                    address: address.trim(),
                    city: city.trim(),
                    phone: phone.trim() || null,
                    owner_id: currentUser.user_id,
                    is_open: isOpen,
                    opening_time: openingTime.trim() || "09:00 AM",
                    closing_time: closingTime.trim() || "09:00 PM"
                }),
            });

            const data = await res.json();

            if (res.ok) {
                alert(isUpdate ? "Branch details & working hours updated successfully!" : "New branch added successfully!");
                setIsEditing(false);
                setLocationSuccess("");
                await fetchOwnerSalons();
                setSelectedSalonId(data.id);
            } else {
                setFormError(data.detail || "Failed to save branch details.");
            }
        } catch (err) {
            console.error("Save salon error:", err);
            setFormError("Server error while saving branch details.");
        } finally {
            setSaving(false);
        }
    };

    // Split services from description for nice chip rendering
    const parseServices = (desc) => {
        if (!desc) return ["Haircut", "Hair Styling", "Beard Trim", "Hair Wash", "Facial"];
        return desc.split(/[,•|\n]+/).map((s) => s.trim()).filter(Boolean);
    };

    const activeSalon = salons.find((s) => s.id === selectedSalonId) || salons[0];

    return (
        <div className="owner-layout">
            <OwnerNavbar />

            <main className="owner-main-content">
                {/* Header with Title and Add Branch Action Button */}
                <div className="owner-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
                    <div>
                        <h1>💇 My Salon Branches ({salons.length})</h1>
                        <p>Manage store online/offline status, business hours (opening/closing times), GPS locations, and branches.</p>
                    </div>
                    {!isEditing && (
                        <button
                            className="submit-btn"
                            style={{ margin: 0, padding: "10px 20px", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "700" }}
                            onClick={handleAddNewBranch}
                        >
                            ➕ Add Branch
                        </button>
                    )}
                </div>

                {loading && <p>Loading your salon branches...</p>}
                {error && <div className="alert error">⚠️ {error}</div>}

                {/* If Owner has not registered any salon yet */}
                {!loading && salons.length === 0 && !isEditing && (
                    <div className="salon-card owner-empty-card" style={{ textAlign: "center", padding: "40px 20px" }}>
                        <div style={{ fontSize: "48px", marginBottom: "12px" }}>💈</div>
                        <h3>No Salon Branches Registered Yet</h3>
                        <p style={{ maxWidth: "450px", margin: "0 auto 20px auto" }}>
                            You haven't set up any salon branch yet. Set up your salon branch name, opening hours, real GPS location, and services so customers can discover you.
                        </p>
                        <button
                            className="submit-btn"
                            onClick={handleAddNewBranch}
                        >
                            ➕ Register First Salon Branch
                        </button>
                    </div>
                )}

                {/* Branch Switcher Tabs if Multiple Branches Exist */}
                {!loading && salons.length > 1 && !isEditing && (
                    <div className="owner-branch-tabs-bar" style={{ display: "flex", flexWrap: "wrap", gap: "10px", margin: "0 0 20px 0" }}>
                        {salons.map((b) => (
                            <button
                                key={b.id}
                                className={`filter-pill ${activeSalon?.id === b.id ? "active" : ""}`}
                                onClick={() => setSelectedSalonId(b.id)}
                                style={{
                                    padding: "8px 18px",
                                    borderRadius: "16px",
                                    fontSize: "13.5px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px"
                                }}
                            >
                                <span>{b.is_open ? "🟢" : "🔴"}</span>
                                💈 {b.name} <small style={{ opacity: 0.8 }}>({b.city})</small>
                            </button>
                        ))}
                        <button
                            className="filter-pill"
                            onClick={handleAddNewBranch}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "16px",
                                background: "rgba(168, 85, 247, 0.15)",
                                border: "1px dashed rgba(168, 85, 247, 0.4)",
                                color: "#c084fc",
                                fontWeight: "700",
                                fontSize: "13px",
                                cursor: "pointer"
                            }}
                        >
                            ➕ Add Another Branch
                        </button>
                    </div>
                )}

                {/* Salon Details Card or Edit/Add Branch Form */}
                {!loading && (isEditing || activeSalon) && (
                    <div className="owner-container">
                        {isEditing ? (
                            <div className="booking-card owner-form-card">
                                <h3>{editingSalonId ? "✏️ Edit Branch Information & Hours" : "➕ Add New Salon Branch"}</h3>
                                <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 16px 0" }}>
                                    {editingSalonId
                                        ? "Update details, opening hours, and operating status for this branch."
                                        : "Enter the details for your new salon branch. It will appear on the customer discovery map."}
                                </p>
                                {formError && <div className="alert error">⚠️ {formError}</div>}

                                <form onSubmit={handleSaveSalon} className="booking-form">
                                    <div className="form-group">
                                        <label>Branch Name *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Royal Glow Salon - Palayamkottai Branch"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>

                                    {/* Online Booking Status Toggle & Working Hours Box */}
                                    <div className="owner-time-settings-box" style={{
                                        background: "rgba(255, 255, 255, 0.03)",
                                        border: "1px solid rgba(168, 85, 247, 0.2)",
                                        borderRadius: "16px",
                                        padding: "16px",
                                        marginBottom: "16px"
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
                                            <div>
                                                <label style={{ fontSize: "13px", fontWeight: "800", color: "#ffffff", display: "block" }}>
                                                    ⚡ Online Booking Status
                                                </label>
                                                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                                                    Turn OFF to pause incoming online appointments (Offline mode)
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsOpen(!isOpen)}
                                                style={{
                                                    padding: "8px 18px",
                                                    borderRadius: "20px",
                                                    border: isOpen ? "1px solid #10b981" : "1px solid #ef4444",
                                                    background: isOpen ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                                    color: isOpen ? "#34d399" : "#f87171",
                                                    fontWeight: "800",
                                                    fontSize: "13px",
                                                    cursor: "pointer",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "6px"
                                                }}
                                            >
                                                <span>{isOpen ? "🟢 OPEN (Accepting Bookings)" : "🔴 CLOSED (Bookings Paused)"}</span>
                                            </button>
                                        </div>

                                        {/* Opening and Closing Hours */}
                                        <div className="form-row" style={{ marginTop: "10px" }}>
                                            <div className="form-group">
                                                <label>⏰ Opening Time</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. 09:00 AM"
                                                    value={openingTime}
                                                    onChange={(e) => setOpeningTime(e.target.value)}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>⏰ Closing Time</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. 09:00 PM"
                                                    value={closingTime}
                                                    onChange={(e) => setClosingTime(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Quick Preset Hours Buttons */}
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                                            <span style={{ fontSize: "11px", color: "#94a3b8", alignSelf: "center", marginRight: "4px" }}>
                                                Quick Presets:
                                            </span>
                                            {[
                                                { label: "9 AM - 9 PM", open: "09:00 AM", close: "09:00 PM" },
                                                { label: "8 AM - 8 PM", open: "08:00 AM", close: "08:00 PM" },
                                                { label: "10 AM - 10 PM", open: "10:00 AM", close: "10:00 PM" },
                                                { label: "8 AM - 10 PM", open: "08:00 AM", close: "10:00 PM" }
                                            ].map((preset, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    style={{
                                                        padding: "4px 10px",
                                                        fontSize: "11px",
                                                        borderRadius: "12px",
                                                        background: "rgba(255, 255, 255, 0.06)",
                                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                                        color: "#cbd5e1",
                                                        cursor: "pointer"
                                                    }}
                                                    onClick={() => {
                                                        setOpeningTime(preset.open);
                                                        setClosingTime(preset.close);
                                                    }}
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Services Offered (comma separated, e.g. with prices)</label>
                                        <textarea
                                            rows="3"
                                            placeholder="Haircut (₹150), Beard Trim (₹80), Facial (₹400), Hair Spa (₹600)"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="custom-textarea"
                                        />
                                        <div className="quick-service-suggestions" style={{ marginTop: "8px" }}>
                                            <span style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                                                💡 Quick Add Popular Services:
                                            </span>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                                {[
                                                    "Haircut (₹150)",
                                                    "Beard Trim (₹80)",
                                                    "Hair Spa (₹600)",
                                                    "Facial (₹400)",
                                                    "Hair Color (₹800)",
                                                    "Head Massage (₹250)",
                                                    "Bridal / Grooming (₹1500)"
                                                ].map((s, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        style={{
                                                            padding: "4px 10px",
                                                            fontSize: "11.5px",
                                                            borderRadius: "14px",
                                                            background: "rgba(255, 255, 255, 0.08)",
                                                            border: "1px solid rgba(255, 255, 255, 0.15)",
                                                            color: "#e2e8f0",
                                                            cursor: "pointer"
                                                        }}
                                                        onClick={() => {
                                                            const current = description.trim();
                                                            setDescription(current ? `${current}, ${s}` : s);
                                                        }}
                                                    >
                                                        + {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Real-Time Live GPS Auto-Detect Button */}
                                    <div className="live-gps-section" style={{ margin: "14px 0" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                            <span style={{ fontSize: "13px", fontWeight: "700", color: "#e2e8f0" }}>
                                                📍 Shop GPS Location:
                                            </span>
                                            <button
                                                type="button"
                                                className="detect-live-gps-btn"
                                                onClick={handleAutoDetectGPS}
                                                disabled={detectingLocation}
                                            >
                                                {detectingLocation ? "⏳ Detecting GPS..." : "📍 1-Click Auto-Detect Live GPS"}
                                            </button>
                                        </div>

                                        {locationSuccess && (
                                            <div className="gps-success-banner">
                                                {locationSuccess}
                                            </div>
                                        )}

                                        {locationError && (
                                            <div className="gps-error-banner">
                                                ⚠️ {locationError}
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Address *</label>
                                            <input
                                                type="text"
                                                placeholder="Street address / Landmark"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>City *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Chennai, Madurai, Palayamkottai"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Contact Phone</label>
                                        <input
                                            type="tel"
                                            placeholder="e.g. +91 98765 43210"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            type="button"
                                            className="back-btn"
                                            onClick={() => {
                                                setIsEditing(false);
                                                setLocationSuccess("");
                                                setLocationError("");
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="submit-btn"
                                            disabled={saving}
                                        >
                                            {saving ? "Saving..." : (editingSalonId ? "💾 Update Branch & Hours" : "🚀 Add Branch")}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="salon-card owner-profile-card">
                                <div className="owner-card-top">
                                    <div className="owner-header-left">
                                        <div className="owner-title-row">
                                            <h3 className="owner-salon-title">💈 {activeSalon.name}</h3>
                                            <span className={`owner-status-pill ${activeSalon.is_open ? "online" : "offline"}`}>
                                                {activeSalon.is_open ? "🟢 Open / Online" : "🔴 Closed / Offline"}
                                            </span>
                                        </div>
                                        <span className="owner-branch-id-tag">
                                            Branch ID #{activeSalon.id}
                                        </span>
                                    </div>

                                    {/* Action Buttons: 1-Click Status Toggle, Set Location, Edit */}
                                    <div className="owner-header-actions-row">
                                        <button
                                            className={`edit-salon-action-btn ${activeSalon.is_open ? "pause-action" : "resume-action"}`}
                                            onClick={() => handleToggleOnlineStatus(activeSalon)}
                                            disabled={statusToggling}
                                            title="1-Click Quick Toggle Online / Offline Status"
                                        >
                                            {statusToggling
                                                ? "Updating..."
                                                : activeSalon.is_open
                                                ? "⏸️ Pause Online Bookings"
                                                : "▶️ Resume Online Bookings"}
                                        </button>

                                        <button
                                            className="edit-salon-action-btn location-action"
                                            onClick={() => {
                                                handleEditBranch(activeSalon);
                                                handleAutoDetectGPS();
                                            }}
                                            title="Auto-detect and update branch GPS coordinates"
                                        >
                                            📍 Set Live Location
                                        </button>

                                        <button
                                            className="edit-salon-action-btn edit-action"
                                            onClick={() => handleEditBranch(activeSalon)}
                                        >
                                            ✏️ Edit Branch & Hours
                                        </button>

                                        {salons.length > 1 && (
                                            <button
                                                className="edit-salon-action-btn delete-action"
                                                onClick={() => handleDeleteBranch(activeSalon.id, activeSalon.name)}
                                                disabled={deletingId === activeSalon.id}
                                                title="Delete this salon branch"
                                            >
                                                {deletingId === activeSalon.id ? "Deleting..." : "🗑️ Delete"}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Operating Hours & Online Status Highlight Banner */}
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "12px",
                                    background: "rgba(255, 255, 255, 0.03)",
                                    border: "1px solid rgba(255, 255, 255, 0.08)",
                                    borderRadius: "14px",
                                    padding: "12px 18px",
                                    margin: "14px 0"
                                }}>
                                    <div>
                                        <span style={{ fontSize: "12px", color: "#94a3b8", display: "block" }}>⏰ Business Operating Hours:</span>
                                        <strong style={{ fontSize: "14px", color: "#e2e8f0" }}>
                                            {activeSalon.opening_time || "09:00 AM"} – {activeSalon.closing_time || "09:00 PM"} (Daily)
                                        </strong>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <span style={{ fontSize: "12px", color: "#94a3b8", display: "block" }}>Customer Booking Status:</span>
                                        <strong style={{ fontSize: "13px", color: activeSalon.is_open ? "#34d399" : "#f87171" }}>
                                            {activeSalon.is_open ? "🟢 Customers can book online" : "🔴 Online bookings temporarily stopped"}
                                        </strong>
                                    </div>
                                </div>

                                <div className="owner-details-list">
                                    <p className="salon-location">
                                        📍 <strong>Address:</strong> {activeSalon.address}, <strong>{activeSalon.city}</strong>
                                    </p>
                                    {activeSalon.phone && (
                                        <p className="salon-phone">
                                            📞 <strong>Phone:</strong> {activeSalon.phone}
                                        </p>
                                    )}
                                    <p className="salon-owner-tag">
                                        👤 <strong>Owner:</strong> {currentUser?.name} ({currentUser?.email})
                                    </p>
                                </div>

                                {/* Direct Live Google Map Directions Link */}
                                <div className="owner-map-row" style={{ marginTop: "12px" }}>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            activeSalon.name + " " + activeSalon.address + " " + activeSalon.city
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="owner-map-link-chip"
                                    >
                                        🗺️ View Exact Location on Google Maps ↗
                                    </a>
                                </div>

                                {/* Services Offered Section */}
                                <div className="owner-services-section">
                                    <h4>✂️ Offered Services</h4>
                                    <div className="services-chips-grid">
                                        {parseServices(activeSalon.description).map((svc, idx) => (
                                            <span key={idx} className="service-chip">
                                                ✨ {svc}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="owner-quick-actions" style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                                    <button
                                        className="card-btn"
                                        style={{ flex: 1 }}
                                        onClick={() => navigate("/owner/bookings")}
                                    >
                                        📅 View Incoming Bookings →
                                    </button>
                                    <button
                                        className="card-btn"
                                        style={{ background: "rgba(168, 85, 247, 0.2)", border: "1px solid rgba(168, 85, 247, 0.4)", color: "#e9d5ff" }}
                                        onClick={handleAddNewBranch}
                                    >
                                        ➕ Add Another Branch
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default OwnerSalon;
