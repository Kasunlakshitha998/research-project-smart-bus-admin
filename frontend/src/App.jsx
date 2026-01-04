import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RouteManagement from './pages/RouteManagement';
import BusManagement from './pages/BusManagement';
import LiveMap from './pages/LiveMap';
import ComplaintAnalysis from './pages/ComplaintAnalysis';
import PassengerPrediction from './pages/PassengerPrediction';
import UserManagement from './pages/UserManagement';
import RoleManagement from './pages/RoleManagement';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="routes" element={<RouteManagement />} />
            <Route path="buses" element={<BusManagement />} />
            <Route path="map" element={<LiveMap />} />
            <Route path="complaints" element={<ComplaintAnalysis />} />
            <Route path="predictions" element={<PassengerPrediction />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="roles" element={<RoleManagement />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
