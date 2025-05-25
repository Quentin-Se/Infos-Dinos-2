import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EncyclopediaPage from './pages/EncyclopediaPage';
import AdminPage from './pages/AdminPage'; // Import AdminPage
import LoginPage from './pages/LoginPage'; // Import LoginPage
import Navbar from './components/Navbar'; // Import Navbar
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute

function App() {
  return (
    <Router>
      <Navbar /> {/* Add Navbar here */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/encyclopedie" element={<EncyclopediaPage />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/login" element={<LoginPage />} /> {/* Add Login Route */}
      </Routes>
    </Router>
  );
}

export default App;
