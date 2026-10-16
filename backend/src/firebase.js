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

// 2) Banco dados-openweather (histórico e análises): leitura e escrita, usa a chave da conta de serviço.
// Na nuvem a chave vem da variável FIREBASE_CHAVE_JSON (JSON puro ou em base64); local, do arquivo chave.json.
function carregarChave() {
    const env = process.env.FIREBASE_CHAVE_JSON?.trim();
    if (!env) return JSON.parse(readFileSync(new URL('./chave.json', import.meta.url), 'utf8'));
    return JSON.parse(env.startsWith('{') ? env : Buffer.from(env, 'base64').toString('utf8'));
}
const chave = carregarChave();
const appOw = admin.initializeApp({
    credential: admin.credential.cert(chave),
    databaseURL: process.env.DATABASE_URL_OW || 'https://dados-openweather-default-rtdb.asia-southeast1.firebasedatabase.app',
}, 'openweather');
export const dbOw = appOw.database();
