import { Navigate, Route, Routes } from "react-router"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import DecksPage from "./pages/DecksPage"
import DeckDetailPage from "./pages/DeckDetailPage"
import LearnPage from "./pages/LearnPage"

export default function App() {
  return (
      <Routes>
        <Route path="/" element={<Navigate to="/decks" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/decks" element={<DecksPage />} />
        <Route path="/decks/:id" element={<DeckDetailPage />} />
        <Route path="/decks/:id/learn" element={<LearnPage />} />
      </Routes>
  )
}
