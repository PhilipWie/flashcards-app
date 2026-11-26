import { Navigate, Route, Routes } from "react-router"
import Layout from "./components/Layout"
import ProtectedRoute from "./components/ProtectedRoute"
import GuestRoute from "./components/GuestRoute"
import { getToken } from "./api/client"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import DecksPage from "./pages/DecksPage"
import DeckDetailPage from "./pages/DeckDetailPage"
import LearnPage from "./pages/LearnPage"

// start page: decks if logged in, otherwise login
function HomeRedirect() {
  return <Navigate to={getToken() !== null ? "/decks" : "/login"} replace />
}

export default function App() {
  return (
      <Routes>
        {/* all pages share the Layout (top bar with theme toggle) */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomeRedirect />} />

          {/* only without login */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* only with login */}
          <Route element={<ProtectedRoute />}>
            <Route path="/decks" element={<DecksPage />} />
            <Route path="/decks/:id" element={<DeckDetailPage />} />
            <Route path="/decks/:id/learn" element={<LearnPage />} />
          </Route>
        </Route>
      </Routes>
  )
}
