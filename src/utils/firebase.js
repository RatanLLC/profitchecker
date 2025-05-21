/** @format */

// File: src/utils/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: 'AIzaSyCazxn7lsj4Q9X9FLHozQIESpC2HL8Z4kI',
	authDomain: 'profit-expense-tracker.firebaseapp.com',
	projectId: 'profit-expense-tracker',
	storageBucket: 'profit-expense-tracker.firebasestorage.app',
	messagingSenderId: '9781251966',
	appId: '1:9781251966:web:b6d6e33203bfa3ce3e2d2f',
	measurementId: 'G-3HYJY774SC',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
