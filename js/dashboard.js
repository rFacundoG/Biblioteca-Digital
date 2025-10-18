import { AuthService } from "../js/auth/auth.js";
import { libroService } from "../js/services/libro-service.js";
import { socioService } from "../js/services/socio-service.js";
import { prestamoService } from "../js/services/prestamo-service.js";

class DashboardManager {
  constructor() {
    this.init();
  }

  async init() {
    await this.checkAuthentication();
    this.setupEventListeners();
    this.loadDashboardData();
    this.updateCurrentDate();
  }

  async checkAuthentication() {
    if (!(await AuthService.estaLogueado())) {
      window.location.href = "../index.html";
      return;
    }

    // Mostrar nombre del usuario
    const user = await AuthService.getUsuarioActual();
    if (user) {
      document.getElementById("userName").textContent = user.email;
    }
  }

  setupEventListeners() {
    // Logout
    document.getElementById("logoutBtn").addEventListener("click", (e) => {
      e.preventDefault();
      this.handleLogout();
    });
  }

  async handleLogout() {
    if (await AuthService.logout()) {
      window.location.href = "../index.html";
    }
  }

  updateCurrentDate() {
    const now = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    document.getElementById("currentDate").textContent = now.toLocaleDateString(
      "es-ES",
      options
    );
  }

  async loadDashboardData() {
    try {
      // Cargar datos en paralelo
      const [libros, socios, prestamosActivos] = await Promise.all([
        libroService.obtenerLibros(),
        socioService.obtenerSocios(),
        prestamoService.obtenerPrestamosActivos(),
      ]);

      // Actualizar estadísticas
      this.updateStats(libros, socios, prestamosActivos);

      // Cargar datos adicionales
      this.loadRecentLoans(prestamosActivos);
      this.loadPopularBooks(libros);
    } catch (error) {
      console.error("Error cargando datos del dashboard:", error);
    }
  }

  updateStats(libros, socios, prestamosActivos) {
    document.getElementById("totalLibros").textContent = libros.length;
    document.getElementById("totalSocios").textContent = socios.length;
    document.getElementById("prestamosActivos").textContent =
      prestamosActivos.length;

    const librosDisponibles = libros.filter(
      (libro) => libro.estado === "disponible"
    ).length;
    document.getElementById("librosDisponibles").textContent =
      librosDisponibles;
  }

  loadRecentLoans(prestamos) {
    const container = document.getElementById("recentLoansList");
    const recentLoans = prestamos.slice(0, 5); // Últimos 5 préstamos

    if (recentLoans.length === 0) {
      container.innerHTML =
        '<div class="activity-item text-muted">No hay préstamos activos</div>';
      return;
    }

    container.innerHTML = recentLoans
      .map(
        (prestamo) => `
                    <div class="activity-item">
                        <div class="fw-bold">${
                          prestamo.libros?.titulo || "Libro"
                        }</div>
                        <small class="text-muted">
                            Por: ${prestamo.socios?.nombre || "Socio"} • 
                            Vence: ${new Date(
                              prestamo.fecha_devolucion
                            ).toLocaleDateString()}
                        </small>
                    </div>
                `
      )
      .join("");
  }

  loadPopularBooks(libros) {
    const container = document.getElementById("popularBooksList");
    const popularBooks = libros.slice(0, 5); // Primeros 5 libros

    container.innerHTML = popularBooks
      .map(
        (libro) => `
                    <div class="activity-item">
                        <div class="fw-bold">${libro.titulo}</div>
                        <small class="text-muted">
                            ${libro.autor} • 
                            <span class="badge ${
                              libro.estado === "disponible"
                                ? "bg-success"
                                : "bg-warning"
                            }">
                                ${libro.estado}
                            </span>
                        </small>
                    </div>
                `
      )
      .join("");
  }
}

// Inicializar dashboard cuando se carga la página
document.addEventListener("DOMContentLoaded", () => {
  new DashboardManager();
});
