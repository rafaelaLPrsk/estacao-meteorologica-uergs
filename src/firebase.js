// Importa as funções do Firebase
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyCY7Dg8dZgm0twrJVHk3XHibbEFrnDE_xc",
    authDomain: "tempo-uergs.firebaseapp.com",
    databaseURL: "https://tempo-uergs-default-rtdb.firebaseio.com",
    projectId: "tempo-uergs",
    storageBucket: "tempo-uergs.firebasestorage.app",
    messagingSenderId: "673346551715",
    appId: "1:673346551715:web:e2e1ef3c138fdafa31a416"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta o banco de dados
export const db = getDatabase(app);