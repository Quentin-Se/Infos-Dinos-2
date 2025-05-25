import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import './AdminPage.css'; // Import the CSS file

// API_KEY constant is removed

const initialDinoFormState = { 
  nomComplet: '',
  famille: '',
  periodeGeologique: '',
  lieuDecouverte: '',
  anneeDecouverte: '',
  regimeAlimentaire: { type: '', icone: '' },
  tailleMoyenne: '',
  poidsEstime: '',
  caracteristiquesMarquantes: '',
  anecdote: '',
  breveDescription: '',
  illustrationUrl: '',
  comparaisonHumainUrl: '',
  statutSpecial: '', 
  etatConservation: '' 
};

const AdminPage = () => {
  const [dinosaures, setDinosaures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // For general page errors
  const [showForm, setShowForm] = useState(false); // Renamed
  const [currentDinoData, setCurrentDinoData] = useState(initialDinoFormState); // Renamed
  const [editingDinosaurId, setEditingDinosaurId] = useState(null); 
  const [formError, setFormError] = useState(null); 
  const { token } = useAuth(); // Get token from AuthContext

  // Login state variables
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const fetchDinosaures = async () => {
    setIsLoading(true);
      try {
        const response = await fetch('/api/dinosaures');
        if (!response.ok) {
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
        const sortedData = [...data].sort((a, b) => 
          a.nomComplet.localeCompare(b.nomComplet, 'fr', { sensitivity: 'base' })
        );
        setDinosaures(sortedData);
      } catch (err) {
        console.error("Erreur lors de la récupération des dinosaures pour la page admin:", err);
        setError(err.message || "Une erreur est survenue lors de la récupération des données.");
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDinosaures();
    }
  }, [isAuthenticated]);

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setIsLoginLoading(true);
    setLoginError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful, token:', data.token);
        setIsAuthenticated(true);
        setUsername('');
        setPassword('');
      } else {
        setIsAuthenticated(false);
        try {
          const errorData = await response.json();
          setLoginError(errorData.message || 'Login failed');
        } catch (e) {
          setLoginError('Login failed. Please check credentials or server connection.');
        }
      }
    } catch (err) {
      console.error("Login API error:", err);
      setIsAuthenticated(false);
      setLoginError('Login failed. Please check credentials or server connection.');
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleOpenAddForm = () => { // Renamed and modified for clarity
    setEditingDinosaurId(null); // Ensure it's add mode
    setCurrentDinoData(initialDinoFormState); // Reset form data
    setShowForm(true);
    setFormError(null); 
  };

  const handleEditDinosaurClick = (dinosaur) => {
    setEditingDinosaurId(dinosaur.id);
    // Ensure all fields from initialDinoFormState are present, even if dinosaur object doesn't have them
    const dinoDataForEdit = { ...initialDinoFormState, ...dinosaur };
    setCurrentDinoData(dinoDataForEdit);
    setShowForm(true);
    setFormError(null);
  };

  const handleCurrentDinoDataChange = (event) => { // Renamed
    const { name, value } = event.target;
    if (name.startsWith("regimeAlimentaire.")) {
      const key = name.split(".")[1];
      setCurrentDinoData(prevState => ({ // Updated state variable
        ...prevState,
        regimeAlimentaire: {
          ...prevState.regimeAlimentaire,
          [key]: value
        }
      }));
    } else {
      setCurrentDinoData(prevState => ({ // Updated state variable
        ...prevState,
        [name]: value
      }));
    }
  };

  const handleFormSubmit = async (event) => { // Renamed and modified
    event.preventDefault();
    setFormError(null);
    
    if (!currentDinoData.nomComplet || !currentDinoData.famille) { // Use currentDinoData
        setFormError("Le nom complet et la famille sont requis.");
        return;
    }

    const method = editingDinosaurId ? 'PUT' : 'POST';
    const url = editingDinosaurId 
      ? `/api/dinosaures/${editingDinosaurId}` 
      : '/api/dinosaures';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Use JWT for Authorization
        },
        body: JSON.stringify(currentDinoData), 
      });

      if (!response.ok) {
        let errorMessage = `Erreur HTTP: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) { /* Ignore */ }
        throw new Error(errorMessage);
      }
      
      await fetchDinosaures(); 
      setShowForm(false); // Use new state name
      setCurrentDinoData(initialDinoFormState); // Reset form data
      setEditingDinosaurId(null); // Reset editing ID
    } catch (err) {
      const action = editingDinosaurId ? "la modification" : "l'ajout";
      console.error(`Erreur lors de ${action} du dinosaure:`, err);
      setFormError(err.message || `Une erreur est survenue lors de ${action}.`);
    }
  };

  const handleDeleteDinosaur = async (dinosaurId, dinosaurName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le dinosaure "${dinosaurName}" ?`)) {
      return;
    }

    setError(null); // Clear previous errors before attempting delete
    try {
      const response = await fetch(`/api/dinosaures/${dinosaurId}`, {
        method: 'DELETE',
        headers: { // Use JWT for Authorization
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let errorMessage = `Erreur HTTP: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) { /* Ignore if error response is not JSON */ }
        throw new Error(errorMessage);
      }
      
      // If DELETE is successful (e.g. 200 OK with message, or 204 No Content)
      // We should refresh the dinosaur list
      await fetchDinosaures(); 
      // Optionally, display a success message for deletion if backend sends one
      // For now, just refreshing the list is the main feedback.
      
    } catch (err) {
      console.error(`Erreur lors de la suppression du dinosaure ${dinosaurId}:`, err);
      setError(err.message || "Une erreur est survenue lors de la suppression.");
      // This error will be displayed in the main error display area
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-page-container login-container">
        <h1>Connexion Administrateur</h1>
        <form onSubmit={handleLoginSubmit} className="login-form">
          <div>
            <label htmlFor="username">Nom d'utilisateur:</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoginLoading}
            />
          </div>
          <div>
            <label htmlFor="password">Mot de passe:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoginLoading}
            />
          </div>
          <button type="submit" className="admin-button login-button" disabled={isLoginLoading}>
            {isLoginLoading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
          {loginError && <p className="error-message login-error-message">{loginError}</p>}
        </form>
      </div>
    );
  }

  // Below is the existing UI for dinosaur management, shown only if authenticated
  if (isLoading && !showForm) { 
    return <div className="admin-page-container"><p>Chargement des dinosaures...</p></div>;
  }

  if (error && !isLoading && !showForm) { 
    return (
      <div className="admin-page-container">
        <p className="error-message">Erreur: {error}</p>
        <button onClick={() => { setError(null); fetchDinosaures(); }} className="admin-button">Réessayer de charger</button>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <h1>Gestion des Dinosaures</h1>
      
      {error && !showForm && <p className="error-message page-error-message">Erreur: {error}</p>}

      {!showForm ? ( 
        <button className="admin-button add-button" onClick={handleOpenAddForm}> 
          Ajouter un Dinosaure
        </button>
      ) : (
        <div className="form-container">
          <h2>{editingDinosaurId ? "Modifier le Dinosaure" : "Ajouter un nouveau Dinosaure"}</h2>
          {formError && <p className="error-message form-error-message">{formError}</p>}
          <form onSubmit={handleFormSubmit}> 
            <label>Nom Complet: <input type="text" name="nomComplet" value={currentDinoData.nomComplet} onChange={handleCurrentDinoDataChange} required /></label>
            <label>Famille: <input type="text" name="famille" value={currentDinoData.famille} onChange={handleCurrentDinoDataChange} required /></label>
            <label>Période Géologique: <input type="text" name="periodeGeologique" value={currentDinoData.periodeGeologique} onChange={handleCurrentDinoDataChange} /></label>
            <label>Lieu de Découverte: <input type="text" name="lieuDecouverte" value={currentDinoData.lieuDecouverte} onChange={handleCurrentDinoDataChange} /></label>
            <label>Année de Découverte: <input type="text" name="anneeDecouverte" value={currentDinoData.anneeDecouverte} onChange={handleCurrentDinoDataChange} /></label>
            <fieldset>
              <legend>Régime Alimentaire</legend>
              <label>Type: <input type="text" name="regimeAlimentaire.type" value={currentDinoData.regimeAlimentaire.type} onChange={handleCurrentDinoDataChange} /></label>
              <label>Icône: <input type="text" name="regimeAlimentaire.icone" value={currentDinoData.regimeAlimentaire.icone} onChange={handleCurrentDinoDataChange} /></label>
            </fieldset>
            <label>Taille Moyenne: <input type="text" name="tailleMoyenne" value={currentDinoData.tailleMoyenne} onChange={handleCurrentDinoDataChange} /></label>
            <label>Poids Estimé: <input type="text" name="poidsEstime" value={currentDinoData.poidsEstime} onChange={handleCurrentDinoDataChange} /></label>
            <label>Caractéristiques Marquantes: <textarea name="caracteristiquesMarquantes" value={currentDinoData.caracteristiquesMarquantes} onChange={handleCurrentDinoDataChange}></textarea></label>
            <label>Anecdote: <textarea name="anecdote" value={currentDinoData.anecdote} onChange={handleCurrentDinoDataChange}></textarea></label>
            <label>Brève Description: <textarea name="breveDescription" value={currentDinoData.breveDescription} onChange={handleCurrentDinoDataChange}></textarea></label>
            <label>URL Illustration: <input type="text" name="illustrationUrl" value={currentDinoData.illustrationUrl} onChange={handleCurrentDinoDataChange} /></label>
            <label>URL Comparaison Humain: <input type="text" name="comparaisonHumainUrl" value={currentDinoData.comparaisonHumainUrl} onChange={handleCurrentDinoDataChange} /></label>
            <label>Statut Spécial: <input type="text" name="statutSpecial" value={currentDinoData.statutSpecial} onChange={handleCurrentDinoDataChange} /></label>
            <label>État de Conservation: <input type="text" name="etatConservation" value={currentDinoData.etatConservation} onChange={handleCurrentDinoDataChange} /></label>
            <div className="form-actions">
              <button type="submit" className="admin-button submit-button">
                {editingDinosaurId ? "Mettre à jour" : "Soumettre"}
              </button>
              <button 
                type="button" 
                className="admin-button cancel-button" 
                onClick={() => { 
                  setShowForm(false); 
                  setFormError(null); 
                  setEditingDinosaurId(null); 
                  setCurrentDinoData(initialDinoFormState); 
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
      
      {dinosaures.length === 0 && !isLoading && !error && !showForm ? ( // Use new state name
        <p>Aucun dinosaure trouvé.</p>
      ) : (
        !showForm && // Use new state name
        <ul className="dinosaur-list">
          {dinosaures.map(dinosaur => (
            <li key={dinosaur.id} className="dinosaur-list-item">
              <span>{dinosaur.nomComplet}</span>
              <div className="dinosaur-actions">
                <button 
                  onClick={() => handleEditDinosaurClick(dinosaur)} 
                  className="admin-button edit-button"
                >
                  Modifier
                </button>
                <button 
                  onClick={() => handleDeleteDinosaur(dinosaur.id, dinosaur.nomComplet)} 
                  className="admin-button delete-button"
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminPage;
