import { useState, useEffect } from "react";
import { getUser, setUser } from "./auth";
import OwnerNavbar from "./OwnerNavbar";

function OwnerProfile() {
    const currentUser = getUser();

    const [user, setProfileUser] = useState(currentUser);
    const [name, setName] = useState(currentUser?.name || "");
    const [email, setEmail] = useState(currentUser?.email || "");
    const [phone, setPhone] = useState(currentUser?.phone || "");
    const [address, setAddress] = useState(currentUser?.address || "");
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (currentUser?.user_id) {
            fetch(`http://127.0.0.1:8000/customers/${currentUser.user_id}`)
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    if (data) {
                        setProfileUser(data);
                        setName(data.name);
                        setEmail(data.email);
                        setPhone(data.phone || "");
                        setAddress(data.address || "");
                    }
                })
                .catch((e) => console.error("Profile fetch error:", e));
        }
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!name.trim() || !email.trim()) {
            setError("Name and Email are required.");
            return;
        }

        setSaving(true);

        try {
            const res = await fetch(`http://127.0.0.1:8000/customers/${currentUser.user_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    phone: phone.trim() || null,
                    address: address.trim() || null,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess("Profile updated successfully!");
                setProfileUser(data);
                setIsEditing(false);

                // Update session localStorage
                setUser({
                    ...currentUser,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    address: data.address,
                });
            } else {
                setError(data.detail || "Failed to update profile.");
            }
        } catch (err) {
            console.error("Update profile error:", err);
            setError("Server error while updating profile.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="owner-layout">
            <OwnerNavbar />

            <main className="owner-main-content">
                <div className="owner-page-header">
                    <div>
                        <h1>👤 My Profile</h1>
                        <p>Manage your account credentials and personal contact details.</p>
                    </div>
                </div>

                <div className="owner-container" style={{ maxWidth: "560px" }}>
                    {error && <div className="alert error">⚠️ {error}</div>}
                    {success && <div className="alert success">🎉 {success}</div>}

                    {isEditing ? (
                        <div className="booking-card owner-form-card">
                            <h3>✏️ Edit Account Profile</h3>

                            <form onSubmit={handleUpdateProfile} className="booking-form">
                                <div className="form-group">
                                    <label>Full Name *</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Email Address *</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Address / City</label>
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                    />
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="back-btn"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="submit-btn"
                                        disabled={saving}
                                    >
                                        {saving ? "Saving..." : "💾 Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="salon-card owner-profile-card">
                            <div className="owner-card-top">
                                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                    <div className="customer-avatar large">
                                        {user?.name ? user.name.charAt(0).toUpperCase() : "O"}
                                    </div>
                                    <div>
                                        <h3>{user?.name}</h3>
                                        <span className="owner-badge">SALON_OWNER</span>
                                    </div>
                                </div>
                                <button
                                    className="edit-salon-action-btn"
                                    onClick={() => setIsEditing(true)}
                                >
                                    ✏️ Edit Profile
                                </button>
                            </div>

                            <div className="owner-details-list" style={{ marginTop: "20px" }}>
                                <div className="detail-row">
                                    <span className="label">User ID:</span>
                                    <span className="value">#{user?.id || currentUser?.user_id}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Email:</span>
                                    <span className="value">{user?.email}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Phone:</span>
                                    <span className="value">{user?.phone || "Not specified"}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">City / Address:</span>
                                    <span className="value">{user?.address || "Not specified"}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Account Role:</span>
                                    <span className="value" style={{ color: "#ec4899", fontWeight: "700" }}>
                                        SALON_OWNER
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default OwnerProfile;
