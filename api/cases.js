// api/cases.js
// This file will act as your backend API endpoint for /api/cases

// Import Firebase Admin SDK using dynamic import for compatibility
// with "type": "module" in package.json and commonjs require
let admin;
async function initializeFirebaseAdmin() {
    if (!admin) {
        try {
            admin = await import('firebase-admin');
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('Firebase Admin SDK initialized successfully.');
        } catch (error) {
            console.error('Error initializing Firebase Admin SDK:', error);
            // If initialization fails, subsequent Firestore operations will also fail.
            // In a real app, you might want to return a 500 error here immediately.
        }
    }
}

let db;
async function getFirestoreInstance() {
    if (!db) {
        if (!admin) {
            await initializeFirebaseAdmin();
        }
        db = admin.firestore();
    }
    return db;
}


// Helper function to get current Thai time in ISO format
function getThaiCurrentTimeIso() {
    const utcNow = new Date();
    // UTC+7 offset in milliseconds
    const thaiTime = new Date(utcNow.getTime() + (7 * 60 * 60 * 1000));
    return thaiTime.toISOString();
}

// Admin password (for PUT/DELETE operations) - set as env var for production!
// For simplicity, we'll keep it here for now, but in production, use process.env.ADMIN_PASSWORD
const ADMIN_PASSWORD = "lawsugar6"; 

// Main handler for the serverless function
module.exports = async (req, res) => {
    // Ensure Firebase Admin SDK is initialized
    await initializeFirebaseAdmin();
    const firestoreDb = await getFirestoreInstance();

    // Set CORS headers to allow requests from your frontend
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allows all origins for testing. Restrict in production.
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // Allows cookies, authorization headers, etc.

    // Handle preflight OPTIONS requests (sent by browsers before actual POST/PUT/DELETE requests)
    if (req.method === 'OPTIONS') {
        res.status(200).end(); // Respond with 200 OK for preflight
        return;
    }

    try {
        const { method, url, headers } = req;
        // Netlify functions automatically parse JSON body if Content-Type is application/json
        // For other methods, body might be a string, so we ensure it's parsed.
        let requestBody = req.body;
        if (typeof requestBody === 'string' && req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
            try {
                requestBody = JSON.parse(requestBody);
            } catch (e) {
                console.error("Error parsing request body:", e);
                return res.status(400).json({ message: "Invalid JSON in request body" });
            }
        }

        const pathSegments = url.split('/');
        const caseId = pathSegments[pathSegments.length - 1]; // Get the last segment

        switch (method) {
            case 'GET':
                // Handles both GET /api/cases and GET /api/cases/{id}
                if (caseId && caseId !== 'cases' && !caseId.includes('status')) { // Check if it's a specific ID and not a status path
                    const doc = await firestoreDb.collection('cases').doc(caseId).get();
                    if (!doc.exists) {
                        return res.status(404).json({ message: 'Case not found' });
                    }
                    const caseData = doc.data();
                    caseData.id = doc.id; // Add document ID to the data
                    return res.status(200).json(caseData);
                } else { // Fetch all cases
                    const snapshot = await firestoreDb.collection('cases').get();
                    const allCases = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    console.log(`Retrieved ${allCases.length} cases from Firestore.`);
                    return res.status(200).json(allCases);
                }

            case 'POST':
                // POST /api/cases - Add a new case
                const newCaseData = {
                    farmer_name: requestBody.farmer_name,
                    farmer_account_no: requestBody.farmer_account_no,
                    cabinet_no: parseInt(requestBody.cabinet_no),
                    shelf_no: parseInt(requestBody.shelf_no),
                    sequence_no: parseInt(requestBody.sequence_no),
                    status: "In Room", 
                    borrowed_by_user_name: null,
                    borrowed_date: null,
                    returned_date: null,
                    last_updated_by_user_name: "System", 
                    last_updated_timestamp: getThaiCurrentTimeIso() 
                };

                // Validate required fields
                if (!newCaseData.farmer_name || !newCaseData.farmer_account_no || isNaN(newCaseData.cabinet_no) || isNaN(newCaseData.shelf_no) || isNaN(newCaseData.sequence_no)) {
                    return res.status(400).json({ message: 'Missing or invalid required fields' });
                }

                const docRef = await firestoreDb.collection('cases').add(newCaseData);
                newCaseData.id = docRef.id; // Add the generated ID to the response
                console.log(`New case added successfully to Firestore: ${newCaseData.id}`);
                return res.status(201).json(newCaseData);

            case 'PUT':
                // PUT /api/cases/{id} - Update case data
                // Admin password check from header
                const providedPasswordPut = headers['x-admin-password'];
                if (!providedPasswordPut || providedPasswordPut !== ADMIN_PASSWORD) {
                    return res.status(403).json({ message: 'Incorrect admin password' });
                }

                const updateData = {};
                if ('farmer_name' in requestBody) updateData.farmer_name = requestBody.farmer_name;
                if ('farmer_account_no' in requestBody) updateData.farmer_account_no = requestBody.farmer_account_no;
                if ('cabinet_no' in requestBody) updateData.cabinet_no = parseInt(requestBody.cabinet_no);
                if ('shelf_no' in requestBody) updateData.shelf_no = parseInt(requestBody.shelf_no);
                if ('sequence_no' in requestBody) updateData.sequence_no = parseInt(requestBody.sequence_no);

                updateData.last_updated_by_user_name = "System";
                updateData.last_updated_timestamp = getThaiCurrentTimeIso();

                await firestoreDb.collection('cases').doc(caseId).update(updateData);
                const updatedDoc = await firestoreDb.collection('cases').doc(caseId).get();
                const updatedCaseData = updatedDoc.data();
                updatedCaseData.id = updatedDoc.id;
                console.log(`Case with ID ${caseId} updated successfully in Firestore.`);
                return res.status(200).json(updatedCaseData);

            case 'PATCH':
                // PATCH /api/cases/{id}/status - Update borrow/return status
                const { action, borrower_name } = requestBody;
                if (!action || !borrower_name) {
                    return res.status(400).json({ message: 'Missing action or borrower_name' });
                }

                const currentCaseDoc = await firestoreDb.collection('cases').doc(caseId).get();
                if (!currentCaseDoc.exists) {
                    return res.status(404).json({ message: 'Case not found' });
                }
                const currentCaseStatus = currentCaseDoc.data().status;

                const statusUpdateData = {};
                if (action === 'borrow') {
                    if (currentCaseStatus === 'Borrowed') {
                        return res.status(409).json({ message: 'Case is already borrowed' });
                    }
                    statusUpdateData.status = 'Borrowed';
                    statusUpdateData.borrowed_by_user_name = borrower_name;
                    statusUpdateData.borrowed_date = getThaiCurrentTimeIso();
                    statusUpdateData.returned_date = null;
                    console.log(`Case ${caseId} status changed to Borrowed by ${borrower_name}.`);
                } else if (action === 'return') {
                    if (currentCaseStatus === 'In Room') {
                        return res.status(409).json({ message: 'Case is already in room' });
                    }
                    statusUpdateData.status = 'In Room';
                    statusUpdateData.returned_date = getThaiCurrentTimeIso();
                    console.log(`Case ${caseId} status changed to In Room (returned) by ${borrower_name}.`);
                } else {
                    return res.status(400).json({ message: 'Invalid action' });
                }

                statusUpdateData.last_updated_by_user_name = borrower_name;
                statusUpdateData.last_updated_timestamp = getThaiCurrentTimeIso();

                await firestoreDb.collection('cases').doc(caseId).update(statusUpdateData);
                const updatedStatusDoc = await firestoreDb.collection('cases').doc(caseId).get();
                const updatedStatusCaseData = updatedStatusDoc.data();
                updatedStatusCaseData.id = updatedStatusDoc.id;
                return res.status(200).json(updatedStatusCaseData);

            case 'DELETE':
                // DELETE /api/cases/{id} - Delete case
                // Admin password check
                const providedPasswordDelete = headers['x-admin-password'];
                if (!providedPasswordDelete || providedPasswordDelete !== ADMIN_PASSWORD) {
                    return res.status(403).json({ message: 'Incorrect admin password' });
                }

                const docToDelete = await firestoreDb.collection('cases').doc(caseId).get();
                if (!docToDelete.exists) {
                    return res.status(404).json({ message: 'Case not found' });
                }

                await firestoreDb.collection('cases').doc(caseId).delete();
                console.log(`Case with ID ${caseId} deleted successfully from Firestore.`);
                return res.status(200).json({ message: 'Case deleted successfully' });

            default:
                // If the request method is not supported
                return res.status(405).json({ message: 'Method Not Allowed' });
        }
    } catch (error) {
        console.error('API Error:', error);
        // Generic error response for any unhandled exceptions
        return res.status(500).json({ message: 'An internal server error occurred', error: error.message });
    }
};
