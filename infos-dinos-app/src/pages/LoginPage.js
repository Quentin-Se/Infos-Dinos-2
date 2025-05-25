import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import './LoginPage.css'; 

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // Get login function from AuthContext

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json(); 

      if (response.ok) { 
        login(data.token); // Use login function from context
        navigate('/admin'); // Navigate after successful login and context update
      } else {
        setError(data.message || `Erreur ${response.status}: Une erreur est survenue.`);
      }
    } catch (err) {
      // Network errors or issues with fetch itself
      console.error("Login fetch error:", err);
      setError("Impossible de se connecter au serveur. Veuillez vérifier votre connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Connexion Administrateur</h2>
        
        {error && <p className="error-message login-error">{error}</p>}
        
        <div className="form-group">
          <label htmlFor="username">Nom d'utilisateur:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Mot de passe:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        
        <button type="submit" className="login-button" disabled={isLoading}>
          {isLoading ? "Chargement..." : "Connexion"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
