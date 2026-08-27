import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "./auth";
import OwnerNavbar from "./OwnerNavbar";

function OwnerStaff() {
    const navigate = useNavigate();
    const currentUser = getUser();

    const [salon, setSalon] = useState(null);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modal state for Add/Edit Staff
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [editingStaffId, setEditingStaffId] = useState(null);
    const [staffFormData, setStaffFormData] = useState({
        name: "",
        specialization: "Master Hair Stylist & Colorist",
        experience_years: 3,
        phone: "",
        is_available: true
    });

    // Leave Management Modal
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [selectedStaffForLeave, setSelectedStaffForLeave] = useState(null);
    const [leaveDate, setLeaveDate] = useState("");
    const [leaveReason, setLeaveReason] = useState("Scheduled Day Off");
    const [staffLeaves, setStaffLeaves] = useState([]);
    const [saving, setSaving] = useState(false);

    const specializations = [
        "Master Hair Stylist & Colorist",
        "Spa & Organic Skin Specialist",
        "Executive Beard & Shaving Artist",
        "Bridal & Glamour Makeup Artist",
        "Keratin & Hair Treatment Specialist",
        "Senior Barber & Groomer"
    ];

    const loadSalonAndStaff = async () => {
        if (!currentUser || !currentUser.user_id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            // 1. Fetch owner's salon
            const salonRes = await fetch(`http://127.0.0.1:8000/salons/owner/${currentUser.user_id}/all`);
            if (salonRes.ok) {
                const salonListData = await salonRes.json();
                if (salonListData.length > 0) {
                    const activeSalon = salonListData[0];
                    setSalon(activeSalon);

                    // 2. Fetch staff for this salon
                    const staffRes = await fetch(`http://127.0.0.1:8000/staff/salon/${activeSalon.id}`);
                    if (staffRes.ok) {
                        const sData = await staffRes.json();
                        setStaffList(sData);
                    }
                } else {
                    setSalon(null);
                }
            }
        } catch (err) {
            setError("Failed to load staff: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSalonAndStaff();
    }, []);

    const handleOpenAddStaff = () => {
        setEditingStaffId(null);
        setStaffFormData({
            name: "",
            specialization: "Master Hair Stylist & Colorist",
            experience_years: 3,
            phone: "",
            is_available: true
        });
        setIsStaffModalOpen(true);
        setError("");
        setSuccess("");
    };

    const handleOpenEditStaff = (staff) => {
        setEditingStaffId(staff.id);
        setStaffFormData({
            name: staff.name,
            specialization: staff.specialization,
            experience_years: staff.experience_years,
            phone: staff.phone || "",
            is_available: staff.is_available
        });
        setIsStaffModalOpen(true);
        setError("");
        setSuccess("");
    };

    const handleSaveStaff = async (e) => {
        e.preventDefault();
        if (!salon) return;
        if (!staffFormData.name.trim()) {
            setError("Please enter stylist name");
            return;
        }

        try {
            setSaving(true);
            setError("");

            if (editingStaffId) {
                // Update
                const res = await fetch(`http://127.0.0.1:8000/staff/${editingStaffId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: staffFormData.name.trim(),
                        specialization: staffFormData.specialization,
                        experience_years: parseInt(staffFormData.experience_years, 10),
                        phone: staffFormData.phone.trim(),
                        is_available: staffFormData.is_available
                    })
                });
                if (!res.ok) throw new Error("Failed to update stylist");
                setSuccess("Stylist profile updated! ✨");
            } else {
                // Create
                const res = await fetch("http://127.0.0.1:8000/staff/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        salon_id: salon.id,
                        name: staffFormData.name.trim(),
                        specialization: staffFormData.specialization,
                        experience_years: parseInt(staffFormData.experience_years, 10),
                        phone: staffFormData.phone.trim(),
                        is_available: staffFormData.is_available
                    })
                });
                if (!res.ok) throw new Error("Failed to add stylist");
                setSuccess("New stylist joined your team! 💈");
            }

            setIsStaffModalOpen(false);
            loadSalonAndStaff();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleAvailability = async (staff) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/staff/${staff.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    is_available: !staff.is_available
                })
            });
            if (res.ok) {
                setSuccess(`Availability updated for ${staff.name}`);
                loadSalonAndStaff();
            }
        } catch (err) {
            setError("Failed to update availability: " + err.message);
        }
    };

    const handleDeleteStaff = async (staffId, staffName) => {
        if (!window.confirm(`Are you sure you want to remove ${staffName}?`)) return;

        try {
            const res = await fetch(`http://127.0.0.1:8000/staff/${staffId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete staff member");
            setSuccess("Staff member removed");
            loadSalonAndStaff();
        } catch (err) {
            setError(err.message);
        }
    };

    // Leave modal handlers
    const handleOpenLeaveModal = async (staff) => {
        setSelectedStaffForLeave(staff);
        setLeaveDate(new Date().toISOString().split("T")[0]);
        setLeaveReason("Scheduled Day Off");
        setIsLeaveModalOpen(true);

        try {
            const res = await fetch(`http://127.0.0.1:8000/staff/${staff.id}/leaves`);
            if (res.ok) {
                const leaves = await res.json();
                setStaffLeaves(leaves);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddLeave = async (e) => {
        e.preventDefault();
        if (!selectedStaffForLeave || !leaveDate) return;

        try {
            setSaving(true);
            const res = await fetch("http://127.0.0.1:8000/staff/leave", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    staff_id: selectedStaffForLeave.id,
                    leave_date: leaveDate,
                    reason: leaveReason
                })
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Failed to record leave");
            }

            setSuccess(`Leave recorded for ${selectedStaffForLeave.name} on ${leaveDate}`);
            // refresh leaves
            const lRes = await fetch(`http://127.0.0.1:8000/staff/${selectedStaffForLeave.id}/leaves`);
            if (lRes.ok) {
                setStaffLeaves(await lRes.json());
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLeave = async (leaveId) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/staff/leave/${leaveId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setStaffLeaves(staffLeaves.filter((l) => l.id !== leaveId));
                setSuccess("Leave record cancelled");
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="owner-layout">
            <OwnerNavbar />

            <main className="owner-main-content">
                <div className="owner-welcome-banner">
                    <div className="owner-welcome-text">
                        <h2>💈 Stylists & Staff Management</h2>
                        <p>Manage salon team, individual stylist availability, specialties, and schedule leave/day-offs.</p>
                    </div>

                    {salon && (
                        <button className="submit-btn" onClick={handleOpenAddStaff} style={{ width: "auto", padding: "10px 22px" }}>
                            ➕ Add New Stylist
                        </button>
                    )}
                </div>

                {error && <div className="alert error">⚠️ {error}</div>}
                {success && <div className="alert success">✅ {success}</div>}

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading stylists...</p>
                    </div>
                ) : !salon ? (
                    <div className="owner-setup-alert">
                        <div className="setup-alert-content">
                            <h3>💈 Set Up Your Salon First</h3>
                            <p>Register your salon to start adding your styling team.</p>
                        </div>
                        <button className="submit-btn" onClick={() => navigate("/owner/salon")}>
                            Register My Salon
                        </button>
                    </div>
                ) : staffList.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">💈</span>
                        <h3>No Stylists Added Yet</h3>
                        <p>Click "Add New Stylist" above to add team members.</p>
                    </div>
                ) : (
                    <div className="owner-staff-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "18px", marginTop: "20px" }}>
                        {staffList.map((staff) => (
                            <div key={staff.id} className="owner-staff-card" style={{
                                background: "#1f1934",
                                borderRadius: "22px",
                                padding: "22px",
                                border: "1px solid rgba(255,255,255,0.08)",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                gap: "16px",
                                boxShadow: "6px 6px 16px rgba(0,0,0,0.5)"
                            }}>
                                <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                                    <div style={{
                                        width: "52px",
                                        height: "52px",
                                        borderRadius: "50%",
                                        background: "linear-gradient(145deg, #a855f7 0%, #ec4899 100%)",
                                        color: "#ffffff",
                                        fontSize: "20px",
                                        fontWeight: "800",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        boxShadow: "0 4px 12px rgba(168,85,247,0.4)",
                                        flexShrink: 0
                                    }}>
                                        {staff.name[0]?.toUpperCase() || "S"}
                                    </div>

                                    <div style={{ overflow: "hidden" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <h3 style={{ margin: 0, color: "#ffffff", fontSize: "17px" }}>{staff.name}</h3>
                                            <span style={{
                                                padding: "2px 8px",
                                                borderRadius: "6px",
                                                fontSize: "11px",
                                                fontWeight: "800",
                                                background: staff.is_available ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                                                color: staff.is_available ? "#34d399" : "#f87171"
                                            }}>
                                                {staff.is_available ? "🟢 Available" : "🔴 Off-Duty"}
                                            </span>
                                        </div>
                                        <p style={{ margin: "3px 0 0 0", color: "#c084fc", fontSize: "12.5px", fontWeight: "700" }}>
                                            {staff.specialization}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ background: "#161226", borderRadius: "14px", padding: "10px 14px", fontSize: "12.5px", color: "#cbd5e1", display: "flex", justifyContent: "space-between" }}>
                                    <span>🌟 {staff.experience_years || 3} Years Experience</span>
                                    <span>📞 {staff.phone || "On File"}</span>
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap", gap: "8px" }}>
                                    <button
                                        onClick={() => handleOpenLeaveModal(staff)}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "10px",
                                            background: "rgba(168,85,247,0.15)",
                                            border: "1px solid rgba(168,85,247,0.3)",
                                            color: "#c084fc",
                                            fontSize: "12px",
                                            fontWeight: "700",
                                            cursor: "pointer"
                                        }}
                                    >
                                        📅 Manage Leave
                                    </button>

                                    <div style={{ display: "flex", gap: "6px" }}>
                                        <button
                                            onClick={() => handleToggleAvailability(staff)}
                                            style={{
                                                padding: "6px 10px",
                                                borderRadius: "10px",
                                                background: "#2a2245",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                color: "#cbd5e1",
                                                fontSize: "12px",
                                                cursor: "pointer"
                                            }}
                                            title="Toggle online shift"
                                        >
                                            {staff.is_available ? "Pause" : "Resume"}
                                        </button>
                                        <button
                                            onClick={() => handleOpenEditStaff(staff)}
                                            style={{
                                                padding: "6px 10px",
                                                borderRadius: "10px",
                                                background: "#2a2245",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                color: "#cbd5e1",
                                                fontSize: "12px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDeleteStaff(staff.id, staff.name)}
                                            style={{
                                                padding: "6px 10px",
                                                borderRadius: "10px",
                                                background: "rgba(239,68,68,0.15)",
                                                border: "1px solid rgba(239,68,68,0.3)",
                                                color: "#f87171",
                                                fontSize: "12px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add / Edit Staff Modal */}
                {isStaffModalOpen && (
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
                            maxWidth: "480px",
                            width: "100%",
                            border: "1px solid rgba(192, 132, 252, 0.3)",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.8)"
                        }}>
                            <h3 style={{ margin: "0 0 16px 0", color: "#ffffff", fontSize: "20px" }}>
                                {editingStaffId ? "✏️ Edit Stylist Profile" : "➕ Add New Stylist"}
                            </h3>

                            <form onSubmit={handleSaveStaff}>
                                <div className="form-group" style={{ marginBottom: "14px" }}>
                                    <label style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: "700" }}>Stylist Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Alex Rivera"
                                        value={staffFormData.name}
                                        onChange={(e) => setStaffFormData({ ...staffFormData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: "14px" }}>
                                    <label style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: "700" }}>Specialization *</label>
                                    <select
                                        className="form-input"
                                        value={staffFormData.specialization}
                                        onChange={(e) => setStaffFormData({ ...staffFormData, specialization: e.target.value })}
                                    >
                                        {specializations.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                                    <div className="form-group">
                                        <label style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: "700" }}>Experience (Years)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            min="0"
                                            value={staffFormData.experience_years}
                                            onChange={(e) => setStaffFormData({ ...staffFormData, experience_years: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: "700" }}>Contact Phone</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="9876543210"
                                            value={staffFormData.phone}
                                            onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsStaffModalOpen(false)}
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
                                        disabled={saving}
                                        style={{ width: "auto", padding: "10px 24px" }}
                                    >
                                        {saving ? "Saving..." : "Save Stylist"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Manage Leave Modal */}
                {isLeaveModalOpen && selectedStaffForLeave && (
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
                            maxWidth: "480px",
                            width: "100%",
                            border: "1px solid rgba(192, 132, 252, 0.3)",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.8)"
                        }}>
                            <h3 style={{ margin: "0 0 8px 0", color: "#ffffff", fontSize: "20px" }}>
                                📅 Leave & Day-Off: {selectedStaffForLeave.name}
                            </h3>
                            <p style={{ margin: "0 0 16px 0", color: "#94a3b8", fontSize: "13px" }}>
                                Registered leaves prevent customers from booking this stylist on these dates.
                            </p>

                            <form onSubmit={handleAddLeave} style={{ marginBottom: "20px", background: "#161226", padding: "14px", borderRadius: "14px" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                                    <div>
                                        <label style={{ color: "#cbd5e1", fontSize: "12px", fontWeight: "700" }}>Leave Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={leaveDate}
                                            onChange={(e) => setLeaveDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label style={{ color: "#cbd5e1", fontSize: "12px", fontWeight: "700" }}>Reason</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. Weekly Off / Sick"
                                            value={leaveReason}
                                            onChange={(e) => setLeaveReason(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="submit-btn" disabled={saving} style={{ width: "100%", padding: "8px" }}>
                                    ➕ Record Day Off
                                </button>
                            </form>

                            <h4 style={{ color: "#cbd5e1", fontSize: "14px", margin: "0 0 10px 0" }}>Upcoming Leaves / Off-Days</h4>
                            {staffLeaves.length === 0 ? (
                                <p style={{ color: "#64748b", fontSize: "13px" }}>No scheduled leaves on record.</p>
                            ) : (
                                <div style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                                    {staffLeaves.map((l) => (
                                        <div key={l.id} style={{
                                            background: "#241d3d",
                                            padding: "8px 12px",
                                            borderRadius: "10px",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            fontSize: "12.5px"
                                        }}>
                                            <span style={{ color: "#ffffff", fontWeight: "700" }}>📆 {l.leave_date} ({l.reason})</span>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteLeave(l.id)}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    color: "#f87171",
                                                    cursor: "pointer",
                                                    fontWeight: "800"
                                                }}
                                            >
                                                ✕ Cancel
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    onClick={() => setIsLeaveModalOpen(false)}
                                    style={{
                                        padding: "10px 20px",
                                        borderRadius: "12px",
                                        background: "rgba(255,255,255,0.06)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        color: "#cbd5e1",
                                        cursor: "pointer"
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default OwnerStaff;
