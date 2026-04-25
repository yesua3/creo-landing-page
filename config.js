// config.js
// Configuración de Supabase para CREO

// Reemplaza estos valores con los de tu proyecto de Supabase
// (Project Settings -> API)
const CONFIG = {
    SUPABASE_URL: 'https://TU_PROYECTO.supabase.co',
    SUPABASE_KEY: 'TU_CLAVE_ANONIMA_AQUI'
};

// Inicializar cliente Supabase
// El script de Supabase (UMD) provee la variable global "supabase".
// Creamos una nueva variable "supabaseClient" para no causar conflictos.
const supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
