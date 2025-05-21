import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css'; // Import the CSS file

const HomePage = () => {
  return (
    <div className="homepage-container">
      <header>
        <h1 className="homepage-headline">Bienvenue à Infos Dinos!</h1>
      </header>
      <main>
        <p className="homepage-intro">
          Plongez dans le monde fascinant des dinosaures! Découvrez leurs espèces, leurs habitats, et les mystères de leur règne sur Terre.
        </p>
        <Link to="/encyclopedie" className="homepage-cta">
          Explorer l'encyclopédie
        </Link>
      </main>
    </div>
  );
};

export default HomePage;
