import { AuthService } from "../auth/auth.js";

// Clase base que proporciona funcionalidades comunes para todos los managers
export class BaseManager {
  constructor() {
    this.currentUser = null; // Usuario actualmente logueado
    this.data = []; // Datos cargados
    this.filteredData = []; // Datos despues de aplicar filtros
  }

  // Inicializa el manager con autenticacion y carga de datos
  async init() {
    if (!(await this.checkAuthentication())) return;

    this.updateUserInfo();
    this.setupEventListeners();
    await this.loadData();
  }

  // Verifica si el usuario esta autenticado
  async checkAuthentication(redirectUrl = "../index.html") {
    const estaLogueado = await AuthService.estaLogueado();
    if (!estaLogueado) {
      window.location.href = redirectUrl;
      return false;
    }

    this.currentUser = await AuthService.getUsuarioActual();
    return true;
  }

  // Configura el listener para el boton de logout
  setupLogoutListener(btnId = "logoutBtn") {
    const logoutBtn = document.getElementById(btnId);
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }
  }

  // Maneja el proceso de logout
  async handleLogout() {
    if (await AuthService.logout()) {
      window.location.href = "../index.html";
    }
  }

  // Actualiza la informacion del usuario en la interfaz
  updateUserInfo(elementId = "userName") {
    if (this.currentUser && document.getElementById(elementId)) {
      document.getElementById(elementId).textContent = this.currentUser.email;
    }
  }

  // Configura los event listeners basicos
  setupEventListeners() {
    this.setupLogoutListener();
  }

  // Configura un input de busqueda con debounce
  setupSearchInput(inputId, callback, delay = 300) {
    const input = document.getElementById(inputId);
    if (!input) return;

    let timeout;
    input.addEventListener("input", (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => callback(e.target.value), delay);
    });
  }

  // Configura un select para filtros
  setupFilterSelect(selectId, callback) {
    const select = document.getElementById(selectId);
    if (select) {
      select.addEventListener("change", (e) => callback(e.target.value));
    }
  }

  // Muestra u oculta el estado de carga
  mostrarLoading(mostrar) {
    const loadingState = document.getElementById("loadingState");
    const emptyActivos = document.getElementById("emptyActivos");
    const prestamosActivosBody = document.getElementById(
      "prestamosActivosBody"
    );

    if (loadingState) {
      loadingState.classList.toggle("d-none", !mostrar);
    }

    if (prestamosActivosBody) {
      prestamosActivosBody.classList.toggle("d-none", mostrar);
    }

    if (emptyActivos && mostrar) {
      emptyActivos.classList.add("d-none");
    }
  }

  // Muestra un mensaje de exito
  mostrarExito(mensaje) {
    this.showNotification(mensaje, "success");
  }

  // Muestra un mensaje de error
  mostrarError(mensaje) {
    this.showNotification(mensaje, "error");
  }

  // Muestra una notificacion temporal
  showNotification(mensaje, tipo = "info") {
    const alertClass = tipo === "success" ? "alert-success" : "alert-danger";
    const alert = document.createElement("div");
    alert.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
    alert.style.cssText =
      "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
    alert.innerHTML = `
      ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alert);

    // Remueve la alerta automaticamente despues de 5 segundos
    setTimeout(() => {
      if (alert.parentNode) alert.parentNode.removeChild(alert);
    }, 5000);
  }

  // Muestra un dialogo de confirmacion
  confirmarAccion(mensaje) {
    return confirm(mensaje);
  }

  // Metodo que debe ser implementado por las clases hijas
  async loadData() {
    throw new Error("Metodo loadData debe ser implementado por la clase hija");
  }
}