import React from 'react';
import './DinosaurCard.css'; // Import the CSS file

const DinosaurCard = ({ dinosaur }) => {
  if (!dinosaur) {
    return <div className="dinosaur-card-error">Aucune donnée de dinosaure disponible.</div>;
  }

  const {
    nomComplet,
    famille,
    periodeGeologique,
    lieuDecouverte,
    anneeDecouverte,
    regimeAlimentaire,
    tailleMoyenne,
    poidsEstime,
    caracteristiquesMarquantes,
    anecdote,
    breveDescription,
    illustrationUrl,
    comparaisonHumainUrl
  } = dinosaur;

  let dietIconClass = "diet-icon";
  let dietIconContent = "❓"; // Default icon for unknown

  if (regimeAlimentaire) {
    if (regimeAlimentaire.type === "Carnivore") {
      dietIconClass += " carnivore";
      dietIconContent = regimeAlimentaire.icone || "🥩";
    } else if (regimeAlimentaire.type === "Herbivore") {
      dietIconClass += " herbivore";
      dietIconContent = regimeAlimentaire.icone || "🌿";
    } else if (regimeAlimentaire.type === "Omnivore") {
      dietIconClass += " omnivore";
      dietIconContent = regimeAlimentaire.icone || "🥩🌿";
    }
  }

  return (
    <div className="dinosaur-card">
      <h2>{nomComplet}</h2>
      
      <div className="dinosaur-illustration-placeholder">
        {illustrationUrl && illustrationUrl !== "placeholder_trex_illustration.jpg"  /* crude check for actual image */
          ? <img src={illustrationUrl} alt={`Illustration de ${nomComplet}`} /> 
          : "Illustration non disponible"}
      </div>

      <p><strong>Famille:</strong> {famille || 'N/A'}</p>
      <p><strong>Période Géologique:</strong> {periodeGeologique || 'N/A'}</p>
      <p><strong>Lieu de Découverte:</strong> {lieuDecouverte || 'N/A'}</p>
      <p><strong>Année de Découverte:</strong> {anneeDecouverte || 'N/A'}</p>
      
      <div className="diet-info">
        <strong>Régime Alimentaire:</strong> {regimeAlimentaire ? regimeAlimentaire.type : 'N/A'}
        {regimeAlimentaire && <span className={dietIconClass} aria-label={regimeAlimentaire.type}>{dietIconContent}</span>}
      </div>
      
      <p><strong>Taille Moyenne:</strong> {tailleMoyenne || 'N/A'}</p>
      <p><strong>Poids Estimé:</strong> {poidsEstime || 'N/A'}</p>
      
      <h3>Caractéristiques Marquantes:</h3>
      <p>{caracteristiquesMarquantes || 'N/A'}</p>
      
      {breveDescription && (
        <>
          <h3>Description Brève:</h3>
          <p>{breveDescription}</p>
        </>
      )}
      
      {anecdote && (
        <>
          <h3>Anecdote:</h3>
          <p>{anecdote}</p>
        </>
      )}

      <div className="dinosaur-human-comparison-placeholder">
         {comparaisonHumainUrl && comparaisonHumainUrl !== "placeholder_trex_comparison.jpg" /* crude check for actual image */
          ? <img src={comparaisonHumainUrl} alt={`Comparaison de taille de ${nomComplet} avec un humain`} />
          : "Comparaison non disponible"}
      </div>
    </div>
  );
};

export default DinosaurCard;
