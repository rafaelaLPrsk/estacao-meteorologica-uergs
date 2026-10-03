import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import admin from 'firebase-admin';

// 1) Banco da estação (tempo-uergs): só leitura, configuração pública, sem chave.
const app = initializeApp({
    apiKey: "AIzaSyCY7Dg8dZgm0twrJVHk3XHibbEFrnDE_xc",
    authDomain: "tempo-uergs.firebaseapp.com",
    databaseURL: "https://tempo-uergs-default-rtdb.firebaseio.com",
    projectId: "tempo-uergs",
    storageBucket: "tempo-uergs.firebasestorage.app",
    messagingSenderId: "673346551715",
    appId: "1:673346551715:web:e2e1ef3c138fdafa31a416"
});
export const db = getDatabase(app);

// 2) Banco dados-openweather (histórico e análises): leitura e escrita, usa a chave.json (conta de serviço).
const chave = JSON.parse(readFileSync(new URL('./chave.json', import.meta.url), 'utf8'));
const appOw = admin.initializeApp({
    credential: admin.credential.cert(chave),
    databaseURL: process.env.DATABASE_URL_OW || 'https://dados-openweather-default-rtdb.asia-southeast1.firebasedatabase.app',
}, 'openweather');
export const dbOw = appOw.database();
