import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomerBottomNav from "./CustomerBottomNav";

// Comprehensive Cascading Location Hierarchy (Country -> State -> District -> Area)
const LOCATION_HIERARCHY = {
    "India": {
        "Tamil Nadu": {
            "Tirunelveli": [
                "Palayamkottai",
                "Tirunelveli Town",
                "Tirunelveli Junction",
                "Vannarpettai",
                "Melapalayam",
                "Perumalpuram",
                "Sankarankovil",
                "Ambasamudram"
            ],
            "Thoothukudi (Tuticorin)": [
                "Thoothukudi Town",
                "Eral",
                "Tiruchendur",
                "Kovilpatti",
                "Millerpuram",
                "SIPCOT",
                "Spicnagar",
                "Muthiapuram"
            ],
            "Madurai": [
                "Madurai Main",
                "Anna Nagar",
                "KK Nagar",
                "Simmakkal",
                "Goripalayam",
                "Tallakulam",
                "Sellur",
                "Thiruparankundram",
                "Villapuram",
                "Mattuthavani"
            ],
            "Chennai": [
                "T. Nagar",
                "Anna Nagar",
                "Velachery",
                "Adyar",
                "Mylapore",
                "Nungambakkam",
                "Tambaram",
                "Guindy",
                "Chromepet",
                "Porur",
                "Kilpauk"
            ],
            "Coimbatore": [
                "Gandhipuram",
                "RS Puram",
                "Peelamedu",
                "Saibaba Colony",
                "Saravanampatti",
                "Singanallur",
                "Ukkadam",
                "Kovaipudur"
            ],
            "Salem": [
                "Fairlands",
                "Hasthampatti",
                "Suramangalam",
                "Alagapuram",
                "Shevapet",
                "Ammapet"
            ],
            "Tiruchirappalli (Trichy)": [
                "Thillai Nagar",
                "Cantonment",
                "KK Nagar",
                "Srirangam",
                "Woraiyur",
                "Ponmalai"
            ],
            "Erode": [
                "Erode Main",
                "Perundurai",
                "Bhavani",
                "Gobichettipalayam"
            ],
            "Vellore": [
                "Vellore Fort Area",
                "Katpadi",
                "Sathuvachari",
                "Gandhi Nagar"
            ]
        },
        "Karnataka": {
            "Bengaluru (Bangalore)": [
                "Koramangala",
                "Indiranagar",
                "HSR Layout",
                "Whitefield",
                "Jayanagar",
                "JP Nagar",
                "Electronic City",
                "BTM Layout",
                "Malleshwaram"
            ],
            "Mysuru (Mysore)": [
                "Gokulam",
                "Jayalakshmipuram",
                "Kuvempunagar",
                "Vijayanagar",
                "Saraswathipuram"
            ],
            "Mangaluru (Mangalore)": [
                "Kadri",
                "Bejai",
                "Kodialbail",
                "Lalbagh",
                "Hampankatta"
            ]
        },
        "Kerala": {
            "Ernakulam (Kochi)": [
                "MG Road",
                "Marine Drive",
                "Kakkanad",
                "Edappally",
                "Fort Kochi",
                "Palarivattom"
            ],
            "Thiruvananthapuram": [
                "Kowdiar",
                "Pattom",
                "Vellayambalam",
                "Kazhakkoottam",
                "Statue"
            ],
            "Kozhikode (Calicut)": [
                "Mavoor Road",
                "Beach Road",
                "Palayam",
                "Thondayad"
            ]
        },
        "Maharashtra": {
            "Mumbai": [
                "Bandra",
                "Andheri",
                "Juhu",
                "Colaba",
                "Dadar",
                "Powai",
                "Borivali",
                "Thane"
            ],
            "Pune": [
                "Koregaon Park",
                "Kothrud",
                "Viman Nagar",
                "Baner",
                "Hinjewadi",
                "Aundh",
                "FC Road"
            ]
        },
        "Telangana": {
            "Hyderabad": [
                "Banjara Hills",
                "Jubilee Hills",
                "Hitec City",
                "Gachibowli",
                "Madhapur",
                "Kukatpally",
                "Secunderabad"
            ]
        },
        "Delhi (NCR)": {
            "New Delhi": [
                "Connaught Place",
                "South Extension",
                "Hauz Khas",
                "Saket",
                "Lajpat Nagar",
                "Karol Bagh",
                "Dwarka"
            ]
        }
    },
    "United Arab Emirates": {
        "Dubai": {
            "Dubai Main": [
                "Downtown Dubai",
                "Dubai Marina",
                "Deira",
                "Jumeirah",
                "Business Bay",
                "Al Barsha",
                "Bur Dubai"
            ]
        },
        "Abu Dhabi": {
            "Abu Dhabi Main": [
                "Al Zahiyah",
                "Al Khalidiyah",
                "Corniche",
                "Yas Island"
            ]
        }
    },
    "Singapore": {
        "Singapore Central": {
            "Central Region": [
                "Orchard Road",
                "Marina Bay",
                "Bugis",
                "Chinatown",
                "Tampines",
                "Jurong East"
            ]
        }
    }
};

// Standard coordinates for common Indian cities to compute accurate distance
const CITY_COORDS = {
    chennai: { lat: 13.0827, lon: 80.2707 },
    coimbatore: { lat: 11.0168, lon: 76.9558 },
    madurai: { lat: 9.9252, lon: 78.1198 },
    mudurai: { lat: 9.9252, lon: 78.1198 },
    salem: { lat: 11.6643, lon: 78.1460 },
    trichy: { lat: 10.7905, lon: 78.7047 },
    tiruchirappalli: { lat: 10.7905, lon: 78.7047 },
    bangalore: { lat: 12.9716, lon: 77.5946 },
    bengaluru: { lat: 12.9716, lon: 77.5946 },
    hyderabad: { lat: 17.3850, lon: 78.4867 },
    mumbai: { lat: 19.0760, lon: 72.8777 },
    delhi: { lat: 28.7041, lon: 77.1025 },
    pune: { lat: 18.5204, lon: 73.8567 },
    kochi: { lat: 9.9312, lon: 76.2673 },
    mysore: { lat: 12.2958, lon: 76.6394 },
    tirunelveli: { lat: 8.7139, lon: 77.7567 },
    palayamkottai: { lat: 8.7139, lon: 77.7567 },
    vellore: { lat: 12.9165, lon: 79.1325 },
    erode: { lat: 11.3410, lon: 77.7172 },
    thoothukudi: { lat: 8.7642, lon: 78.1348 },
    thoothukudu: { lat: 8.7642, lon: 78.1348 },
    tuticorin: { lat: 8.7642, lon: 78.1348 },
    pondicherry: { lat: 11.9416, lon: 79.8083 },
    puducherry: { lat: 11.9416, lon: 79.8083 }
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
}

const POPULAR_SERVICES = [
    "Haircut",
    "Hair Spa",
    "Facial",
    "Beard Trim",
    "Hair Wash",
    "Hair Color",
    "Head Massage",
    "Bridal"
];

function Salons() {
    const [salons, setSalons] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    // Cascading Location Filters: Country -> State -> District -> Area
    const [selectedCountry, setSelectedCountry] = useState("ALL");
    const [selectedState, setSelectedState] = useState("ALL");
    const [selectedDistrict, setSelectedDistrict] = useState("ALL");
    const [selectedArea, setSelectedArea] = useState("ALL");

    const [selectedService, setSelectedService] = useState("ALL");
    const [sortBy, setSortBy] = useState("DEFAULT"); // DEFAULT | NEAREST | NAME
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetch("http://127.0.0.1:8000/salons/")
            .then((response) => response.json())
            .then((data) => {
                setSalons(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching salons:", error);
                setLoading(false);
            });
    }, []);

    // Location Change Handlers
    const handleCountryChange = (country) => {
        setSelectedCountry(country);
        setSelectedState("ALL");
        setSelectedDistrict("ALL");
        setSelectedArea("ALL");
    };

    const handleStateChange = (state) => {
        setSelectedState(state);
        setSelectedDistrict("ALL");
        setSelectedArea("ALL");
    };

    const handleDistrictChange = (district) => {
        setSelectedDistrict(district);
        setSelectedArea("ALL");
    };

    const handleAreaChange = (area) => {
        setSelectedArea(area);
    };

    // Calculate Available Options for Each Cascading Dropdown
    const countryOptions = Object.keys(LOCATION_HIERARCHY);

    const stateOptions =
        selectedCountry !== "ALL" && LOCATION_HIERARCHY[selectedCountry]
            ? Object.keys(LOCATION_HIERARCHY[selectedCountry])
            : [];

    const districtOptions =
        selectedCountry !== "ALL" &&
        selectedState !== "ALL" &&
        LOCATION_HIERARCHY[selectedCountry]?.[selectedState]
            ? Object.keys(LOCATION_HIERARCHY[selectedCountry][selectedState])
            : [];

    const areaOptions =
        selectedCountry !== "ALL" &&
        selectedState !== "ALL" &&
        selectedDistrict !== "ALL" &&
        LOCATION_HIERARCHY[selectedCountry]?.[selectedState]?.[selectedDistrict]
            ? LOCATION_HIERARCHY[selectedCountry][selectedState][selectedDistrict]
            : [];

    // Detect Real/Live User Location via Browser GPS and Reverse Geocoding
    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser.");
            return;
        }
        setLocationLoading(true);
        setLocationError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
                        { headers: { "User-Agent": "SalonBookingPlatform/1.0" } }
                    );
                    if (response.ok) {
                        const data = await response.json();
                        const addr = data.address || {};
                        const detectedCity =
                            addr.city ||
                            addr.town ||
                            addr.village ||
                            addr.county ||
                            addr.state_district ||
                            "Your City";
                        const detectedArea =
                            addr.suburb ||
                            addr.neighbourhood ||
                            addr.residential ||
                            detectedCity;
                        const state = addr.state || "";

                        setUserLocation({
                            city: detectedCity,
                            area: detectedArea,
                            state: state,
                            display:
                                detectedArea !== detectedCity
                                    ? `${detectedArea}, ${detectedCity}`
                                    : `${detectedCity}${state ? ", " + state : ""}`,
                            coords: { lat: latitude, lon: longitude }
                        });
                        setSortBy("NEAREST");
                    } else {
                        setUserLocation({
                            city: "Live Location",
                            area: "Current Area",
                            display: "Live GPS Location",
                            coords: { lat: latitude, lon: longitude }
                        });
                        setSortBy("NEAREST");
                    }
                } catch (err) {
                    console.warn("Reverse geocoding fallback:", err);
                    setUserLocation({
                        city: "Live Location",
                        area: "Current Area",
                        display: "Live GPS Location",
                        coords: { lat: latitude, lon: longitude }
                    });
                    setSortBy("NEAREST");
                } finally {
                    setLocationLoading(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                setLocationLoading(false);
                if (error.code === error.PERMISSION_DENIED) {
                    setLocationError("Location permission denied. Please allow location access in your browser.");
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    setLocationError("Location information is unavailable.");
                } else {
                    setLocationError("Unable to retrieve location. Please check browser settings.");
                }
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
        );
    };

    const clearLocation = () => {
        setUserLocation(null);
        if (sortBy === "NEAREST") {
            setSortBy("DEFAULT");
        }
        setLocationError(null);
    };

    const resetAllFilters = () => {
        setSearchTerm("");
        setSelectedCountry("ALL");
        setSelectedState("ALL");
        setSelectedDistrict("ALL");
        setSelectedArea("ALL");
        setSelectedService("ALL");
        setSortBy("DEFAULT");
    };

    // Calculate distance for each salon
    const getSalonDistance = (salon) => {
        if (!userLocation?.coords) return null;
        const cityKey = (salon.city || "").toLowerCase().trim();
        const salonCoords = CITY_COORDS[cityKey];
        if (salonCoords) {
            return calculateDistance(
                userLocation.coords.lat,
                userLocation.coords.lon,
                salonCoords.lat,
                salonCoords.lon
            );
        }
        return null;
    };

    // Helper: checks if a salon matches the chosen cascading location filter
    const matchesLocationFilter = (salon) => {
        const fullLocationText = `${salon.name || ""} ${salon.city || ""} ${salon.address || ""}`.toLowerCase();

        // 1. Area filter (Most specific)
        if (selectedArea !== "ALL") {
            const areaKey = selectedArea.toLowerCase();
            return fullLocationText.includes(areaKey);
        }

        // 2. District filter
        if (selectedDistrict !== "ALL") {
            // Strip any parenthesis e.g. "Thoothukudi (Tuticorin)" -> ["thoothukudi", "tuticorin"]
            const cleanDistrict = selectedDistrict.toLowerCase().replace(/[()]/g, " ");
            const districtKeywords = cleanDistrict.split(/\s+/).filter((w) => w.length > 2);
            
            // Check if district name or any area in this district matches
            const matchedDistrict = districtKeywords.some((kw) => fullLocationText.includes(kw));
            if (matchedDistrict) return true;

            const districtAreas = LOCATION_HIERARCHY[selectedCountry]?.[selectedState]?.[selectedDistrict] || [];
            return districtAreas.some((a) => fullLocationText.includes(a.toLowerCase()));
        }

        // 3. State filter
        if (selectedState !== "ALL") {
            const stateDistricts = Object.keys(LOCATION_HIERARCHY[selectedCountry]?.[selectedState] || {});
            return stateDistricts.some((d) => {
                const cleanDist = d.toLowerCase().replace(/[()]/g, " ");
                const distWords = cleanDist.split(/\s+/).filter((w) => w.length > 2);
                if (distWords.some((w) => fullLocationText.includes(w))) return true;

                const areas = LOCATION_HIERARCHY[selectedCountry]?.[selectedState]?.[d] || [];
                return areas.some((a) => fullLocationText.includes(a.toLowerCase()));
            });
        }

        // 4. Country filter
        if (selectedCountry !== "ALL") {
            // All Indian salons match India
            if (selectedCountry === "India") return true;
        }

        return true;
    };

    // Filter and sort salons
    const processedSalons = salons
        .map((salon) => ({
            ...salon,
            distance: getSalonDistance(salon)
        }))
        .filter((salon) => {
            // 1. Search text filter
            const term = searchTerm.toLowerCase().trim();
            const matchesSearch =
                !term ||
                (salon.name && salon.name.toLowerCase().includes(term)) ||
                (salon.city && salon.city.toLowerCase().includes(term)) ||
                (salon.address && salon.address.toLowerCase().includes(term)) ||
                (salon.description && salon.description.toLowerCase().includes(term)) ||
                (salon.phone && salon.phone.includes(term));

            if (!matchesSearch) return false;

            // 2. Cascading Location Filter
            if (!matchesLocationFilter(salon)) {
                return false;
            }

            // 3. Service filter
            if (selectedService !== "ALL") {
                if (!(salon.description || "").toLowerCase().includes(selectedService.toLowerCase())) {
                    return false;
                }
            }

            return true;
        });

    // Sorting
    if (sortBy === "NEAREST" && userLocation?.coords) {
        processedSalons.sort((a, b) => {
            if (a.distance === null && b.distance === null) return 0;
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
        });
    } else if (sortBy === "NAME") {
        processedSalons.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    // Active filters count
    const activeFiltersCount =
        (selectedCountry !== "ALL" ? 1 : 0) +
        (selectedState !== "ALL" ? 1 : 0) +
        (selectedDistrict !== "ALL" ? 1 : 0) +
        (selectedArea !== "ALL" ? 1 : 0) +
        (selectedService !== "ALL" ? 1 : 0) +
        (sortBy !== "DEFAULT" ? 1 : 0);

    return (
        <div className="salons-page customer-page-with-bottom-nav">
            <div className="page-header salons-header">
                <div>
                    <h1>Salon Booking System</h1>
                    <h2>💇 Available Salons</h2>
                </div>
                <div className="header-actions">
                    <button className="nav-btn" onClick={() => navigate("/")}>
                        🏠 Dashboard
                    </button>
                    <button className="nav-btn" onClick={() => navigate("/bookings")}>
                        📅 My Bookings
                    </button>
                </div>
            </div>

            {/* Compact Search & Filter Section */}
            <div className="search-and-location-wrapper">
                <div className="compact-search-filter-row">
                    {/* Compact Search Input */}
                    <div className="compact-search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            className="salon-search-input"
                            placeholder="Search salons, services, areas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                className="search-clear-btn"
                                onClick={() => setSearchTerm("")}
                                title="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Live GPS Location Button */}
                    <button
                        type="button"
                        className={`location-detect-btn compact-loc-btn ${userLocation ? "active" : ""} ${
                            locationLoading ? "loading" : ""
                        }`}
                        onClick={handleDetectLocation}
                        title="Use real live GPS location to sort nearest salons"
                        disabled={locationLoading}
                    >
                        {locationLoading ? (
                            <>
                                <span className="location-spinner"></span>
                                <span className="loc-btn-text">Locating...</span>
                            </>
                        ) : userLocation ? (
                            <>
                                <span className="loc-pulse-dot"></span>
                                <span className="loc-btn-text">📍 Near Me</span>
                            </>
                        ) : (
                            <>
                                <span className="loc-icon">📍</span>
                                <span className="loc-btn-text">Live Location</span>
                            </>
                        )}
                    </button>

                    {/* Filter Toggle Button */}
                    <button
                        type="button"
                        className={`salon-filter-toggle-btn ${showFilterPanel || activeFiltersCount > 0 ? "active" : ""}`}
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                        title="Filter by Country, State, District, Area, or Service"
                    >
                        <span className="filter-btn-icon">⚙️</span>
                        <span className="filter-btn-text">Filter</span>
                        {activeFiltersCount > 0 && (
                            <span className="filter-count-badge">{activeFiltersCount}</span>
                        )}
                    </button>
                </div>

                {/* Collapsible / Interactive Cascading Location & Service Filter Panel */}
                {showFilterPanel && (
                    <div className="salon-filter-dropdown-panel">
                        <div className="filter-panel-header">
                            <div>
                                <span className="filter-panel-title">🎯 Advanced Location & Service Filter</span>
                                <p style={{ margin: "2px 0 0 0", fontSize: "11.5px", color: "#94a3b8" }}>
                                    Select Country ➔ State ➔ District ➔ Area to narrow down salon locations
                                </p>
                            </div>
                            {activeFiltersCount > 0 && (
                                <button className="filter-reset-link" onClick={resetAllFilters}>
                                    🔄 Reset All
                                </button>
                            )}
                        </div>

                        {/* 4-Step Cascading Location Controls */}
                        <div className="cascading-location-section">
                            <span className="section-mini-tag">📍 Cascading Location Filters</span>
                            <div className="filter-controls-grid location-4-grid">
                                {/* 1. Country Dropdown */}
                                <div className="filter-control-group">
                                    <label>🌍 Country</label>
                                    <select
                                        value={selectedCountry}
                                        onChange={(e) => handleCountryChange(e.target.value)}
                                        className="filter-select-input"
                                    >
                                        <option value="ALL">All Countries</option>
                                        {countryOptions.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* 2. State Dropdown */}
                                <div className="filter-control-group">
                                    <label>🗺️ State</label>
                                    <select
                                        value={selectedState}
                                        onChange={(e) => handleStateChange(e.target.value)}
                                        className={`filter-select-input ${selectedCountry === "ALL" ? "disabled-select" : ""}`}
                                        disabled={selectedCountry === "ALL"}
                                    >
                                        <option value="ALL">
                                            {selectedCountry === "ALL" ? "Select Country first" : "All States"}
                                        </option>
                                        {stateOptions.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* 3. District Dropdown */}
                                <div className="filter-control-group">
                                    <label>🏙️ District / City</label>
                                    <select
                                        value={selectedDistrict}
                                        onChange={(e) => handleDistrictChange(e.target.value)}
                                        className={`filter-select-input ${selectedState === "ALL" ? "disabled-select" : ""}`}
                                        disabled={selectedState === "ALL"}
                                    >
                                        <option value="ALL">
                                            {selectedState === "ALL" ? "Select State first" : "All Districts"}
                                        </option>
                                        {districtOptions.map((d) => (
                                            <option key={d} value={d}>
                                                {d}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* 4. Area Dropdown */}
                                <div className="filter-control-group">
                                    <label>📍 Area / Locality</label>
                                    <select
                                        value={selectedArea}
                                        onChange={(e) => handleAreaChange(e.target.value)}
                                        className={`filter-select-input ${selectedDistrict === "ALL" ? "disabled-select" : ""}`}
                                        disabled={selectedDistrict === "ALL"}
                                    >
                                        <option value="ALL">
                                            {selectedDistrict === "ALL" ? "Select District first" : "All Areas"}
                                        </option>
                                        {areaOptions.map((a) => (
                                            <option key={a} value={a}>
                                                {a}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Extra Preferences: Services & Sorting */}
                        <div className="filter-controls-grid extra-filters-grid" style={{ marginTop: "12px" }}>
                            {/* Service Filter */}
                            <div className="filter-control-group">
                                <label>✂️ Service Offered</label>
                                <select
                                    value={selectedService}
                                    onChange={(e) => setSelectedService(e.target.value)}
                                    className="filter-select-input"
                                >
                                    <option value="ALL">All Services</option>
                                    {POPULAR_SERVICES.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sort By */}
                            <div className="filter-control-group">
                                <label>⚡ Sort By</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="filter-select-input"
                                >
                                    <option value="DEFAULT">Default Order</option>
                                    <option value="NEAREST" disabled={!userLocation}>
                                        Nearest Distance {userLocation ? "⚡" : "(Enable GPS first)"}
                                    </option>
                                    <option value="NAME">Alphabetical (A - Z)</option>
                                </select>
                            </div>
                        </div>

                        {/* Active Filter Location Breadcrumbs */}
                        {(selectedCountry !== "ALL" || selectedState !== "ALL" || selectedDistrict !== "ALL" || selectedArea !== "ALL") && (
                            <div className="location-breadcrumbs-pill">
                                <span>🎯 Filtered Location:</span>
                                <strong>
                                    {selectedCountry !== "ALL" && selectedCountry}
                                    {selectedState !== "ALL" && ` > ${selectedState}`}
                                    {selectedDistrict !== "ALL" && ` > ${selectedDistrict}`}
                                    {selectedArea !== "ALL" && ` > ${selectedArea}`}
                                </strong>
                            </div>
                        )}

                        <div className="filter-panel-footer">
                            <span className="filter-results-summary">
                                Showing <strong>{processedSalons.length}</strong> of <strong>{salons.length}</strong> salons
                            </span>
                            <button
                                className="filter-close-btn"
                                onClick={() => setShowFilterPanel(false)}
                            >
                                Apply & Done
                            </button>
                        </div>
                    </div>
                )}

                {/* Real-Time Detected Location Active Banner */}
                {userLocation && (
                    <div className="detected-location-pill">
                        <span className="live-badge">
                            <span className="live-dot"></span> Live GPS
                        </span>
                        <span className="location-name">
                            📍 <strong>{userLocation.display}</strong>
                        </span>
                        <button
                            className="location-pill-refresh"
                            onClick={handleDetectLocation}
                            title="Update real location"
                            disabled={locationLoading}
                        >
                            🔄 Refresh
                        </button>
                        <button
                            className="location-pill-clear"
                            onClick={clearLocation}
                            title="Remove live location filter"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Location Error Notice */}
                {locationError && (
                    <div className="location-error-banner">
                        <span>⚠️ {locationError}</span>
                        <button onClick={() => setLocationError(null)}>✕</button>
                    </div>
                )}
            </div>

            {loading && <h3>Loading salons...</h3>}

            {!loading && salons.length === 0 && (
                <div className="empty-state">
                    <p>No salons available at the moment.</p>
                </div>
            )}

            {!loading && salons.length > 0 && processedSalons.length === 0 && (
                <div className="empty-state" style={{ maxWidth: "520px", margin: "30px auto" }}>
                    <h3>🔍 No matching salons found</h3>
                    <p>
                        No salons found for your selected filters (
                        {selectedCountry !== "ALL" && `${selectedCountry} `}
                        {selectedState !== "ALL" && `> ${selectedState} `}
                        {selectedDistrict !== "ALL" && `> ${selectedDistrict} `}
                        {selectedArea !== "ALL" && `> ${selectedArea}`}
                        ).
                    </p>
                    <button
                        className="submit-btn"
                        style={{ marginTop: "12px" }}
                        onClick={resetAllFilters}
                    >
                        Reset All Filters
                    </button>
                </div>
            )}

            {/* Compact, Sleek Modern Salons Grid */}
            <div className="salon-grid">
                {processedSalons.map((salon) => (
                    <div className="salon-card" key={salon.id}>
                        <div className="salon-card-header">
                            <h3 title={salon.name}>💇 {salon.name}</h3>
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                <span
                                    style={{
                                        fontSize: "11px",
                                        fontWeight: "800",
                                        padding: "2px 8px",
                                        borderRadius: "10px",
                                        background: salon.is_open ? "rgba(16, 185, 129, 0.18)" : "rgba(239, 68, 68, 0.18)",
                                        color: salon.is_open ? "#34d399" : "#f87171",
                                        border: salon.is_open ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)"
                                    }}
                                >
                                    {salon.is_open ? "🟢 Open" : "🔴 Closed"}
                                </span>
                                {salon.distance !== null && (
                                    <span
                                        className="distance-badge"
                                        title="Approx distance from your current location"
                                    >
                                        ⚡ {salon.distance} km
                                    </span>
                                )}
                            </div>
                        </div>

                        {salon.description && (
                            <p className="salon-desc" title={salon.description}>
                                {salon.description}
                            </p>
                        )}

                        <div className="salon-meta-info">
                            <p className="salon-location" title={`${salon.address}, ${salon.city}`}>
                                📍 {salon.address}, <strong>{salon.city}</strong>
                            </p>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px", fontSize: "12px", color: "#94a3b8" }}>
                                <span>⏰ {salon.opening_time || "09:00 AM"} – {salon.closing_time || "09:00 PM"}</span>
                                {salon.phone && (
                                    <span className="salon-phone">
                                        📞 {salon.phone}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="salon-card-actions">
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    salon.name + " " + salon.address + " " + salon.city
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="map-direction-btn"
                                title="Open exact location in Google Maps"
                            >
                                🗺️ Map
                            </a>
                            <button
                                className="salon-book-btn"
                                onClick={() => navigate(`/salons/${salon.id}`)}
                            >
                                {salon.is_open ? "View & Book →" : "View Salon Info →"}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <CustomerBottomNav />
        </div>
    );
}

export default Salons;