// libros.js - VERSIÓN FINAL CORREGIDA
import { servicioSingleton } from "../services/servicios-module.js";
import { BaseManager } from "../components/BaseManager.js";
import { TableManager } from "../components/TableManager.js";
import { FormManager } from "../components/FormManager.js";
import { FilterStrategy, FilterManager } from "../components/FilterStrategy.js";

class LibrosManager extends BaseManager {
  constructor() {
    super();
    this.libros = [];
    this.filtrados = [];
    this.tableManager = new TableManager("librosTableBody", "emptyState");
    this.formManager = new FormManager("nuevoLibroForm", "nuevoLibroModal");
    this.editFormManager = new FormManager(
      "editarLibroForm",
      "editarLibroModal"
    );

    // Strategy Pattern para filtros
    this.filterManager = new FilterManager(
      new FilterStrategy.COMPOSITE([
        new FilterStrategy.TEXT(["titulo", "autor", "isbn"]),
        new FilterStrategy.STATUS("estado"),
        new FilterStrategy.TEXT(["categoria"]),
      ])
    );
  }

  async init() {
    await super.init(); // Llama al init del BaseManager
  }

  async loadData() {
    this.mostrarLoading(true);
    try {
      this.libros = await servicioSingleton.obtenerLibros();
      this.filtrados = [...this.libros];
      this.actualizarEstadisticas();
      this.renderTable();
    } catch (error) {
      this.mostrarError("Error al cargar los libros: " + error.message);
    } finally {
      this.mostrarLoading(false);
    }
  }

  setupEventListeners() {
    super.setupEventListeners();
    this.formManager.setupForm((data) => this.registrarNuevoLibro(data));
    this.editFormManager.setupForm((data) => this.guardarEdicionLibro(data));

    this.setupSearchInput("searchInput", (value) => this.filtrarLibros(value));
    this.setupFilterSelect("filterStatus", (value) =>
      this.filtrarLibros(
        document.getElementById("searchInput").value,
        value,
        document.getElementById("filterCategory")?.value
      )
    );

    const filterCategory = document.getElementById("filterCategory");
    if (filterCategory) {
      filterCategory.addEventListener("change", (e) =>
        this.filtrarLibros(
          document.getElementById("searchInput").value,
          document.getElementById("filterStatus")?.value,
          e.target.value
        )
      );
    }

    this.setupTableEventListeners();
  }

  setupTableEventListeners() {
    const tbody = document.getElementById("librosTableBody");
    if (tbody) {
      tbody.addEventListener("click", (e) => {
        const button = e.target.closest("button");
        if (!button) return;

        const row = button.closest("tr");
        const libroId = row?.dataset.libroId;
        if (!libroId) return;

        if (
          button.querySelector(".fa-edit") ||
          button.classList.contains("btn-editar")
        ) {
          this.editarLibro(parseInt(libroId));
        } else if (
          button.querySelector(".fa-trash") ||
          button.classList.contains("btn-eliminar")
        ) {
          this.eliminarLibro(parseInt(libroId));
        }
      });
    }
  }

  filtrarLibros(termino = "", estado = "", categoria = "") {
    this.filtrados = this.filterManager.applyFilter(
      this.libros,
      termino,
      estado,
      categoria
    );
    this.renderTable();
  }

  renderTable() {
    this.tableManager.renderTable(this.filtrados, (libro) =>
      this.renderFila(libro)
    );
  }

  renderFila(libro) {
    return `
    <tr data-libro-id="${libro.id}">
      <td>${this.renderizarPortada(libro)}</td>
      <td>
        <div class="book-title">${libro.titulo}</div>
        ${
          libro.categoria
            ? `<small class="text-muted">${libro.categoria}</small>`
            : ""
        }
      </td>
      <td>${libro.autor}</td>
      <td>${libro.isbn || '<span class="text-muted">N/A</span>'}</td>
      <td>${this.tableManager.createBadge(
        this.getEstadoTexto(libro.estado),
        libro.estado
      )}</td>
      <td>${new Date(libro.created_at).toLocaleDateString("es-ES")}</td>
      <td>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-primary btn-action btn-editar" title="Editar libro">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-outline-danger btn-action btn-eliminar" title="Eliminar libro">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
    `;
  }

  renderizarPortada(libro) {
    if (libro.portada_url) {
      return `<img src="${libro.portada_url}" alt="${libro.titulo}" class="book-cover">`;
    }

    const iniciales = libro.titulo
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
    return `<div class="book-cover book-cover-placeholder">${iniciales}</div>`;
  }

  getEstadoTexto(estado) {
    const textos = {
      disponible: "Disponible",
      prestado: "Prestado",
      mantenimiento: "En Mantenimiento",
    };
    return textos[estado] || estado;
  }

  actualizarEstadisticas() {
    const stats = {
      totalLibros: this.libros.length,
      librosDisponibles: this.libros.filter((l) => l.estado === "disponible")
        .length,
      librosPrestados: this.libros.filter((l) => l.estado === "prestado")
        .length,
    };

    Object.keys(stats).forEach((key) => {
      const element = document.getElementById(key);
      if (element) element.textContent = stats[key];
    });
  }

  async registrarNuevoLibro(formData) {
    try {
      if (!this.validarCamposRequeridos(formData, ["titulo", "autor"])) return;

      const libroData = this.prepararDatosLibro(formData);

      await this.formManager.submitForm(async () => {
        await servicioSingleton.crearLibro(libroData);
        this.mostrarExito("Libro registrado exitosamente");
        await this.loadData();
      }, formData);
    } catch (error) {
      this.mostrarError("Error al registrar el libro: " + error.message);
    }
  }

  async editarLibro(libroId) {
    try {
      const libro = await servicioSingleton.obtenerLibroPorId(libroId);

      let fechaPublicacion = "";
      if (libro.fecha_publicacion) {
        const fecha = new Date(libro.fecha_publicacion);
        fechaPublicacion = fecha.toISOString().split("T")[0];
      }

      this.editFormManager.fillForm({
        titulo: libro.titulo,
        autor: libro.autor,
        isbn: libro.isbn || "",
        categoria: libro.categoria || "",
        fecha_publicacion: fechaPublicacion,
        descripcion: libro.descripcion || "",
        portada_url: libro.portada_url || "",
        libroId: libro.id,
      });

      const editModal = new bootstrap.Modal(
        document.getElementById("editarLibroModal")
      );
      editModal.show();
    } catch (error) {
      this.mostrarError(
        "Error al cargar los datos del libro para edición: " + error.message
      );
    }
  }

  async guardarEdicionLibro(formData) {
    try {
      if (!this.validarCamposRequeridos(formData, ["titulo", "autor"])) return;

      const libroId = formData.libroId;
      if (!libroId) {
        this.mostrarError("ID de libro no encontrado para la edición.");
        return;
      }

      const libroData = this.prepararDatosLibro(formData);

      await this.editFormManager.submitForm(async () => {
        await servicioSingleton.actualizarLibro(libroId, libroData);
        this.mostrarExito("Libro actualizado exitosamente");
        await this.loadData();
      }, formData);
    } catch (error) {
      this.mostrarError("Error al actualizar el libro: " + error.message);
    }
  }

  async eliminarLibro(libroId) {
    if (
      !(await this.confirmarAccion(
        "¿Estás seguro de que quieres eliminar este libro? Esta acción no se puede deshacer."
      ))
    )
      return;

    try {
      await servicioSingleton.eliminarLibro(libroId);
      this.mostrarExito("Libro eliminado exitosamente");
      await this.loadData();
    } catch (error) {
      this.mostrarError("Error al eliminar el libro: " + error.message);
    }
  }

  validarCamposRequeridos(formData, campos) {
    for (const campo of campos) {
      if (!formData[campo]?.trim()) {
        this.mostrarError(`El ${campo} es obligatorio`);
        return false;
      }
    }
    return true;
  }

  prepararDatosLibro(formData) {
    return {
      titulo: formData.titulo,
      autor: formData.autor,
      isbn: formData.isbn || null,
      categoria: formData.categoria || null,
      fecha_publicacion: formData.fecha_publicacion || null,
      descripcion: formData.descripcion || null,
      portada_url: formData.portada_url || null,
    };
  }
}

// Inicializar 
document.addEventListener("DOMContentLoaded", () => {
  new LibrosManager().init();
});
