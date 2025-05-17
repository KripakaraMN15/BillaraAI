import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import InvoiceEditorPage from './pages/InvoiceEditorPage';
import PublicInvoicePage from './pages/PublicInvoicePage';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <DashboardPage /> : <LandingPage />} />
        <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/invoice/new" element={user ? <InvoiceEditorPage /> : <Navigate to="/login" />} />
        <Route path="/invoice/edit/:id" element={user ? <InvoiceEditorPage /> : <Navigate to="/login" />} />
        <Route path="/public/invoice/:id" element={<PublicInvoicePage />} />
        {/* Support the user's requested route format */}
        <Route path="/invoice/:id" element={<PublicInvoicePage />} />
      </Routes>
    </Router>
  );
}
