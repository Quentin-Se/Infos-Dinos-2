import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EncyclopediaPage from './pages/EncyclopediaPage';
import AdminPage from './pages/AdminPage'; // Import AdminPage
import Navbar from './components/Navbar'; // Import Navbar

function App() {
  return (
    <Router>
      <Navbar /> {/* Add Navbar here */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/encyclopedie" element={<EncyclopediaPage />} />
        <Route path="/admin" element={<AdminPage />} /> {/* Add Admin Route */}
      </Routes>
    </Router>
  );
}

export default App;
