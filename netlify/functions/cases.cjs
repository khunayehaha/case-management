// api/cases.js
// This file will act as your backend API endpoint for /api/cases

let admin;

async function initializeFirebaseAdmin() {
    if (!admin) {
        try {
            admin = await import('firebase-admin');
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('✅ Firebase Admin SDK initialized successfully.');
        } catch (error) {
            console.error('❌ Error initializing Firebase Admin SDK:', error);
            throw new Error("Failed to initialize Firebase Admin SDK");
        }
    }
}

let db;

async function getFirestoreInstance() {
    if (!db) {
        await initializeFirebaseAdmin();
        db = admin.firestore();
    }
    return db;
}

function getThaiCurrentTimeIso() {
    const utcNow = new Date();
    const thaiTime = new Date(utcNow.getTime() + (7 * 60 * 60 * 1000));
    return thaiTime.toISOString();
}

const ADMIN_PASSWORD = "lawsugar6";

module.exports = async (req, res) => {
    try {
        await initializeFirebaseAdmin();
        const firestoreDb = await getFirestoreInstance();

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        const { method, url, headers } = req;

        let requestBody = req.body;
        if (typeof requestBody === 'string' && req.headers['content-type']?.includes('application/json')) {
            try {
                requestBody = JSON.parse(requestBody);
            } catch {
                return res.status(400).json({ message: "Invalid JSON in request body" });
            }
        }

        const pathSegments = url.split('/');
        const caseId = pathSegments[pathSegments.length - 1];

        switch (method) {
            case 'GET': {
                if (caseId && caseId !== 'cases' && !caseId.includes('status')) {
                    const doc = await firestoreDb.collection('cases').doc(caseId).get();
                    if (!doc.exists) {
                        return res.status(404).json({ message: 'Case not found' });
                    }
                    const caseData = doc.data();
                    caseData.id = doc.id;
                    return res.status(200).json(caseData);
                } else {
                    const snapshot = await firestoreDb.collection('cases').get();
                    const allCases = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    console.log(`✅ Retrieved ${allCases.length} cases from Firestore.`);
                    return res.status(200).json(allCases);
                }
            }

            case 'POST': {
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

                if (!newCaseData.farmer_name || !newCaseData.farmer_account_no || isNaN(newCaseData.cabinet_no) || isNaN(newCaseData.shelf_no) || isNaN(newCaseData.sequence_no)) {
                    return res.status(400).json({ message: 'Missing or invalid required fields' });
                }

                const docRef = await firestoreDb.collection('cases').add(newCaseData);
                newCaseData.id = docRef.id;
                console.log(`✅ New case added: ${newCaseData.id}`);
                return res.status(201).json(newCaseData);
            }

            case 'PUT': {
                const providedPassword = headers['x-admin-password'];
                if (!providedPassword || providedPassword !== ADMIN_PASSWORD) {
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
                console.log(`✅ Case updated: ${caseId}`);
                return res.status(200).json(updatedCaseData);
            }

            case 'PATCH': {
                const { action, borrower_name } = requestBody;
                if (!action || !borrower_name) {
                    return res.status(400).json({ message: 'Missing action or borrower_name' });
                }

                const docRef = firestoreDb.collection('cases').doc(caseId);
                const currentDoc = await docRef.get();
                if (!currentDoc.exists) {
                    return res.status(404).json({ message: 'Case not found' });
                }

                const currentStatus = currentDoc.data().status;
                const updateData = {};

                if (action === 'borrow') {
                    if (currentStatus === 'Borrowed') {
                        return res.status(409).json({ message: 'Case is already borrowed' });
                    }
                    updateData.status = 'Borrowed';
                    updateData.borrowed_by_user_name = borrower_name;
                    updateData.borrowed_date = getThaiCurrentTimeIso();
                    updateData.returned_date = null;
                    console.log(`✅ Case borrowed: ${caseId} by ${borrower_name}`);
                } else if (action === 'return') {
                    if (currentStatus === 'In Room') {
                        return res.status(409).json({ message: 'Case is already in room' });
                    }
                    updateData.status = 'In Room';
                    updateData.returned_date = getThaiCurrentTimeIso();
                    console.log(`✅ Case returned: ${caseId} by ${borrower_name}`);
                } else {
                    return res.status(400).json({ message: 'Invalid action' });
                }

                updateData.last_updated_by_user_name = borrower_name;
                updateData.last_updated_timestamp = getThaiCurrentTimeIso();

                await docRef.update(updateData);
                const updatedDoc = await docRef.get();
                const updatedCaseData = updatedDoc.data();
                updatedCaseData.id = updatedDoc.id;
                return res.status(200).json(updatedCaseData);
            }

            case 'DELETE': {
                const providedPassword = headers['x-admin-password'];
                if (!providedPassword || providedPassword !== ADMIN_PASSWORD) {
                    return res.status(403).json({ message: 'Incorrect admin password' });
                }

                const docRef = firestoreDb.collection('cases').doc(caseId);
                const doc = await docRef.get();
                if (!doc.exists) {
                    return res.status(404).json({ message: 'Case not found' });
                }

                await docRef.delete();
                console.log(`✅ Case deleted: ${caseId}`);
                return res.status(200).json({ message: 'Case deleted successfully' });
            }

            default:
                return res.status(405).json({ message: 'Method Not Allowed' });
        }

    } catch (error) {
        console.error('❌ API Error:', error);
        return res.status(500).json({ message: 'An internal server error occurred', error: error.message });
    }
};
