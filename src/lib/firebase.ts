import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getDatabase, connectDatabaseEmulator, ref, set, get, child, update, remove, onValue, off, query, orderByChild, limitToLast } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCN2VD44BbiRFu3ZnyQS95VHw1bt_AHpCY",
  authDomain: "zero-seventeen-dashboard.firebaseapp.com",
  databaseURL: "https://zero-seventeen-dashboard-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "zero-seventeen-dashboard",
  storageBucket: "zero-seventeen-dashboard.firebasestorage.app",
  messagingSenderId: "835193047848",
  appId: "1:835193047848:web:d9016511af66fc282f1e1d",
  measurementId: "G-QEXRLQ9L8B"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);

export { ref, set, get, child, update, remove, onValue, off, query, orderByChild, limitToLast };
