import { AuthService } from "../auth/auth.js";

export class BaseManager {
  constructor() {
    // Guarda al usuario actualmente autenticado
    this.currentUser = null;
  }

  // Verifica si el usuario está autenticado.
  // Si no lo esta, lo redirige a index.html.
  async checkAuthentication(redirectUrl = "../index.html") {
    if (!(await AuthService.estaLogueado())) {
      window.location.href = redirectUrl;
      return false;
    }

    // Si el usuario está autenticado, guarda su informacion
    this.currentUser = await AuthService.getUsuarioActual();
    return true;
  }

  // Configura el boton de logout para cerrar sesion al hacer clic.
  setupLogoutListener(btnId = "logoutBtn") {
    const logoutBtn = document.getElementById(btnId);
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }
  }

  // Cierra la sesion del usuario y redirige a la pagina principal.
  async handleLogout() {
    if (await AuthService.logout()) {
      window.location.href = "../index.html";
    }
  }

  // Muestra el correo del usuario autenticado en un elemento HTML.
  updateUserInfo(elementId = "userName") {
    if (this.currentUser && document.getElementById(elementId)) {
      document.getElementById(elementId).textContent = this.currentUser.email;
    }
  }

  mostrarLoading(mostrar, loadingId = "loadingState") {
    const loading = document.getElementById(loadingId);
    if (loading) {
      loading.classList.toggle("d-none", !mostrar);
    }
  }

  mostrarExito(mensaje) {
    console.log("Éxito:", mensaje);
    this.showNotification(mensaje, "success");
  }

  mostrarError(mensaje) {
    console.error("Error:", mensaje);
    this.showNotification(mensaje, "error");
  }

  // Muestra una notificacion visual para el usuario
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

    // La alerta desaparece automaticamente despues de 5 segundos
    setTimeout(() => {
      if (alert.parentNode) alert.parentNode.removeChild(alert);
    }, 5000);
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

  // Muestra un cuadro de confirmación nativo del navegador.
  confirmarAccion(mensaje) {
    return confirm(mensaje);
  }
}
