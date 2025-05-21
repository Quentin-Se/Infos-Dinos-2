import React, { useState, useEffect } from 'react';
import mockDinosaurs from '../data/mockData.js';
import DinosaurCard from '../components/DinosaurCard.js';
import './EncyclopediaPage.css'; // Import the CSS file

const EncyclopediaPage = () => {
  // Initialize state with the imported mock data
  const [dinosaures, setDinosaures] = useState([]);

  // useEffect to sort dinosaurs once when the component mounts
  useEffect(() => {
    const sortedDinos = [...mockDinosaurs].sort((a, b) => {
      return a.nomComplet.localeCompare(b.nomComplet, 'fr', { sensitivity: 'base' });
    });
    setDinosaures(sortedDinos);
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className="encyclopedia-container">
      <h1 className="encyclopedia-title">Encyclopédie des Dinosaures</h1>
      <div className="encyclopedia-grid">
        {dinosaures.map(dinosaur => (
          <DinosaurCard key={dinosaur.id} dinosaur={dinosaur} />
        ))}
      </div>
    </div>
  );
};

export default EncyclopediaPage;
