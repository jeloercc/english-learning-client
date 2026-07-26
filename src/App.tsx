import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import AuthScreen from "@/pages/AuthScreen";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400" size={20} />
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/app"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
