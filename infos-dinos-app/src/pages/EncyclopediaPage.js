import React, { useState, useEffect } from 'react';
// import mockDinosaurs from '../data/mockData.js'; // Removed mockData import
import DinosaurCard from '../components/DinosaurCard.js';
import './EncyclopediaPage.css'; // Import the CSS file

const EncyclopediaPage = () => {
  const [dinosaures, setDinosaures] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Added isLoading state
  const [error, setError] = useState(null); // Added error state

  useEffect(() => {
    const fetchDinosaures = async () => {
      setIsLoading(true); // Set loading true at the start of fetch
      setError(null); // Reset error state
      try {
        const response = await fetch('/api/dinosaures'); // Fetch from backend API
        if (!response.ok) {
          // Try to parse error message from backend if available
          let errorMessage = `Erreur HTTP: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // Ignore if error response is not JSON
          }
          throw new Error(errorMessage);
        }
        const data = await response.json();
        const sortedDinos = [...data].sort((a, b) => {
          return a.nomComplet.localeCompare(b.nomComplet, 'fr', { sensitivity: 'base' });
        });
        setDinosaures(sortedDinos);
      } catch (err) {
        console.error("Erreur lors de la récupération des dinosaures:", err);
        setError(err.message || "Une erreur est survenue lors de la récupération des données.");
      } finally {
        setIsLoading(false); // Set loading to false after fetch attempt (success or fail)
      }
    };

    fetchDinosaures();
  }, []); // Empty dependency array means this runs once on mount

  if (isLoading) {
    return <div className="encyclopedia-container"><p className="loading-message">Chargement...</p></div>;
  }

  if (error) {
    return <div className="encyclopedia-container"><p className="error-message">Erreur: {error}</p></div>;
  }

  return (
    <div className="encyclopedia-container">
      <h1 className="encyclopedia-title">Encyclopédie des Dinosaures</h1>
      {dinosaures.length === 0 && !isLoading && !error ? (
        <p>Aucun dinosaure trouvé.</p>
      ) : (
        <div className="encyclopedia-grid">
          {dinosaures.map(dinosaur => (
            <DinosaurCard key={dinosaur.id} dinosaur={dinosaur} />
          ))}
        </div>
      )}
    </div>
  );
};

export default EncyclopediaPage;
