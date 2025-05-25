// To run these tests:
// 1. Ensure your backend server is running (e.g., `node infos-dinos-app/backend/server.js`)
// 2. Run this script from the root of the project: `node infos-dinos-app/backend/api_tests.js`

const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

const API_BASE_URL = 'http://localhost:3001/api/dinosaures';
const VALID_API_KEY = 'your-secret-api-key';
const INVALID_API_KEY = 'invalid-api-key';
const DINOSAURS_JSON_PATH = path.join(__dirname, 'dinosaurs.json');

let originalDinosaursData = '';
let testDinoId = null;

const log = (message) => console.log(message);
const pass = (testName) => log(`✅ PASS: ${testName}`);
const fail = (testName, error) => log(`❌ FAIL: ${testName}\n   Error: ${error.message || error}\n   ${error.stack ? 'Stack: ' + error.stack : ''}`);

async function backupDinosaursFile() {
    try {
        originalDinosaursData = await fs.readFile(DINOSAURS_JSON_PATH, 'utf8');
        log('Successfully backed up dinosaurs.json.');
    } catch (error) {
        log('Warning: Could not read dinosaurs.json for backup. If it does not exist, tests might create it.');
        originalDinosaursData = '[]'; // Assume empty if not found, so restore can create it
    }
}

async function restoreDinosaursFile() {
    try {
        await fs.writeFile(DINOSAURS_JSON_PATH, originalDinosaursData, 'utf8');
        log('Successfully restored dinosaurs.json.');
    } catch (error) {
        fail('Restoring dinosaurs.json', error);
    }
}

async function testGetDinosaures() {
    const testName = 'GET /api/dinosaures';
    log(`\n--- ${testName.toUpperCase()} ---`);
    try {
        const response = await fetch(API_BASE_URL);
        if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Response is not an array');
        pass(testName);
        return true;
    } catch (error) {
        fail(testName, error);
        return false;
    }
}

async function testPostDinosaures() {
    const testName = 'POST /api/dinosaures';
    log(`\n--- ${testName.toUpperCase()} ---`);
    let success = true;
    const newDino = {
        nomComplet: "Testosaurus Rex",
        famille: "Testosauridae",
        periodeGeologique: "Testing Period",
        regimeAlimentaire: { type: "Omnivore", icone: "🧪" }
    };

    // Attempt without API key
    try {
        const resNoKey = await fetch(API_BASE_URL, { method: 'POST', body: JSON.stringify(newDino), headers: { 'Content-Type': 'application/json' } });
        if (resNoKey.status !== 401) throw new Error('POST without API key: Expected 401');
        pass('POST without API key returns 401');
    } catch (error) {
        fail('POST without API key returns 401', error);
        success = false;
    }

    // Attempt with incorrect API key
    try {
        const resInvalidKey = await fetch(API_BASE_URL, { method: 'POST', body: JSON.stringify(newDino), headers: { 'Content-Type': 'application/json', 'X-API-Key': INVALID_API_KEY } });
        if (resInvalidKey.status !== 401) throw new Error('POST with invalid API key: Expected 401');
        pass('POST with invalid API key returns 401');
    } catch (error) {
        fail('POST with invalid API key returns 401', error);
        success = false;
    }

    // Add with correct API key
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            body: JSON.stringify(newDino),
            headers: { 'Content-Type': 'application/json', 'X-API-Key': VALID_API_KEY }
        });
        if (response.status !== 201) throw new Error(`Expected status 201, got ${response.status}`);
        const data = await response.json();
        if (!data.id) throw new Error('New dinosaur does not have an ID');
        if (data.nomComplet !== newDino.nomComplet) throw new Error('Returned dinosaur name mismatch');
        testDinoId = data.id; // Save ID for later tests
        pass('POST with valid API key creates dinosaur');

        // Verify by GET
        const getResponse = await fetch(`${API_BASE_URL}`);
        const allDinos = await getResponse.json();
        if (!allDinos.find(d => d.id === testDinoId && d.nomComplet === newDino.nomComplet)) {
            throw new Error('POST verification by GET failed: New dinosaur not found in list');
        }
        pass('POST verification by GET successful');

    } catch (error) {
        fail('POST with valid API key', error);
        success = false;
    }
    return success;
}

async function testPutDinosaures() {
    const testName = 'PUT /api/dinosaures/:id';
    log(`\n--- ${testName.toUpperCase()} ---`);
    if (!testDinoId) {
        fail(testName, 'Skipping PUT tests as testDinoId is not set (POST test likely failed).');
        return false;
    }
    let success = true;
    const updatedDinoData = { nomComplet: "Testosaurus Updated", famille: "Testosauridae Updated" };

    // Attempt without API key
    try {
        const resNoKey = await fetch(`${API_BASE_URL}/${testDinoId}`, { method: 'PUT', body: JSON.stringify(updatedDinoData), headers: { 'Content-Type': 'application/json' } });
        if (resNoKey.status !== 401) throw new Error('PUT without API key: Expected 401');
        pass('PUT without API key returns 401');
    } catch (error) {
        fail('PUT without API key returns 401', error);
        success = false;
    }

    // Attempt with incorrect API key
    try {
        const resInvalidKey = await fetch(`${API_BASE_URL}/${testDinoId}`, { method: 'PUT', body: JSON.stringify(updatedDinoData), headers: { 'Content-Type': 'application/json', 'X-API-Key': INVALID_API_KEY } });
        if (resInvalidKey.status !== 401) throw new Error('PUT with invalid API key: Expected 401');
        pass('PUT with invalid API key returns 401');
    } catch (error) {
        fail('PUT with invalid API key returns 401', error);
        success = false;
    }

    // Update with correct API key
    try {
        const response = await fetch(`${API_BASE_URL}/${testDinoId}`, {
            method: 'PUT',
            body: JSON.stringify(updatedDinoData),
            headers: { 'Content-Type': 'application/json', 'X-API-Key': VALID_API_KEY }
        });
        if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
        const data = await response.json();
        if (data.nomComplet !== updatedDinoData.nomComplet) throw new Error('Returned dinosaur name mismatch after update');
        pass('PUT with valid API key updates dinosaur');
    } catch (error) {
        fail('PUT with valid API key', error);
        success = false;
    }
    
    // Attempt to update non-existent ID
    try {
        const nonExistentId = 99999;
        const response = await fetch(`${API_BASE_URL}/${nonExistentId}`, {
            method: 'PUT',
            body: JSON.stringify(updatedDinoData),
            headers: { 'Content-Type': 'application/json', 'X-API-Key': VALID_API_KEY }
        });
        if (response.status !== 404) throw new Error(`Expected status 404 for non-existent ID, got ${response.status}`);
        pass('PUT non-existent ID returns 404');
    } catch (error) {
        fail('PUT non-existent ID', error);
        success = false;
    }
    return success;
}

async function testDeleteDinosaures() {
    const testName = 'DELETE /api/dinosaures/:id';
    log(`\n--- ${testName.toUpperCase()} ---`);
    if (!testDinoId) {
        fail(testName, 'Skipping DELETE tests as testDinoId is not set.');
        return false;
    }
    let success = true;

    // Attempt without API key
    try {
        const resNoKey = await fetch(`${API_BASE_URL}/${testDinoId}`, { method: 'DELETE' });
        if (resNoKey.status !== 401) throw new Error('DELETE without API key: Expected 401');
        pass('DELETE without API key returns 401');
    } catch (error) {
        fail('DELETE without API key returns 401', error);
        success = false;
    }

    // Attempt with incorrect API key
    try {
        const resInvalidKey = await fetch(`${API_BASE_URL}/${testDinoId}`, { method: 'DELETE', headers: { 'X-API-Key': INVALID_API_KEY } });
        if (resInvalidKey.status !== 401) throw new Error('DELETE with invalid API key: Expected 401');
        pass('DELETE with invalid API key returns 401');
    } catch (error) {
        fail('DELETE with invalid API key returns 401', error);
        success = false;
    }

    // Delete with correct API key
    try {
        const response = await fetch(`${API_BASE_URL}/${testDinoId}`, {
            method: 'DELETE',
            headers: { 'X-API-Key': VALID_API_KEY }
        });
        if (response.status !== 200 && response.status !== 204) throw new Error(`Expected status 200 or 204, got ${response.status}`);
        pass('DELETE with valid API key deletes dinosaur');

        // Verify by GET
        const getResponse = await fetch(`${API_BASE_URL}`);
        const allDinos = await getResponse.json();
        if (allDinos.find(d => d.id === testDinoId)) {
            throw new Error('DELETE verification by GET failed: Deleted dinosaur still found in list');
        }
        pass('DELETE verification by GET successful');

    } catch (error) {
        fail('DELETE with valid API key', error);
        success = false;
    }
    
    // Attempt to delete non-existent ID
    try {
        const nonExistentId = 99999; // Assuming this ID was never created or already deleted
        const response = await fetch(`${API_BASE_URL}/${nonExistentId}`, {
            method: 'DELETE',
            headers: { 'X-API-Key': VALID_API_KEY }
        });
        if (response.status !== 404) throw new Error(`Expected status 404 for non-existent ID, got ${response.status}`);
        pass('DELETE non-existent ID returns 404');
    } catch (error) {
        fail('DELETE non-existent ID', error);
        success = false;
    }
    return success;
}


async function runTests() {
    log('Starting API tests...');
    await backupDinosaursFile();

    let allTestsPassed = true;

    if (!await testGetDinosaures()) allTestsPassed = false;
    if (!await testPostDinosaures()) allTestsPassed = false;
    if (!await testPutDinosaures()) allTestsPassed = false; 
    if (!await testDeleteDinosaures()) allTestsPassed = false;

    await restoreDinosaursFile();

    log('\n--- TEST SUMMARY ---');
    if (allTestsPassed) {
        log('🎉 All API tests passed successfully! 🎉');
    } else {
        log('🔥 Some API tests failed. Please review the logs. 🔥');
    }
    log('API tests finished.');
}

runTests().catch(error => {
    console.error("Unhandled error during test execution:", error);
    restoreDinosaursFile(); // Attempt to restore even on unhandled error
});
