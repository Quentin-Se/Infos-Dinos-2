import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Will create this file next

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/" className="nav-link">
        Accueil
      </Link>
      <Link to="/encyclopedie" className="nav-link">
        Encyclopédie
      </Link>
    </nav>
  );
};

export default Navbar;
