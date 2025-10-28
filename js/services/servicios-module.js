import { supabase } from "./supabase.js";

// Clase Singleton para manejar todas las operaciones de base de datos
// Solo existe una instancia en toda la aplicacion
class ServiceSingleton {
  constructor() {
    // Si ya existe una instancia, retorna esa misma
    if (ServiceSingleton.instance) {
      return ServiceSingleton.instance;
    }
    // Si no existe, crea la primera instancia
    ServiceSingleton.instance = this;
  }

  // Metodos genericos para cualquier tabla

  // Obtiene todos los registros de una tabla
  async getAll(table, orderBy = "id") {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(orderBy);
    if (error) throw error;
    return data;
  }

  // Obtiene un registro por su ID
  async getById(table, id) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  // Crea un nuevo registro
  async create(table, data) {
    const { data: result, error } = await supabase
      .from(table)
      .insert([data])
      .select();
    if (error) throw error;
    return result[0];
  }

  // Actualiza un registro existente
  async update(table, id, data) {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq("id", id)
      .select();
    if (error) throw error;
    return result[0];
  }

  // Elimina un registro
  async delete(table, id) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw error;
    return true;
  }

  // Metodos especificos para libros

  // Obtiene todos los libros ordenados por titulo
  async obtenerLibros() {
    return this.getAll("libros", "titulo");
  }

  // Obtiene un libro por su ID
  async obtenerLibroPorId(id) {
    return this.getById("libros", id);
  }

  // Crea un nuevo libro con estado disponible
  async crearLibro(libroData) {
    return this.create("libros", { ...libroData, estado: "disponible" });
  }

  // Actualiza los datos de un libro
  async actualizarLibro(id, libroData) {
    return this.update("libros", id, libroData);
  }

  // Elimina un libro
  async eliminarLibro(id) {
    return this.delete("libros", id);
  }

  // Obtiene solo los libros que estan disponibles
  async obtenerLibrosDisponibles() {
    const { data, error } = await supabase
      .from("libros")
      .select("*")
      .eq("estado", "disponible")
      .order("titulo");
    if (error) throw error;
    return data;
  }

  // Metodos especificos para socios

  // Obtiene todos los socios ordenados por nombre
  async obtenerSocios() {
    return this.getAll("socios", "nombre");
  }

  // Obtiene un socio por su ID
  async obtenerSocioPorId(id) {
    return this.getById("socios", id);
  }

  // Crea un nuevo socio con numero automatico
  async crearSocio(socioData) {
    // Busca el ultimo socio para generar el siguiente numero
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

  // Actualiza los datos de un socio
  async actualizarSocio(id, socioData) {
    return this.update("socios", id, socioData);
  }

  // Elimina un socio
  async eliminarSocio(id) {
    return this.delete("socios", id);
  }

  // Verifica si un DNI ya esta registrado
  async verificarDNIExistente(dni) {
    const { data, error } = await supabase
      .from("socios")
      .select("id")
      .eq("dni", dni)
      .single();
    return data !== null;
  }

  // Metodos especificos para prestamos

  // Obtiene todos los prestamos activos con info de libros y socios
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

  // Registra un nuevo prestamo
  async registrarPrestamo(prestamoData) {
    const { data, error } = await supabase
      .from("prestamos")
      .insert([prestamoData])
      .select();

    if (error) throw error;
    return data[0];
  }

  // Registra la devolucion de un prestamo
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

  // Obtiene prestamos con multas o danos de un socio
  async obtenerPrestamosConMultas(socioId) {
    const { data, error } = await supabase
      .from("prestamos")
      .select(
        `
      *,
      libros (*)
    `
      )
      .eq("socio_id", socioId)
      .or("monto_multa.gt.0,tiene_dano.eq.true")
      .order("fecha_inicio", { ascending: false });

    if (error) throw error;
    return data;
  }
}

// Exporta una unica instancia del servicio
export const servicioSingleton = new ServiceSingleton();