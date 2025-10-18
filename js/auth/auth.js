import { supabase } from "../services/supabase.js";

export class AuthService {
  static async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error("Error de login:", error.message);
        return false;
      }

      if (data.user) {
        console.log("Login exitoso:", data.user.email);

        // Actualizar last_login en la tabla de perfiles
        await this.actualizarLastLogin(data.user.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error en login:", error);
      return false;
    }
  }

  // Actualizar último login
  static async actualizarLastLogin(userId) {
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ last_login: new Date().toISOString() })
        .eq("id", userId);

      if (error) console.error("Error actualizando last_login:", error);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  // Cerrar sesión
  static async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      localStorage.removeItem("supabase_session");
      return true;
    } catch (error) {
      console.error("Error en logout:", error);
      return false;
    }
  }

  // Verificar si está logueado
  static async estaLogueado() {
    try {
      const { data, error } = await supabase.auth.getSession();
      return !error && data.session !== null;
    } catch (error) {
      console.error("Error verificando sesión:", error);
      return false;
    }
  }

  // Obtener usuario actual
  static async getUsuarioActual() {
    try {
      const { data, error } = await supabase.auth.getUser();
      return error ? null : data.user;
    } catch (error) {
      console.error("Error obteniendo usuario:", error);
      return null;
    }
  }

  // Obtener datos del perfil del usuario
  static async getPerfilUsuario() {
    try {
      const user = await this.getUsuarioActual();
      if (!user) return null;

      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error obteniendo perfil:", error);
      return null;
    }
  }

  // Verificar rol
  static async tieneRol(rol) {
    const perfil = await this.getPerfilUsuario();
    return perfil && perfil.rol === rol;
  }

  // Es bibliotecario
  static async esBibliotecario() {
    return await this.tieneRol("bibliotecario");
  }

  // Obtener sesión (para otras partes de la app)
  static async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      return error ? null : data.session;
    } catch (error) {
      console.error("Error obteniendo sesión:", error);
      return null;
    }
  }
}
