import { servicioSingleton } from "../services/servicios-module.js";
import { BaseManager } from "../components/BaseManager.js";
import { TableManager } from "../components/TableManager.js";
import { FormManager } from "../components/FormManager.js";
import { FilterStrategy, FilterManager } from "../components/FilterStrategy.js";

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

    // Strategy Pattern para filtros
    this.filterManager = new FilterManager(
      new FilterStrategy.COMPOSITE([
        new FilterStrategy.TEXT(["nombre", "dni", "numero_socio"]),
        new FilterStrategy.BOOLEAN("activo"),
      ])
    );
  }

  async init() {
    await super.init();
  }

  async loadData() {
    this.mostrarLoading(true);
    try {
      this.socios = await servicioSingleton.obtenerSocios();
      this.filtrados = [...this.socios];
      this.actualizarEstadisticas();
      this.renderTable();
    } catch (error) {
      this.mostrarError("Error al cargar los socios: " + error.message);
    } finally {
      this.mostrarLoading(false);
    }
  }

  setupEventListeners() {
    super.setupEventListeners();
    this.formManager.setupForm((data) => this.registrarNuevoSocio(data));
    this.editFormManager.setupForm((data) => this.guardarEdicionSocio(data));

    this.setupSearchInput("searchInput", (value) => this.filtrarSocios(value));
    this.setupFilterSelect("filterStatus", (value) =>
      this.filtrarSocios(document.getElementById("searchInput").value, value)
    );

    this.setupTableEventListeners();
  }

  setupTableEventListeners() {
    const tbody = document.getElementById("sociosTableBody");
    if (tbody) {
      tbody.addEventListener("click", (e) => {
        const button = e.target.closest("button");
        if (!button) return;

        const row = button.closest("tr");
        const socioId = row?.dataset.socioId;
        if (!socioId) return;

        if (button.classList.contains("btn-multas")) {
          this.verMultasSocio(socioId);
        }

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

  filtrarSocios(termino = "", estado = "") {
    this.filtrados = this.filterManager.applyFilter(
      this.socios,
      termino,
      estado
    );
    this.renderTable();
  }

  renderTable() {
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
          <button class="btn btn-outline-primary btn-action btn-multas" title="Ver Multas">
            <i class="fas fa-money-bill-wave"></i>
          </button>
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
      if (!this.validarCamposRequeridos(formData, ["nombre", "dni"])) return;

      const dniExistente = await servicioSingleton.verificarDNIExistente(
        formData.dni
      );
      if (dniExistente) {
        this.mostrarError("Ya existe un socio con este DNI");
        return;
      }

      const socioData = this.prepararDatosSocio(formData);

      await this.formManager.submitForm(async () => {
        await servicioSingleton.crearSocio(socioData);
        this.mostrarExito("Socio registrado exitosamente");
        await this.loadData();
      }, formData);
    } catch (error) {
      this.mostrarError("Error al registrar el socio: " + error.message);
    }
  }

  async editarSocio(socioId) {
    try {
      const socio = await servicioSingleton.obtenerSocioPorId(socioId);

      this.editFormManager.fillForm({
        nombre: socio.nombre,
        dni: socio.dni,
        email: socio.email || "",
        telefono: socio.telefono || "",
        activo: socio.activo,
        socioId: socio.id,
      });

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
      if (!this.validarCamposRequeridos(formData, ["nombre", "dni"])) return;

      const socioId = formData.socioId;
      if (!socioId) {
        this.mostrarError("ID de socio no encontrado para la edición.");
        return;
      }

      const socioData = this.prepararDatosSocio(formData);

      await this.editFormManager.submitForm(async () => {
        await servicioSingleton.actualizarSocio(socioId, socioData);
        this.mostrarExito("Socio actualizado exitosamente");
        await this.loadData();
      }, formData);
    } catch (error) {
      this.mostrarError("Error al actualizar el socio: " + error.message);
    }
  }

  async eliminarSocio(socioId) {
    if (
      !(await this.confirmarAccion(
        "¿Estás seguro de que quieres eliminar este socio? Esta acción no se puede deshacer."
      ))
    )
      return;

    try {
      await servicioSingleton.eliminarSocio(socioId);
      this.mostrarExito("Socio eliminado exitosamente");
      await this.loadData();
    } catch (error) {
      this.mostrarError("Error al eliminar el socio: " + error.message);
    }
  }

  async verMultasSocio(socioId) {
    try {
      const prestamosConMultas =
        await servicioSingleton.obtenerPrestamosConMultas(socioId);

      const totalAdeudado = prestamosConMultas.reduce((total, prestamo) => {
        return total + (parseFloat(prestamo.monto_multa) || 0);
      }, 0);

      this.mostrarDetallesMultas(prestamosConMultas, totalAdeudado);
    } catch (error) {
      this.mostrarError(
        "Error al cargar las multas del socio: " + error.message
      );
    }
  }

  mostrarDetallesMultas(prestamosConMultas, totalAdeudado) {
    // Crear contenido del modal
    let contenido = `
    <div class="modal-header">
      <h5 class="modal-title">Detalle de Multas del Socio</h5>
      <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    </div>
    <div class="modal-body">
      <div class="alert alert-warning">
        <strong>Total adeudado: $${totalAdeudado.toFixed(2)}</strong>
      </div>
  `;

    if (prestamosConMultas.length === 0) {
      contenido += `
      <div class="text-center text-muted py-3">
        <i class="fas fa-check-circle fa-2x mb-2"></i>
        <p>El socio no tiene multas pendientes</p>
      </div>
    `;
    } else {
      contenido += `
      <h6>Préstamos con multas:</h6>
      <div class="table-responsive">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Libro</th>
              <th>Fecha Préstamo</th>
              <th>Multa</th>
              <th>Daño</th>
            </tr>
          </thead>
          <tbody>
    `;

      prestamosConMultas.forEach((prestamo) => {
        contenido += `
        <tr>
          <td>${prestamo.libros?.titulo || "N/A"}</td>
          <td>${new Date(prestamo.fecha_inicio).toLocaleDateString(
            "es-ES"
          )}</td>
          <td>$${(parseFloat(prestamo.monto_multa) || 0).toFixed(2)}</td>
          <td>${prestamo.tiene_dano ? "Sí" : "No"}</td>
        </tr>
      `;
      });

      contenido += `
          </tbody>
        </table>
      </div>
    `;
    }

    contenido += `
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
    </div>
  `;

    // Crear o actualizar modal
    let modal = document.getElementById("multasModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "multasModal";
      modal.className = "modal fade";
      modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          ${contenido}
        </div>
      </div>
    `;
      document.body.appendChild(modal);
    } else {
      modal.querySelector(".modal-content").innerHTML = contenido;
    }

    // Mostrar modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
  }

  // Métodos helper
  validarCamposRequeridos(formData, campos) {
    for (const campo of campos) {
      if (!formData[campo]?.trim()) {
        this.mostrarError(`El ${campo} es obligatorio`);
        return false;
      }
    }
    return true;
  }

  prepararDatosSocio(formData) {
    return {
      nombre: formData.nombre,
      dni: formData.dni,
      email: formData.email || null,
      telefono: formData.telefono || null,
      activo: formData.activo || false,
    };
  }
}

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  new SociosManager().init();
});
