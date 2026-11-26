import { Navigate, Outlet } from "react-router";
import { getToken } from "../api/client";

// only for logged in users, otherwise redirect to /login
// this is only UX: the real protection is requireAuth in the backend
export default function ProtectedRoute() {
    if (getToken() === null) {
        return <Navigate to="/login" replace />;
    }
    return <Outlet />;
}
