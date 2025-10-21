import { servicioSingleton } from "../services/servicios-module.js";
import { BaseManager } from "../components/BaseManager.js";

class PanelManager extends BaseManager {
  constructor() {
    super();
  }

  async init() {
    await super.init();
    this.setupEventListeners();
    this.loadPanelData();
    this.updateCurrentDate();
  }

  async loadData() {
    await this.loadPanelData();
  }

  setupEventListeners() {
    super.setupEventListeners();
  }

  async loadPanelData() {
    this.mostrarLoading(true);
    try {
      // Solo cargar datos necesarios para estadisticas
      const [libros, socios] = await Promise.all([
        servicioSingleton.obtenerLibros(),
        servicioSingleton.obtenerSocios(),
      ]);

      this.updateStats(libros, socios);
    } catch (error) {
      this.mostrarError("Error cargando datos del panel: " + error.message);
    } finally {
      this.mostrarLoading(false);
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
    const dateElement = document.getElementById("currentDate");
    if (dateElement) {
      dateElement.textContent = now.toLocaleDateString("es-ES", options);
    }
  }

  updateStats(libros, socios) {
    const stats = {
      totalLibros: libros.length,
      totalSocios: socios.length,
      prestamosActivos: 0, // Por ahora en 0
      librosDisponibles: libros.filter((libro) => libro.estado === "disponible")
        .length,
    };

    Object.keys(stats).forEach((key) => {
      const element = document.getElementById(key);
      if (element) element.textContent = stats[key];
    });
  }
}

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  new PanelManager().init();
});
