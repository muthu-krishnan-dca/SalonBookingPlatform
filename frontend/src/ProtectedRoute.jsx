import { Navigate } from "react-router-dom";
import { isAuthenticated, getUserRole } from "./auth";

function ProtectedRoute({ children, allowedRoles }) {
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const role = getUserRole();
        if (!allowedRoles.includes(role)) {
            return <Navigate to="/" replace />;
        }
    }

    return children;
}

export default ProtectedRoute;
