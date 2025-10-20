import { AuthService } from "./auth.js";

class LoginManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.autoFocusEmail();
    this.checkExistingSession();
  }

  setupEventListeners() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    }
  }

  autoFocusEmail() {
    const emailInput = document.getElementById("email");
    if (emailInput) {
      emailInput.focus();
    }
  }

  async checkExistingSession() {
    if (await AuthService.estaLogueado()) {
      this.redirectToPanel();
    }
  }

  async handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Limpiar mensajes anteriores
    this.hideError();
    this.hideSuccess();

    // Validar campos
    if (!this.validateFields(email, password)) {
      this.showError("Por favor, completa todos los campos correctamente.");
      return;
    }

    // Validar formato email
    if (!this.validateEmail(email)) {
      this.showError("Por favor, ingresa un email válido.");
      return;
    }

    // Intentar login
    await this.attemptLogin(email, password);
  }

  validateFields(email, password) {
    return email.trim() !== "" && password.trim() !== "";
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async attemptLogin(email, password) {
    const loginButton = document.querySelector(".btn-login");
    const originalContent = loginButton.innerHTML;

    try {
      // Mostrar estado de carga
      this.setButtonLoading(loginButton, true);

      const loginExitoso = await AuthService.login(email, password);

      if (loginExitoso) {
        // Verificar que sea bibliotecario
        const esBibliotecario = await AuthService.esBibliotecario();

        if (esBibliotecario) {
          this.showSuccess("¡Acceso concedido! Redirigiendo...");
          this.setButtonLoading(
            loginButton,
            true,
            '<i class="fas fa-check me-2"></i>Acceso concedido'
          );
          this.redirectToPanel();
        } else {
          await AuthService.logout();
          this.showError("No tienes permisos para acceder al sistema.");
          this.setButtonLoading(loginButton, false, originalContent);
        }
      } else {
        this.showError("Email o contraseña incorrectos.");
        this.shakeForm();
        this.setButtonLoading(loginButton, false, originalContent);
      }
    } catch (error) {
      console.error("Error en login:", error);
      this.showError("Error de conexión. Intenta nuevamente.");
      this.setButtonLoading(loginButton, false, originalContent);
    }
  }

  setButtonLoading(button, isLoading, content = null) {
    if (isLoading) {
      button.disabled = true;
      button.innerHTML =
        content || '<i class="fas fa-spinner fa-spin me-2"></i>Verificando...';
    } else {
      button.disabled = false;
      button.innerHTML =
        content || '<i class="fas fa-sign-in-alt me-2"></i>Ingresar al Sistema';
    }
  }

  showError(message) {
    const errorMessage = document.getElementById("errorMessage");
    const errorText = document.getElementById("errorText");

    errorText.textContent = message;
    errorMessage.classList.remove("d-none");
  }

  showSuccess(message) {
    console.log("Success:", message);
  }

  hideError() {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.classList.add("d-none");
  }

  hideSuccess() {
    // Ocultar mensajes de éxito si los hay
  }

  shakeForm() {
    const form = document.querySelector(".login-container");
    form.classList.add("shake-animation");

    setTimeout(() => {
      form.classList.remove("shake-animation");
    }, 500);
  }

  redirectToPanel() {
    setTimeout(() => {
      window.location.href = "pages/panel.html";
    }, 1500);
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  new LoginManager();
});
