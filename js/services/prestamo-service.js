import { supabase } from "./supabase.js";

class PrestamoService {
  // Registrar nuevo préstamo
  async registrarPrestamo(prestamoData) {
    const { data, error } = await supabase
      .from("prestamos")
      .insert([prestamoData])
      .select();

    if (error) throw error;
    return data[0];
  }

  // Obtener préstamos activos
  async obtenerPrestamosActivos() {
    const { data, error } = await supabase
      .from("prestamos")
      .select(
        `
                *,
                libros (*),
                socios (*)
            `
      )
      .eq("estado", "activo")
      .order("fecha_devolucion");

    if (error) throw error;
    return data;
  }

  // Registrar devolución
  async registrarDevolucion(prestamoId, observaciones = "") {
    const { data, error } = await supabase
      .from("prestamos")
      .update({
        estado: "devuelto",
        fecha_devolucion_real: new Date().toISOString().split("T")[0],
        observaciones: observaciones,
      })
      .eq("id", prestamoId)
      .select();

    if (error) throw error;
    return data[0];
  }

  // Calcular multa 
  calcularMulta() {
    // En desarrollo
  }
}

export const prestamoService = new PrestamoService();
