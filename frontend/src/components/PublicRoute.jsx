import { Navigate } from "react-router-dom";
import { isTokenValid } from "../utils/api";

export default function PublicRoute({ children }) {
    if (isTokenValid()) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
