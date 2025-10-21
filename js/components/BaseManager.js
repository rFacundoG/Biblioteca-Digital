import { AuthService } from "../auth/auth.js";

export class BaseManager {
  constructor() {
    this.currentUser = null;
    this.data = [];
    this.filteredData = [];
  }

  // Método de inicializacion
  async init() {
    if (!(await this.checkAuthentication())) return;

    this.updateUserInfo();
    this.setupEventListeners();
    await this.loadData();
  }

  async checkAuthentication(redirectUrl = "../index.html") {
    const estaLogueado = await AuthService.estaLogueado();
    if (!estaLogueado) {
      window.location.href = redirectUrl;
      return false;
    }

    this.currentUser = await AuthService.getUsuarioActual();
    return true;
  }

  setupLogoutListener(btnId = "logoutBtn") {
    const logoutBtn = document.getElementById(btnId);
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }
  }

  async handleLogout() {
    if (await AuthService.logout()) {
      window.location.href = "../index.html";
    }
  }

  updateUserInfo(elementId = "userName") {
    if (this.currentUser && document.getElementById(elementId)) {
      document.getElementById(elementId).textContent = this.currentUser.email;
    }
  }

  setupEventListeners() {
    this.setupLogoutListener();
  }

  setupSearchInput(inputId, callback, delay = 300) {
    const input = document.getElementById(inputId);
    if (!input) return;

    let timeout;
    input.addEventListener("input", (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => callback(e.target.value), delay);
    });
  }

  setupFilterSelect(selectId, callback) {
    const select = document.getElementById(selectId);
    if (select) {
      select.addEventListener("change", (e) => callback(e.target.value));
    }
  }

  mostrarLoading(mostrar, loadingId = "loadingState") {
    const loading = document.getElementById(loadingId);
    if (loading) {
      loading.classList.toggle("d-none", !mostrar);
    }
  }

  mostrarExito(mensaje) {
    this.showNotification(mensaje, "success");
  }

  mostrarError(mensaje) {
    this.showNotification(mensaje, "error");
  }

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

    setTimeout(() => {
      if (alert.parentNode) alert.parentNode.removeChild(alert);
    }, 5000);
  }

  confirmarAccion(mensaje) {
    return confirm(mensaje);
  }

  // Método abstracto - debe ser implementado por las clases hijas
  async loadData() {
    throw new Error("Método loadData debe ser implementado por la clase hija");
  }
}
