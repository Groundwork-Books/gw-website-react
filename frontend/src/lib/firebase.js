import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAxHOpafDIpDrINkelc2eYLR1m6VCWU2gc",
  authDomain: "groundworks-new.firebaseapp.com",
  projectId: "groundworks-new",
  storageBucket: "groundworks-new.appspot.com",
  messagingSenderId: "566713425579",
  appId: "groundworks-new"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);