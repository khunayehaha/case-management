const admin = require('firebase-admin');

// lazy init firebase
let db;
function initializeFirebase() {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  db = admin.firestore();
}

// Thai time helper
function getThaiTimeISO() {
  const now = new Date();
  now.setHours(now.getHours() + 7);
  return now.toISOString();
}

const ADMIN_PASSWORD = "lawsugar6";

exports.handler = async function (event, context) {
  if (!db) initializeFirebase();

  const { httpMethod, path, headers, body } = event;

  const segments = path.split('/');
  const caseId = segments[segments.length - 1];
  const isStatusPath = path.includes('/status');

  const res = (statusCode, data) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (httpMethod === 'OPTIONS') return res(200, {});

  let requestBody = {};
  if (body) {
    try {
      requestBody = JSON.parse(body);
    } catch {
      return res(400, { message: 'Invalid JSON' });
    }
  }

  try {
    switch (httpMethod) {
      case 'GET':
        if (caseId && caseId !== 'cases' && !isStatusPath) {
          const doc = await db.collection('cases').doc(caseId).get();
          if (!doc.exists) return res(404, { message: 'Case not found' });
          return res(200, { id: doc.id, ...doc.data() });
        } else {
          const snapshot = await db.collection('cases').get();
          const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          return res(200, all);
        }

      case 'POST': {
        const newCase = {
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
          last_updated_timestamp: getThaiTimeISO(),
        };
        if (!newCase.farmer_name || !newCase.farmer_account_no ||
            isNaN(newCase.cabinet_no) || isNaN(newCase.shelf_no) || isNaN(newCase.sequence_no)) {
          return res(400, { message: 'Missing or invalid fields' });
        }
        const docRef = await db.collection('cases').add(newCase);
        return res(201, { id: docRef.id, ...newCase });
      }

      case 'PUT': {
        if (headers['x-admin-password'] !== ADMIN_PASSWORD) {
          return res(403, { message: 'Incorrect admin password' });
        }
        const update = {};
        ['farmer_name', 'farmer_account_no', 'cabinet_no', 'shelf_no', 'sequence_no'].forEach(key => {
          if (requestBody[key] !== undefined) {
            update[key] = key.includes('_no') ? parseInt(requestBody[key]) : requestBody[key];
          }
        });
        update.last_updated_by_user_name = "System";
        update.last_updated_timestamp = getThaiTimeISO();

        await db.collection('cases').doc(caseId).update(update);
        const updated = await db.collection('cases').doc(caseId).get();
        return res(200, { id: updated.id, ...updated.data() });
      }

      case 'PATCH': {
        const { action, borrower_name } = requestBody;
        if (!action || !borrower_name) {
          return res(400, { message: 'Missing action or borrower_name' });
        }
        const doc = await db.collection('cases').doc(caseId).get();
        if (!doc.exists) return res(404, { message: 'Case not found' });
        const current = doc.data().status;

        const statusUpdate = {};
        if (action === 'borrow') {
          if (current === 'Borrowed') return res(409, { message: 'Already borrowed' });
          Object.assign(statusUpdate, {
            status: 'Borrowed',
            borrowed_by_user_name: borrower_name,
            borrowed_date: getThaiTimeISO(),
            returned_date: null,
          });
        } else if (action === 'return') {
          if (current === 'In Room') return res(409, { message: 'Already in room' });
          Object.assign(statusUpdate, {
            status: 'In Room',
            returned_date: getThaiTimeISO(),
          });
        } else {
          return res(400, { message: 'Invalid action' });
        }
        statusUpdate.last_updated_by_user_name = borrower_name;
        statusUpdate.last_updated_timestamp = getThaiTimeISO();

        await db.collection('cases').doc(caseId).update(statusUpdate);
        const updated = await db.collection('cases').doc(caseId).get();
        return res(200, { id: updated.id, ...updated.data() });
      }

      case 'DELETE': {
        if (headers['x-admin-password'] !== ADMIN_PASSWORD) {
          return res(403, { message: 'Incorrect admin password' });
        }
        const doc = await db.collection('cases').doc(caseId).get();
        if (!doc.exists) return res(404, { message: 'Case not found' });
        await db.collection('cases').doc(caseId).delete();
        return res(200, { message: 'Case deleted successfully' });
      }

      default:
        return res(405, { message: 'Method Not Allowed' });
    }
  } catch (err) {
    console.error(err);
    return res(500, { message: 'Internal Server Error', error: err.message });
  }
};
