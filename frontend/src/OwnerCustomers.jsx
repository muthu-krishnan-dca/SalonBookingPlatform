import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "./auth";
import OwnerNavbar from "./OwnerNavbar";

function OwnerCustomers() {
    const navigate = useNavigate();
    const currentUser = getUser();

    const [salon, setSalon] = useState(null);
    const [customerStats, setCustomerStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadSalonCustomers = async () => {
        if (!currentUser || !currentUser.user_id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            // 1. Fetch Owner's Salon
            const salonRes = await fetch(`http://127.0.0.1:8000/salons/owner/${currentUser.user_id}`);
            if (!salonRes.ok) {
                if (salonRes.status === 404) {
                    setSalon(null);
                } else {
                    setError("Failed to fetch salon details.");
                }
                setLoading(false);
                return;
            }

            const salonData = await salonRes.json();
            setSalon(salonData);

            // 2. Fetch Bookings for this Salon
            const bookingsRes = await fetch(`http://127.0.0.1:8000/bookings/salon/${salonData.id}`);
            let bookingsList = [];
            if (bookingsRes.ok) {
                bookingsList = await bookingsRes.json();
            }

            // 3. Fetch All Customers list
            const custRes = await fetch("http://127.0.0.1:8000/customers/");
            let allCustomers = [];
            if (custRes.ok) {
                allCustomers = await custRes.json();
            }

            // Aggregate bookings count per customer for this salon
            const bookingsCountByCust = {};
            bookingsList.forEach((b) => {
                bookingsCountByCust[b.customer_id] = (bookingsCountByCust[b.customer_id] || 0) + 1;
            });

            // Filter customers who booked at this salon (or show all if none yet)
            const matched = allCustomers
                .filter((c) => bookingsCountByCust[c.id])
                .map((c) => ({
                    ...c,
                    bookingsCount: bookingsCountByCust[c.id],
                }));

            setCustomerStats(matched);
        } catch (err) {
            console.error("Owner customers error:", err);
            setError("Server connection error.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSalonCustomers();
    }, []);

    return (
        <div className="owner-layout">
            <OwnerNavbar />

            <main className="owner-main-content">
                <div className="owner-page-header">
                    <div>
                        <h1>👥 Salon Customers</h1>
                        <p>
                            Client directory for {salon ? <strong>{salon.name}</strong> : "your salon"}.
                        </p>
                    </div>
                </div>

                {loading && <h3>Loading customers...</h3>}
                {error && <div className="alert error">⚠️ {error}</div>}

                {!loading && !salon && (
                    <div className="empty-state">
                        <p>You haven't registered your salon yet.</p>
                        <button className="submit-btn" onClick={() => navigate("/owner/salon")}>
                            ➕ Register Salon First
                        </button>
                    </div>
                )}

                {!loading && salon && (
                    <>
                        {customerStats.length === 0 ? (
                            <div className="empty-state">
                                <h3>No customer appointments yet</h3>
                                <p>Once customers book appointments at your salon, their profiles and history will appear here.</p>
                            </div>
                        ) : (
                            <div className="customer-grid">
                                {customerStats.map((cust) => (
                                    <div className="customer-card owner-cust-card" key={cust.id}>
                                        <div className="customer-card-header">
                                            <div className="customer-avatar">
                                                {cust.name ? cust.name.charAt(0).toUpperCase() : "C"}
                                            </div>
                                            <div>
                                                <h3>{cust.name}</h3>
                                                <span className="customer-tag">
                                                    📅 {cust.bookingsCount} {cust.bookingsCount === 1 ? "Booking" : "Bookings"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="customer-info">
                                            <p>📧 <strong>Email:</strong> {cust.email}</p>
                                            <p>📞 <strong>Phone:</strong> {cust.phone || "Not provided"}</p>
                                            {cust.address && <p>📍 <strong>City:</strong> {cust.address}</p>}
                                        </div>

                                        <div className="owner-cust-action">
                                            <button
                                                className="details-btn small"
                                                onClick={() => navigate("/owner/bookings")}
                                            >
                                                View Booking History →
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default OwnerCustomers;
