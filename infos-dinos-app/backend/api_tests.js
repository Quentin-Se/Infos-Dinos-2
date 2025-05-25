// To run these tests:
// 1. Ensure your backend server is running (e.g., `node infos-dinos-app/backend/server.js`)
// 2. Run this script from the root of the project: `node infos-dinos-app/backend/api_tests.js`

const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

const API_BASE_URL = 'http://localhost:3001/api/dinosaures';
const LOGIN_URL = 'http://localhost:3001/api/auth/login'; // Added for login
const ADMIN_CREDENTIALS = { username: 'adminDino', password: 'adminDino123!' }; // Added credentials
const DINOSAURS_JSON_PATH = path.join(__dirname, 'dinosaurs.json');

let originalDinosaursData = '';
let testDinoId = null;
let authToken = null; // To store the JWT


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

async function loginAdminUser() {
    const testName = 'POST /api/auth/login';
    log(`\n--- ${testName.toUpperCase()} ---`);
    try {
        const response = await fetch(LOGIN_URL, {
            method: 'POST',
            body: JSON.stringify(ADMIN_CREDENTIALS),
            headers: { 'Content-Type': 'application/json' }
        });
        const responseBody = await response.text(); // Get raw response body for logging
        if (response.status !== 200) {
            throw new Error(`Login failed: Expected status 200, got ${response.status}. Response: ${responseBody}`);
        }
        const data = JSON.parse(responseBody); // Parse after checking status
        if (!data.token) throw new Error('Login failed: Token not found in response');
        authToken = data.token;
        pass('Admin login successful, token received.');
        return true;
    } catch (error) {
        fail('Admin login', error);
        authToken = null; 
        return false;
    }
}

async function testPostDinosaures() {
    const testName = 'POST /api/dinosaures';
    log(`\n--- ${testName.toUpperCase()} ---`);
    if (!authToken) {
        fail(testName, 'Skipping POST tests as authToken is not set (Login likely failed).');
        return false;
    }
    let success = true;
    const newDino = {
        nomComplet: "Testosaurus Rex",
        famille: "Testosauridae",
        periodeGeologique: "Testing Period",
        regimeAlimentaire: { type: "Omnivore", icone: "🧪" }
    };

    // Attempt without Authorization header
    try {
        const resNoAuth = await fetch(API_BASE_URL, { method: 'POST', body: JSON.stringify(newDino), headers: { 'Content-Type': 'application/json' } });
        if (resNoAuth.status !== 401) throw new Error(`POST without Auth header: Expected 401, got ${resNoAuth.status}`);
        pass('POST without Auth header returns 401');
    } catch (error) {
        fail('POST without Auth header', error);
        success = false;
    }

    // Attempt with malformed token (missing Bearer)
    try {
        const resMalformed = await fetch(API_BASE_URL, { method: 'POST', body: JSON.stringify(newDino), headers: { 'Content-Type': 'application/json', 'Authorization': authToken } });
        if (resMalformed.status !== 401) throw new Error(`POST with malformed token (no Bearer): Expected 401, got ${resMalformed.status}`);
        pass('POST with malformed token (no Bearer) returns 401');
    } catch (error) {
        fail('POST with malformed token (no Bearer)', error);
        success = false;
    }
    
    // Attempt with invalid token string
    try {
        const resInvalidToken = await fetch(API_BASE_URL, { method: 'POST', body: JSON.stringify(newDino), headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer invalidtokenstring123` } });
        if (resInvalidToken.status !== 403) throw new Error(`POST with invalid token: Expected 403, got ${resInvalidToken.status}`);
        pass('POST with invalid token string returns 403');
    } catch (error) {
        fail('POST with invalid token string', error);
        success = false;
    }

    // Add with correct token
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            body: JSON.stringify(newDino),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }
        });
        if (response.status !== 201) throw new Error(`Expected status 201, got ${response.status}`);
        const data = await response.json();
        if (!data.id) throw new Error('New dinosaur does not have an ID');
        if (data.nomComplet !== newDino.nomComplet) throw new Error('Returned dinosaur name mismatch');
        testDinoId = data.id; 
        pass('POST with valid token creates dinosaur');

        // Verify by GET
        const getResponse = await fetch(`${API_BASE_URL}`);
        const allDinos = await getResponse.json();
        if (!allDinos.find(d => d.id === testDinoId && d.nomComplet === newDino.nomComplet)) {
            throw new Error('POST verification by GET failed: New dinosaur not found in list');
        }
        pass('POST verification by GET successful');

    } catch (error) {
        fail('POST with valid token', error);
        success = false;
    }
    return success;
}

async function testPutDinosaures() {
    const testName = 'PUT /api/dinosaures/:id';
    log(`\n--- ${testName.toUpperCase()} ---`);
    if (!authToken) {
        fail(testName, 'Skipping PUT tests as authToken is not set.');
        return false;
    }
    if (!testDinoId) {
        fail(testName, 'Skipping PUT tests as testDinoId is not set (POST test likely failed).');
        return false;
    }
    let success = true;
    const updatedDinoData = { nomComplet: "Testosaurus Updated", famille: "Testosauridae Updated" };
    // Attempt without Authorization header
    try {
        const resNoAuth = await fetch(`${API_BASE_URL}/${testDinoId}`, { method: 'PUT', body: JSON.stringify(updatedDinoData), headers: { 'Content-Type': 'application/json' } });
        if (resNoAuth.status !== 401) throw new Error(`PUT without Auth header: Expected 401, got ${resNoAuth.status}`);
        pass('PUT without Auth header returns 401');
    } catch (error) {
        fail('PUT without Auth header', error);
        success = false;
    }
    
    // Attempt with invalid token string
    try {
        const resInvalidToken = await fetch(`${API_BASE_URL}/${testDinoId}`, { method: 'PUT', body: JSON.stringify(updatedDinoData), headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer invalidtokenstring123` } });
        if (resInvalidToken.status !== 403) throw new Error(`PUT with invalid token: Expected 403, got ${resInvalidToken.status}`);
        pass('PUT with invalid token string returns 403');
    } catch (error) {
        fail('PUT with invalid token string', error);
        success = false;
    }

    // Update with correct token
    try {
        const response = await fetch(`${API_BASE_URL}/${testDinoId}`, {
            method: 'PUT',
            body: JSON.stringify(updatedDinoData),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }
        });
        if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
        const data = await response.json();
        if (data.nomComplet !== updatedDinoData.nomComplet) throw new Error('Returned dinosaur name mismatch after update');
        pass('PUT with valid token updates dinosaur');
    } catch (error) {
        fail('PUT with valid token', error);
        success = false;
    }
    
    // Attempt to update non-existent ID
    try {
        const nonExistentId = 99999;
        const response = await fetch(`${API_BASE_URL}/${nonExistentId}`, {
            method: 'PUT',
            body: JSON.stringify(updatedDinoData),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }
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
    if (!authToken) {
        fail(testName, 'Skipping DELETE tests as authToken is not set.');
        return false;
    }
    if (!testDinoId) {
        fail(testName, 'Skipping DELETE tests as testDinoId is not set (POST test likely failed).');
        return false;
    }
    let success = true;
    // Attempt without Authorization header
    try {
        const resNoAuth = await fetch(`${API_BASE_URL}/${testDinoId}`, { method: 'DELETE' });
        if (resNoAuth.status !== 401) throw new Error(`DELETE without Auth header: Expected 401, got ${resNoAuth.status}`);
        pass('DELETE without Auth header returns 401');
    } catch (error) {
        fail('DELETE without Auth header', error);
        success = false;
    }

    // Attempt with invalid token string
    try {
        const resInvalidToken = await fetch(`${API_BASE_URL}/${testDinoId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer invalidtokenstring123` } });
        if (resInvalidToken.status !== 403) throw new Error(`DELETE with invalid token: Expected 403, got ${resInvalidToken.status}`);
        pass('DELETE with invalid token string returns 403');
    } catch (error) {
        fail('DELETE with invalid token string', error);
        success = false;
    }
    
    // Delete with correct token
    try {
        const response = await fetch(`${API_BASE_URL}/${testDinoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.status !== 200 && response.status !== 204) throw new Error(`Expected status 200 or 204, got ${response.status}`);
        pass('DELETE with valid token deletes dinosaur');

        // Verify by GET
        const getResponse = await fetch(`${API_BASE_URL}`);
        const allDinos = await getResponse.json();
        if (allDinos.find(d => d.id === testDinoId)) {
            throw new Error('DELETE verification by GET failed: Deleted dinosaur still found in list');
        }
        pass('DELETE verification by GET successful');

    } catch (error) {
        fail('DELETE with valid token', error);
        success = false;
    }
    
    // Attempt to delete non-existent ID
    try {
        const nonExistentId = 99999; 
        const response = await fetch(`${API_BASE_URL}/${nonExistentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
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
    const loginSuccess = await loginAdminUser();

    if (!loginSuccess) {
        log('🔥 Admin login failed. Subsequent tests requiring authentication will be skipped or may fail. 🔥');
        allTestsPassed = false; 
    }

    if (!await testGetDinosaures()) allTestsPassed = false;
    
    if (authToken) { // Only run auth-dependent tests if login was successful
        if (!await testPostDinosaures()) allTestsPassed = false;
        // Ensure testDinoId is set from testPostDinosaures before running PUT/DELETE
        if (testDinoId && !await testPutDinosaures()) allTestsPassed = false; 
        if (testDinoId && !await testDeleteDinosaures()) allTestsPassed = false;
        if (!testDinoId && allTestsPassed) { // If POST passed but somehow testDinoId is not set
             log('🔥 testDinoId not set after POST, skipping PUT/DELETE based on its value.');
             // Depending on strictness, could set allTestsPassed = false here
        }
    } else {
        log('Skipping POST, PUT, DELETE tests for dinosaurs due to login failure.');
        // If these tests are critical even if login fails, mark allTestsPassed = false
        // For now, login failure already sets allTestsPassed = false.
    }

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
    restoreDinosaursFile(); 
});
