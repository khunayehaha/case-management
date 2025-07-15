const admin = require('firebase-admin');

let app;

function initializeFirebase() {
  if (!app) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
}

exports.handler = async function (event, context) {
  try {
    initializeFirebase();

    const db = admin.firestore();

    const snapshot = await db.collection('cases').get();
    const cases = [];
    snapshot.forEach(doc => {
      cases.push({ id: doc.id, ...doc.data() });
    });

    return {
      statusCode: 200,
      body: JSON.stringify(cases)
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
