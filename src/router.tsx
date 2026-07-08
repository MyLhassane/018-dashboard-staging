import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import AppShell from "./components/layout/AppShell";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Players from "./pages/Players";
import Challenges from "./pages/Challenges";
import GameChallenges from "./pages/GameChallenges";
import Categories from "./pages/Categories";
import Config from "./pages/Config";
import Publish from "./pages/Publish";
import DevLog from "./pages/DevLog";
import DataLog from "./pages/DataLog";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <span className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <span className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Overview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/players"
          element={
            <ProtectedRoute>
              <Players />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challenges"
          element={
            <ProtectedRoute>
              <Challenges />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challenges/elphenomeno"
          element={
            <ProtectedRoute>
              <GameChallenges gameType="elphenomeno" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challenges/connections"
          element={
            <ProtectedRoute>
              <GameChallenges gameType="connections" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challenges/factor"
          element={
            <ProtectedRoute>
              <GameChallenges gameType="factor" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challenges/decode"
          element={
            <ProtectedRoute>
              <GameChallenges gameType="decode" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challenges/impostor"
          element={
            <ProtectedRoute>
              <GameChallenges gameType="impostor" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challenges/grid"
          element={
            <ProtectedRoute>
              <GameChallenges gameType="grid" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <Categories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/config"
          element={
            <ProtectedRoute>
              <Config />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system/dev-log"
          element={
            <ProtectedRoute>
              <DevLog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system/data-log"
          element={
            <ProtectedRoute>
              <DataLog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/publish"
          element={
            <ProtectedRoute>
              <Publish />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
