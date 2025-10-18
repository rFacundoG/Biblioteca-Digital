import { supabase } from "./supabase.js";

class SocioService {
  // Obtener todos los socios
  async obtenerSocios() {
    const { data, error } = await supabase
      .from("socios")
      .select("*")
      .order("nombre");

    if (error) throw error;
    return data;
  }

  // Buscar socios por nombre o DNI
  async buscarSocios(termino) {
    const { data, error } = await supabase
      .from("socios")
      .select("*")
      .or(`nombre.ilike.%${termino}%,dni.ilike.%${termino}%`);

    if (error) throw error;
    return data;
  }

  // Crear nuevo socio
  async crearSocio(socioData) {
    // Generar número de socio automático
    const ultimoSocio = await supabase
      .from("socios")
      .select("numero_socio")
      .order("id", { ascending: false })
      .limit(1);

    let nuevoNumero = "SOC001";
    if (ultimoSocio.data && ultimoSocio.data.length > 0) {
      const ultimoNum = parseInt(
        ultimoSocio.data[0].numero_socio.replace("SOC", "")
      );
      nuevoNumero = "SOC" + String(ultimoNum + 1).padStart(3, "0");
    }

    const socioCompleto = {
      ...socioData,
      numero_socio: nuevoNumero,
    };

    const { data, error } = await supabase
      .from("socios")
      .insert([socioCompleto])
      .select();

    if (error) throw error;
    return data[0];
  }

  // Verificar si DNI ya existe
  async verificarDNIExistente(dni) {
    const { data, error } = await supabase
      .from("socios")
      .select("id")
      .eq("dni", dni)
      .single();

    return data !== null; // true si existe, false si no existe
  }
}

export const socioService = new SocioService();
