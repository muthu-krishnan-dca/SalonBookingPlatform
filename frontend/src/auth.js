// Authentication helper functions for Salon Booking Platform
const USER_KEY = "salon_user";

export const getUser = () => {
    try {
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    } catch (e) {
        console.error("Error reading user from localStorage:", e);
        return null;
    }
};

export const setUser = (user) => {
    if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
};

export const removeUser = () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("user_id");
};

export const logout = () => {
    removeUser();
    window.location.href = "/login";
};

export const isAuthenticated = () => {
    const user = getUser();
    return !!(user && user.access_token);
};

export const getUserRole = () => {
    const user = getUser();
    return user && user.role ? String(user.role).toUpperCase() : "CUSTOMER";
};

export const isSalonOwner = () => {
    return getUserRole() === "SALON_OWNER";
};

export const isCustomer = () => {
    return getUserRole() === "CUSTOMER";
};
