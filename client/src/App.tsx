import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';

function BoardPlaceholder() {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: '2rem' }}>
      <h1>TaskFlow Board</h1>
      <p>Logged in as: {user?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

function LoginPlaceholder() {
  return <div style={{ padding: '2rem' }}>Login page (coming next)</div>;
}

function SignupPlaceholder() {
  return <div style={{ padding: '2rem' }}>Signup page (coming next)</div>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPlaceholder />} />
      <Route path="/signup" element={<SignupPlaceholder />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <BoardPlaceholder />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;