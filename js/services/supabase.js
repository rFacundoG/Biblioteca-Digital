import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Configuración
const supabaseUrl = "https://jfrvceymjjpswxrfjijt.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcnZjZXltampwc3d4cmZqaWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDA3OTEsImV4cCI6MjA3NjIxNjc5MX0.3zucQ_MuQ-JzHKSm2SQzz-nyL7kxg-Uez1yN7qOfKGU";

// Crear cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función para probar la conexión
export async function testConnection() {
  try {
    const { data, error } = await supabase.from("libros").select("count");
    if (error) throw error;
    console.log("Conexión a Supabase exitosa");
    return true;
  } catch (error) {
    console.error("Error conectando a Supabase:", error);
    return false;
  }
}
