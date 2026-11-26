import { Navigate, Outlet } from "react-router";
import { getToken } from "../api/client";

// only for guests (login, register), logged in users go to /decks
export default function GuestRoute() {
    if (getToken() !== null) {
        return <Navigate to="/decks" replace />;
    }
    return <Outlet />;
}
