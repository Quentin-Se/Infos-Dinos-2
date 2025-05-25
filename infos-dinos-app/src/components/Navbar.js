import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import './Navbar.css'; 

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth(); // Get auth state and logout function
  const navigate = useNavigate(); // For navigation

  const handleLogout = () => {
    logout(); // Clear auth state in context and localStorage
    navigate('/login'); // Redirect to login page
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-link">
        Accueil
      </Link>
      <Link to="/encyclopedie" className="nav-link">
        Encyclopédie
      </Link>
      {/* Conditionally render Admin link - good practice though not explicitly asked for in this step */}
      {isAuthenticated && (
         <Link to="/admin" className="nav-link">
            Admin
         </Link>
      )}
      {isAuthenticated ? (
        <button onClick={handleLogout} className="nav-link nav-button logout-button">
          Déconnexion
        </button>
      ) : (
        <Link to="/login" className="nav-link">
          Connexion Admin
        </Link>
      )}
    </nav>
  );
};

export default Navbar;
