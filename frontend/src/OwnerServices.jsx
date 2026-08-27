import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "./auth";
import OwnerNavbar from "./OwnerNavbar";

function OwnerServices() {
    const navigate = useNavigate();
    const currentUser = getUser();

    const [salon, setSalon] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modal state for Add/Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingServiceId, setEditingServiceId] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        category: "Hair",
        price: "",
        duration_mins: 30,
        description: ""
    });
    const [saving, setSaving] = useState(false);

    const categories = ["Hair", "Beard", "Spa", "Skin", "Bridal", "Coloring", "Packages"];

    const loadSalonAndServices = async () => {
        if (!currentUser || !currentUser.user_id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            // 1. Fetch Owner's active salon
            const salonRes = await fetch(`http://127.0.0.1:8000/salons/owner/${currentUser.user_id}/all`);
            if (salonRes.ok) {
                const salonList = await salonRes.json();
                if (salonList.length > 0) {
                    const activeSalon = salonList[0];
                    setSalon(activeSalon);

                    // 2. Fetch Services for this salon
                    const srvRes = await fetch(`http://127.0.0.1:8000/services/salon/${activeSalon.id}`);
                    if (srvRes.ok) {
                        const srvData = await srvRes.json();
                        setServices(srvData);
                    }
                } else {
                    setSalon(null);
                }
            }
        } catch (err) {
            setError("Failed to load services: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSalonAndServices();
    }, []);

    const handleOpenAddModal = () => {
        setEditingServiceId(null);
        setFormData({
            name: "",
            category: "Hair",
            price: "",
            duration_mins: 30,
            description: ""
        });
        setIsModalOpen(true);
        setError("");
        setSuccess("");
    };

    const handleOpenEditModal = (service) => {
        setEditingServiceId(service.id);
        setFormData({
            name: service.name,
            category: service.category || "Hair",
            price: service.price,
            duration_mins: service.duration_mins || 30,
            description: service.description || ""
        });
        setIsModalOpen(true);
        setError("");
        setSuccess("");
    };

    const handleSaveService = async (e) => {
        e.preventDefault();
        if (!salon) return;
        if (!formData.name.trim() || !formData.price) {
            setError("Please fill in service name and price");
            return;
        }

        try {
            setSaving(true);
            setError("");

            if (editingServiceId) {
                // Update
                const res = await fetch(`http://127.0.0.1:8000/services/${editingServiceId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: formData.name.trim(),
                        category: formData.category,
                        price: parseFloat(formData.price),
                        duration_mins: parseInt(formData.duration_mins, 10),
                        description: formData.description.trim()
                    })
                });
                if (!res.ok) throw new Error("Failed to update service");
                setSuccess("Service updated successfully! ✨");
            } else {
                // Create
                const res = await fetch("http://127.0.0.1:8000/services/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        salon_id: salon.id,
                        name: formData.name.trim(),
                        category: formData.category,
                        price: parseFloat(formData.price),
                        duration_mins: parseInt(formData.duration_mins, 10),
                        description: formData.description.trim()
                    })
                });
                if (!res.ok) throw new Error("Failed to add service");
                setSuccess("New service added successfully! 💇");
            }

            setIsModalOpen(false);
            loadSalonAndServices();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteService = async (serviceId, serviceName) => {
        if (!window.confirm(`Are you sure you want to delete "${serviceName}"?`)) return;

        try {
            const res = await fetch(`http://127.0.0.1:8000/services/${serviceId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete service");
            setSuccess("Service deleted successfully");
            loadSalonAndServices();
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
                        <h2>✨ Service & Pricing Catalog</h2>
                        <p>Manage treatments, pricing, duration, and service packages for customers.</p>
                    </div>

                    {salon && (
                        <button className="submit-btn" onClick={handleOpenAddModal} style={{ width: "auto", padding: "10px 22px" }}>
                            ➕ Add New Service
                        </button>
                    )}
                </div>

                {error && <div className="alert error">⚠️ {error}</div>}
                {success && <div className="alert success">✅ {success}</div>}

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading services catalog...</p>
                    </div>
                ) : !salon ? (
                    <div className="owner-setup-alert">
                        <div className="setup-alert-content">
                            <h3>💈 Set Up Your Salon First</h3>
                            <p>You need to register your salon branch before adding services.</p>
                        </div>
                        <button className="submit-btn" onClick={() => navigate("/owner/salon")}>
                            Register My Salon
                        </button>
                    </div>
                ) : services.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">💇</span>
                        <h3>No Services Added Yet</h3>
                        <p>Click "Add New Service" above to build your salon menu.</p>
                    </div>
                ) : (
                    <div className="owner-services-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "18px", marginTop: "20px" }}>
                        {services.map((srv) => (
                            <div key={srv.id} className="owner-service-card" style={{
                                background: "#1f1934",
                                borderRadius: "20px",
                                padding: "20px",
                                border: "1px solid rgba(255,255,255,0.08)",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                gap: "14px",
                                boxShadow: "6px 6px 16px rgba(0,0,0,0.5)"
                            }}>
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                        <span style={{
                                            padding: "3px 10px",
                                            borderRadius: "8px",
                                            background: "rgba(168, 85, 247, 0.2)",
                                            color: "#c084fc",
                                            fontSize: "11px",
                                            fontWeight: "800"
                                        }}>
                                            {srv.category || "Hair"}
                                        </span>
                                        <span style={{
                                            fontSize: "18px",
                                            fontWeight: "800",
                                            color: "#34d399"
                                        }}>
                                            ₹{srv.price}
                                        </span>
                                    </div>

                                    <h3 style={{ margin: "0 0 6px 0", color: "#ffffff", fontSize: "17px" }}>{srv.name}</h3>
                                    <p style={{ margin: "0", color: "#94a3b8", fontSize: "13px", lineHeight: "1.4" }}>
                                        {srv.description || "Expert styling service."}
                                    </p>
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                    <span style={{ color: "#cbd5e1", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                                        ⏱️ {srv.duration_mins || 30} mins
                                    </span>

                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button
                                            onClick={() => handleOpenEditModal(srv)}
                                            style={{
                                                padding: "6px 12px",
                                                borderRadius: "10px",
                                                background: "#2a2245",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                color: "#cbd5e1",
                                                fontSize: "12px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteService(srv.id, srv.name)}
                                            style={{
                                                padding: "6px 12px",
                                                borderRadius: "10px",
                                                background: "rgba(239,68,68,0.15)",
                                                border: "1px solid rgba(239,68,68,0.3)",
                                                color: "#f87171",
                                                fontSize: "12px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add / Edit Service Modal */}
                {isModalOpen && (
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
                                {editingServiceId ? "✏️ Edit Service" : "➕ Add New Service"}
                            </h3>

                            <form onSubmit={handleSaveService}>
                                <div className="form-group" style={{ marginBottom: "14px" }}>
                                    <label style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: "700" }}>Service Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Precision Haircut & Styling"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                                    <div className="form-group">
                                        <label style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: "700" }}>Category</label>
                                        <select
                                            className="form-input"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {categories.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: "700" }}>Price (₹) *</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="e.g. 250"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            required
                                            min="0"
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: "14px" }}>
                                    <label style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: "700" }}>Duration (Minutes)</label>
                                    <select
                                        className="form-input"
                                        value={formData.duration_mins}
                                        onChange={(e) => setFormData({ ...formData, duration_mins: e.target.value })}
                                    >
                                        <option value="15">15 mins (Quick Touch-up)</option>
                                        <option value="30">30 mins (Standard Cut / Trim)</option>
                                        <option value="45">45 mins (Hair Spa / Scrub)</option>
                                        <option value="60">60 mins (1 Hour Comprehensive)</option>
                                        <option value="90">90 mins (Bridal / Royal Grooming)</option>
                                        <option value="120">120 mins (2 Hours Treatment)</option>
                                    </select>
                                </div>

                                <div className="form-group" style={{ marginBottom: "20px" }}>
                                    <label style={{ color: "#cbd5e1", fontSize: "13px", fontWeight: "700" }}>Description</label>
                                    <textarea
                                        className="form-input"
                                        rows="3"
                                        placeholder="Detailed description of products and process included..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
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
                                        {saving ? "Saving..." : "Save Service"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default OwnerServices;
