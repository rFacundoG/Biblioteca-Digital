import { socioService } from "../services/socio-service.js";
import { BaseManager } from "../components/BaseManager.js";
import { TableManager } from "../components/TableManager.js";
import { FormManager } from "../components/FormManager.js";

class SociosManager extends BaseManager {
  constructor() {
    super();
    this.socios = [];
    this.filtrados = [];
    this.tableManager = new TableManager("sociosTableBody", "emptyState");
    this.formManager = new FormManager("nuevoSocioForm", "nuevoSocioModal");
    this.editFormManager = new FormManager(
      "editarSocioForm",
      "editarSocioModal"
    );
    this.init();
  }

  async init() {
    if (!(await this.checkAuthentication())) return;

    this.updateUserInfo();
    this.setupEventListeners();
    await this.cargarSocios();
  }

  setupEventListeners() {
    this.setupLogoutListener();
    this.formManager.setupForm((data) => this.registrarNuevoSocio(data));

    this.setupSearchInput("searchInput", (value) => this.filtrarSocios(value));
    this.setupFilterSelect("filterStatus", (value) =>
      this.filtrarSocios(document.getElementById("searchInput").value, value)
    );

    this.editFormManager.setupForm((data) => this.guardarEdicionSocio(data));

    // Event delegation para los botones de la tabla
    this.setupTableEventListeners();
  }

  setupTableEventListeners() {
    const tbody = document.getElementById("sociosTableBody");
    if (tbody) {
      tbody.addEventListener("click", (e) => {
        const target = e.target;

        // Encontrar el botón clickeado
        const button = target.closest("button");
        if (!button) return;

        // Encontrar la fila
        const row = button.closest("tr");
        if (!row) return;

        // Obtener el ID del socio del dataset
        const socioId = row.dataset.socioId;
        if (!socioId) return;

        // Determinar la acción basada en la clase o ícono
        if (
          button.querySelector(".fa-edit") ||
          button.classList.contains("btn-edit")
        ) {
          this.editarSocio(socioId);
        } else if (
          button.querySelector(".fa-trash") ||
          button.classList.contains("btn-delete")
        ) {
          this.eliminarSocio(socioId);
        }
      });
    }
  }

  async cargarSocios() {
    this.mostrarLoading(true);
    try {
      this.socios = await socioService.obtenerSocios();
      this.filtrados = [...this.socios];
      this.actualizarEstadisticas();
      this.renderizarTabla();
    } catch (error) {
      this.mostrarError("Error al cargar los socios: " + error.message);
    } finally {
      this.mostrarLoading(false);
    }
  }

  filtrarSocios(terminoBusqueda = "", filtroEstado = "") {
    let filtrados = this.socios;

    if (terminoBusqueda) {
      const termino = terminoBusqueda.toLowerCase();
      filtrados = filtrados.filter(
        (socio) =>
          socio.nombre.toLowerCase().includes(termino) ||
          socio.dni.toLowerCase().includes(termino) ||
          socio.numero_socio.toLowerCase().includes(termino)
      );
    }

    if (filtroEstado) {
      filtrados = filtrados.filter(
        (socio) =>
          (filtroEstado === "activo" && socio.activo) ||
          (filtroEstado === "inactivo" && !socio.activo)
      );
    }

    this.filtrados = filtrados;
    this.renderizarTabla();
  }

  renderizarTabla() {
    this.tableManager.renderTable(this.filtrados, (socio) =>
      this.renderFila(socio)
    );
  }

  renderFila(socio) {
    return `
    <tr data-socio-id="${socio.id}">
      <td>
        <span class="fw-bold text-primary">${socio.numero_socio || "N/A"}</span>
      </td>
      <td>${socio.nombre || "Sin nombre"}</td>
      <td>${socio.dni || "Sin DNI"}</td>
      <td>
        ${this.renderContacto(socio)}
      </td>
      <td>
        ${this.tableManager.createBadge(
          socio.activo ? "Activo" : "Inactivo",
          socio.activo ? "success" : "secondary"
        )}
      </td>
      <td>${
        socio.created_at
          ? new Date(socio.created_at).toLocaleDateString("es-ES")
          : "N/A"
      }</td>
      <td>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-primary btn-action btn-edit" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-outline-danger btn-action btn-delete" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
  }

  renderContacto(socio) {
    const contactos = [];
    if (socio.email)
      contactos.push(
        `<div><i class="fas fa-envelope me-1"></i>${socio.email}</div>`
      );
    if (socio.telefono)
      contactos.push(
        `<div><i class="fas fa-phone me-1"></i>${socio.telefono}</div>`
      );

    return contactos.length > 0
      ? contactos.join("")
      : '<span class="text-muted">Sin contacto</span>';
  }

  actualizarEstadisticas() {
    const stats = {
      totalSocios: this.socios.length,
      sociosActivos: this.socios.filter((s) => s.activo).length,
      sociosConMultas: 0, // Por implementar
    };

    Object.keys(stats).forEach((key) => {
      const element = document.getElementById(key);
      if (element) element.textContent = stats[key];
    });
  }

  async registrarNuevoSocio(formData) {
    try {
      // Validar campos requeridos
      if (!formData.nombre || formData.nombre.trim() === "") {
        this.mostrarError("El nombre es obligatorio");
        return;
      }

      if (!formData.dni || formData.dni.trim() === "") {
        this.mostrarError("El DNI es obligatorio");
        return;
      }

      // Verificar si el DNI ya existe
      const dniExistente = await socioService.verificarDNIExistente(
        formData.dni
      );
      if (dniExistente) {
        this.mostrarError("Ya existe un socio con este DNI");
        return;
      }

      // Preparar datos para enviar
      const socioData = {
        nombre: formData.nombre,
        dni: formData.dni,
        email: formData.email || null,
        telefono: formData.telefono || null,
      };

      await this.formManager.submitForm(async () => {
        await socioService.crearSocio(socioData);
        this.mostrarExito("Socio registrado exitosamente");
        await this.cargarSocios();
      }, formData);
    } catch (error) {
      console.error("Error completo:", error);
      this.mostrarError("Error al registrar el socio: " + error.message);
    }
  }

  async editarSocio(socioId) {
    try {
      // 1. Obtener los datos actuales del socio
      const socio = await socioService.obtenerSocioPorId(socioId);

      // 2. Llenar el formulario de edición
      this.editFormManager.fillForm({
        nombre: socio.nombre,
        dni: socio.dni,
        email: socio.email || "",
        telefono: socio.telefono || "",
        activo: socio.activo,
        socioId: socio.id,
      });

      // 3. Mostrar el modal de edición
      const editModal = new bootstrap.Modal(
        document.getElementById("editarSocioModal")
      );
      editModal.show();
    } catch (error) {
      this.mostrarError(
        "Error al cargar los datos del socio para edición: " + error.message
      );
    }
  }

  async guardarEdicionSocio(formData) {
    try {
      // 1. Validar campos requeridos
      if (!formData.nombre || formData.nombre.trim() === "") {
        this.mostrarError("El nombre es obligatorio");
        return;
      }

      if (!formData.dni || formData.dni.trim() === "") {
        this.mostrarError("El DNI es obligatorio");
        return;
      }

      const socioId = formData.socioId;
      if (!socioId) {
        this.mostrarError("ID de socio no encontrado para la edición.");
        return;
      }

      // 2. Preparar datos para actualizar
      const socioData = {
        nombre: formData.nombre,
        dni: formData.dni,
        email: formData.email || null,
        telefono: formData.telefono || null,
        activo: formData.activo || false,
      };

      await this.editFormManager.submitForm(async () => {
        await socioService.actualizarSocio(socioId, socioData);
        this.mostrarExito("Socio actualizado exitosamente");
        await this.cargarSocios();
      }, formData);
    } catch (error) {
      console.error("Error completo:", error);
      this.mostrarError("Error al actualizar el socio: " + error.message);
    }
  }

  async eliminarSocio(socioId) {
    if (
      !this.confirmarAccion(
        "¿Estás seguro de que quieres eliminar este socio? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      await socioService.eliminarSocio(socioId);
      this.mostrarExito("Socio eliminado exitosamente");
      await this.cargarSocios();
    } catch (error) {
      this.mostrarError("Error al eliminar el socio: " + error.message);
    }
  }
}

// Inicializar
let sociosManager;
document.addEventListener("DOMContentLoaded", () => {
  sociosManager = new SociosManager();
});
