import { supabase } from "./supabase.js";

class ServiceSingleton {
  constructor() {
    if (ServiceSingleton.instance) {
      return ServiceSingleton.instance;
    }
    ServiceSingleton.instance = this;
  }

  // Métodos genéricos
  async getAll(table, orderBy = "id") {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(orderBy);
    if (error) throw error;
    return data;
  }

  async getById(table, id) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  async create(table, data) {
    const { data: result, error } = await supabase
      .from(table)
      .insert([data])
      .select();
    if (error) throw error;
    return result[0];
  }

  async update(table, id, data) {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq("id", id)
      .select();
    if (error) throw error;
    return result[0];
  }

  async delete(table, id) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw error;
    return true;
  }

  // Métodos específicos para libros
  async obtenerLibros() {
    return this.getAll("libros", "titulo");
  }

  async obtenerLibroPorId(id) {
    return this.getById("libros", id);
  }

  async crearLibro(libroData) {
    return this.create("libros", { ...libroData, estado: "disponible" });
  }

  async actualizarLibro(id, libroData) {
    return this.update("libros", id, libroData);
  }

  async eliminarLibro(id) {
    return this.delete("libros", id);
  }

  async obtenerLibrosDisponibles() {
    const { data, error } = await supabase
      .from("libros")
      .select("*")
      .eq("estado", "disponible")
      .order("titulo");
    if (error) throw error;
    return data;
  }

  // Métodos específicos para socios
  async obtenerSocios() {
    return this.getAll("socios", "nombre");
  }

  async obtenerSocioPorId(id) {
    return this.getById("socios", id);
  }

  async crearSocio(socioData) {
    // Lógica específica para número de socio
    const ultimoSocio = await supabase
      .from("socios")
      .select("numero_socio")
      .order("id", { ascending: false })
      .limit(1);

    let nuevoNumero = "SOC001";
    if (ultimoSocio.data && ultimoSocio.data.length > 0) {
      const ultimoNum = ultimoSocio.data[0].numero_socio;
      if (ultimoNum) {
        const num = parseInt(ultimoNum.replace("SOC", ""));
        nuevoNumero = "SOC" + String(num + 1).padStart(3, "0");
      }
    }

    return this.create("socios", {
      ...socioData,
      numero_socio: nuevoNumero,
      activo: true,
    });
  }

  async actualizarSocio(id, socioData) {
    return this.update("socios", id, socioData);
  }

  async eliminarSocio(id) {
    return this.delete("socios", id);
  }

  async verificarDNIExistente(dni) {
    const { data, error } = await supabase
      .from("socios")
      .select("id")
      .eq("dni", dni)
      .single();
    return data !== null;
  }

  // Métodos específicos para prestamos
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

  async registrarPrestamo(prestamoData) {
    const { data, error } = await supabase
      .from("prestamos")
      .insert([prestamoData])
      .select();

    if (error) throw error;
    return data[0];
  }

  async registrarDevolucion(prestamoId, tieneDano = false, montoMulta = 0) {
    const { data, error } = await supabase
      .from("prestamos")
      .update({
        estado: "devuelto",
        fecha_devolucion_real: new Date().toISOString().split("T")[0],
        tiene_dano: tieneDano,
        monto_multa: montoMulta,
      })
      .eq("id", prestamoId)
      .select();

    if (error) throw error;
    return data[0];
  }
}

export const servicioSingleton = new ServiceSingleton();
