require('dotenv').config(); // Configure dotenv at the very top
const express = require('express');
const fs = require('fs');
const path = require('path'); // Added for robust path handling
const bcrypt = require('bcryptjs'); // Import bcryptjs
const jwt = require('jsonwebtoken'); // Import jsonwebtoken

const app = express();
const port = 3001;
const DINOSAURS_FILE = path.join(__dirname, 'dinosaurs.json');
// EXPECTED_API_KEY is removed as it's no longer needed

// Admin user credentials
const ADMIN_USERNAME = 'adminDino';
// Hash for "adminDino123!" with salt 10:
// const salt = bcrypt.genSaltSync(10);
// const hashedPassword = bcrypt.hashSync("adminDino123!", salt); -> $2a$10$f7y0.iN9.R6oCcL6y6kM9eJGzcLhS3d2T8Pz2.N4X7J1mO.AXq.yO
const ADMIN_HASHED_PASSWORD = '$2a$10$f7y0.iN9.R6oCcL6y6kM9eJGzcLhS3d2T8Pz2.N4X7J1mO.AXq.yO';

// Middleware to parse JSON bodies
app.use(express.json());

// JWT Authentication Middleware (renamed from apiKeyAuth)
const verifyTokenMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ message: "Accès non autorisé: Token manquant." });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: "Accès non autorisé: Token mal formaté. Format attendu: 'Bearer <token>'" });
  }

  const token = parts[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      // Log the error for server-side debugging if needed
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ message: "Accès non autorisé: Token expiré." });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({ message: "Accès non autorisé: Token invalide." });
      }
      // For other errors, a generic message might be better
      return res.status(403).json({ message: "Accès non autorisé: Erreur de vérification du token." });
    }
    // Token is valid
    req.user = decoded; // Attach decoded payload (e.g., { username: 'adminDino', iat: ..., exp: ... })
    next();
  });
};

app.get('/', (req, res) => {
  res.send('Hello World - Welcome to the Dinosaurs API!');
});

// GET /api/dinosaures - Read all dinosaurs
app.get('/api/dinosaures', (req, res) => {
  fs.readFile(DINOSAURS_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading dinosaurs file:", err);
      // Check for specific error types
      if (err.code === 'ENOENT') {
        return res.status(404).json({ message: "Dinosaurs data not found." });
      }
      return res.status(500).json({ message: "Failed to read dinosaurs data." });
    }
    try {
      const dinosaurs = JSON.parse(data);
      res.json(dinosaurs);
    } catch (parseErr) {
      console.error("Error parsing dinosaurs JSON:", parseErr);
      res.status(500).json({ message: "Failed to parse dinosaurs data." });
    }
  });
});

// POST /api/dinosaures - Add a new dinosaur
app.post('/api/dinosaures', verifyTokenMiddleware, (req, res) => { // Updated middleware
  fs.readFile(DINOSAURS_FILE, 'utf8', (err, data) => {
    if (err && err.code !== 'ENOENT') { // Allow ENOENT, as we might be creating the file
      console.error("Error reading dinosaurs file for POST:", err);
      return res.status(500).json({ message: "Failed to read dinosaurs data before adding." });
    }

    let dinosaurs = [];
    if (data) {
      try {
        dinosaurs = JSON.parse(data);
        if (!Array.isArray(dinosaurs)) { // Ensure it's an array
          console.error("Dinosaurs data is not an array.");
          return res.status(500).json({ message: "Invalid dinosaurs data format." });
        }
      } catch (parseErr) {
        console.error("Error parsing dinosaurs JSON for POST:", parseErr);
        return res.status(500).json({ message: "Failed to parse dinosaurs data before adding." });
      }
    }

    const newDinosaur = req.body;

    // Basic validation for the new dinosaur
    if (!newDinosaur || typeof newDinosaur.nomComplet !== 'string') {
      return res.status(400).json({ message: "Invalid dinosaur data: 'nomComplet' is required and must be a string." });
    }

    // Generate new ID
    let newId = 1;
    if (dinosaurs.length > 0) {
      const maxId = dinosaurs.reduce((max, d) => d.id > max ? d.id : max, 0);
      newId = maxId + 1;
    }
    newDinosaur.id = newId;

    dinosaurs.push(newDinosaur);

    fs.writeFile(DINOSAURS_FILE, JSON.stringify(dinosaurs, null, 2), 'utf8', (writeErr) => {
      if (writeErr) {
        console.error("Error writing dinosaurs file:", writeErr);
        return res.status(500).json({ message: "Failed to save new dinosaur." });
      }
      res.status(201).json(newDinosaur);
    });
  });
});

// PUT /api/dinosaures/:id - Update a dinosaur
app.put('/api/dinosaures/:id', verifyTokenMiddleware, (req, res) => { // Updated middleware
  const dinosaurId = parseInt(req.params.id, 10);
  if (isNaN(dinosaurId)) {
    return res.status(400).json({ message: "Invalid dinosaur ID format." });
  }

  fs.readFile(DINOSAURS_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading dinosaurs file for PUT:", err);
      if (err.code === 'ENOENT') {
        return res.status(404).json({ message: "Dinosaurs data not found." });
      }
      return res.status(500).json({ message: "Failed to read dinosaurs data before updating." });
    }

    let dinosaurs = [];
    try {
      dinosaurs = JSON.parse(data);
      if (!Array.isArray(dinosaurs)) {
        console.error("Dinosaurs data is not an array for PUT.");
        return res.status(500).json({ message: "Invalid dinosaurs data format." });
      }
    } catch (parseErr) {
      console.error("Error parsing dinosaurs JSON for PUT:", parseErr);
      return res.status(500).json({ message: "Failed to parse dinosaurs data before updating." });
    }

    const dinosaurIndex = dinosaurs.findIndex(d => d.id === dinosaurId);

    if (dinosaurIndex === -1) {
      return res.status(404).json({ message: `Dinosaur with ID ${dinosaurId} not found.` });
    }

    // Update the dinosaur object
    // Ensure the ID from the URL param is used, and not overwritten by the body
    const updatedDinosaur = { ...dinosaurs[dinosaurIndex], ...req.body, id: dinosaurId };
    
    // Basic validation for the updated dinosaur
    if (typeof updatedDinosaur.nomComplet !== 'string' || updatedDinosaur.nomComplet.trim() === '') {
      return res.status(400).json({ message: "Invalid dinosaur data: 'nomComplet' is required and cannot be empty." });
    }

    dinosaurs[dinosaurIndex] = updatedDinosaur;

    fs.writeFile(DINOSAURS_FILE, JSON.stringify(dinosaurs, null, 2), 'utf8', (writeErr) => {
      if (writeErr) {
        console.error("Error writing dinosaurs file for PUT:", writeErr);
        return res.status(500).json({ message: "Failed to save updated dinosaur." });
      }
      res.json(updatedDinosaur);
    });
  });
});

// DELETE /api/dinosaures/:id - Delete a dinosaur
app.delete('/api/dinosaures/:id', verifyTokenMiddleware, (req, res) => { // Updated middleware
  const dinosaurId = parseInt(req.params.id, 10);
  if (isNaN(dinosaurId)) {
    return res.status(400).json({ message: "Invalid dinosaur ID format." });
  }

  fs.readFile(DINOSAURS_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading dinosaurs file for DELETE:", err);
      if (err.code === 'ENOENT') {
        return res.status(404).json({ message: "Dinosaurs data not found." });
      }
      return res.status(500).json({ message: "Failed to read dinosaurs data before deleting." });
    }

    let dinosaurs = [];
    try {
      dinosaurs = JSON.parse(data);
      if (!Array.isArray(dinosaurs)) {
        console.error("Dinosaurs data is not an array for DELETE.");
        return res.status(500).json({ message: "Invalid dinosaurs data format." });
      }
    } catch (parseErr) {
      console.error("Error parsing dinosaurs JSON for DELETE:", parseErr);
      return res.status(500).json({ message: "Failed to parse dinosaurs data before deleting." });
    }

    const dinosaurIndex = dinosaurs.findIndex(d => d.id === dinosaurId);

    if (dinosaurIndex === -1) {
      return res.status(404).json({ message: `Dinosaur with ID ${dinosaurId} not found.` });
    }

    dinosaurs.splice(dinosaurIndex, 1); // Remove the dinosaur

    fs.writeFile(DINOSAURS_FILE, JSON.stringify(dinosaurs, null, 2), 'utf8', (writeErr) => {
      if (writeErr) {
        console.error("Error writing dinosaurs file for DELETE:", writeErr);
        return res.status(500).json({ message: "Failed to delete dinosaur." });
      }
      res.status(200).json({ message: `Dinosaur with ID ${dinosaurId} deleted successfully.` }); // Changed to 200 with message for clarity
    });
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

// LOGIN Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Nom d'utilisateur et mot de passe requis." });
    }

    // Validate username
    if (username !== ADMIN_USERNAME) {
      return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect." });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, ADMIN_HASHED_PASSWORD);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect." });
    }

    // Credentials are valid, generate JWT
    const payload = { username: ADMIN_USERNAME }; // Or { userId: ADMIN_USERNAME }
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: "Connexion réussie!", token: token });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Erreur serveur lors de la connexion." });
  }
});
