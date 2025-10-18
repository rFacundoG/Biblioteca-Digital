import { supabase } from "./supabase.js";

class LibroService {
  // Obtener todos los libros
  async obtenerLibros() {
    const { data, error } = await supabase
      .from("libros")
      .select("*")
      .order("titulo");

    if (error) throw error;
    return data;
  }

  // Buscar libros por título o autor
  async buscarLibros(termino) {
    const { data, error } = await supabase
      .from("libros")
      .select("*")
      .or(`titulo.ilike.%${termino}%,autor.ilike.%${termino}%`);

    if (error) throw error;
    return data;
  }

  // Crear nuevo libro
  async crearLibro(libroData) {
    const { data, error } = await supabase
      .from("libros")
      .insert([libroData])
      .select();

    if (error) throw error;
    return data[0];
  }

  // Actualizar estado de libro
  async actualizarEstadoLibro(id, nuevoEstado) {
    const { data, error } = await supabase
      .from("libros")
      .update({ estado: nuevoEstado })
      .eq("id", id)
      .select();

    if (error) throw error;
    return data[0];
  }

  // Obtener libros disponibles
  async obtenerLibrosDisponibles() {
    const { data, error } = await supabase
      .from("libros")
      .select("*")
      .eq("estado", "disponible")
      .order("titulo");

    if (error) throw error;
    return data;
  }
}

export const libroService = new LibroService();
