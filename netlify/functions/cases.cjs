const admin = require('firebase-admin');

let db;

function getThaiCurrentTimeIso() {
    const utcNow = new Date();
    const thaiTime = new Date(utcNow.getTime() + (7 * 60 * 60 * 1000));
    return thaiTime.toISOString();
}

const ADMIN_PASSWORD = "lawsugar6";

exports.handler = async (event, context) => {
    if (!admin.apps.length) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    db = admin.firestore();

    const method = event.httpMethod;
    const pathSegments = event.path.split('/');
    const caseId = pathSegments[pathSegments.length - 1];
    let body = {};

    if (event.body) {
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid JSON in request body" })
            };
        }
    }

    try {
        switch (method) {
            case 'GET':
                if (caseId !== 'cases') {
                    const doc = await db.collection('cases').doc(caseId).get();
                    if (!doc.exists) {
                        return { statusCode: 404, body: JSON.stringify({ message: 'Case not found' }) };
                    }
                    return { statusCode: 200, body: JSON.stringify({ id: doc.id, ...doc.data() }) };
                } else {
                    const snapshot = await db.collection('cases').get();
                    const allCases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    return { statusCode: 200, body: JSON.stringify(allCases) };
                }

            case 'POST':
                const newCaseData = {
                    farmer_name: body.farmer_name,
                    farmer_account_no: body.farmer_account_no,
                    cabinet_no: parseInt(body.cabinet_no),
                    shelf_no: parseInt(body.shelf_no),
                    sequence_no: parseInt(body.sequence_no),
                    status: "In Room",
                    borrowed_by_user_name: null,
                    borrowed_date: null,
                    returned_date: null,
                    last_updated_by_user_name: "System",
                    last_updated_timestamp: getThaiCurrentTimeIso()
                };
                const docRef = await db.collection('cases').add(newCaseData);
                newCaseData.id = docRef.id;
                return { statusCode: 201, body: JSON.stringify(newCaseData) };

            default:
                return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
        }
    } catch (err) {
        console.error(err);
        return { statusCode: 500, body: JSON.stringify({ message: err.message }) };
    }
};
