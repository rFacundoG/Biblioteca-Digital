import { AuthService } from "./auth/auth.js";
import { libroService } from "./services/libro-service.js";
import { socioService } from "./services/socio-service.js";

// Configuración global de la app
class BibliotecaApp {
  constructor() {
    this.init();
  }

  init() {
    console.log("Biblioteca App inicializada");
    this.protegerRutas();
    this.cargarDatosIniciales();
  }

  // Proteger rutas - redirigir al login si no está autenticado
  protegerRutas() {
    const rutasProtegidas = ["panel", "libros", "socios", "prestamos"];
    const paginaActual = window.location.pathname.split("/").pop();

    if (
      rutasProtegidas.includes(paginaActual.replace(".html", "")) &&
      !AuthService.estaLogueado()
    ) {
      window.location.href = "index.html";
    }
  }

  // Cargar datos iniciales para el panel
  async cargarDatosIniciales() {
    if (AuthService.estaLogueado()) {
      try {
        const [libros, socios, prestamos] = await Promise.all([
          libroService.obtenerLibros(),
          socioService.obtenerSocios(),
        ]);

        console.log("Datos cargados:", {
          totalLibros: libros.length,
          totalSocios: socios.length,
        });
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    }
  }
}

// Inicializar app cuando se carga la página
document.addEventListener("DOMContentLoaded", () => {
  window.bibliotecaApp = new BibliotecaApp();
});
