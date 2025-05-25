const express = require('express');
const fs = require('fs');
const path = require('path'); // Added for robust path handling

const app = express();
const port = 3001;
const DINOSAURS_FILE = path.join(__dirname, 'dinosaurs.json');
const EXPECTED_API_KEY = "your-secret-api-key"; // Define the API key

// Middleware to parse JSON bodies
app.use(express.json());

// API Key Authentication Middleware
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  if (apiKey && apiKey === EXPECTED_API_KEY) {
    next();
  } else {
    res.status(401).json({ message: "Accès non autorisé: Clé API manquante ou incorrecte" });
  }
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
app.post('/api/dinosaures', apiKeyAuth, (req, res) => { // Added apiKeyAuth middleware
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
app.put('/api/dinosaures/:id', apiKeyAuth, (req, res) => { // Added apiKeyAuth middleware
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
app.delete('/api/dinosaures/:id', apiKeyAuth, (req, res) => { // Added apiKeyAuth middleware
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
