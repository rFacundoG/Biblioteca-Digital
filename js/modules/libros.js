// libros.js - VERSIÓN CORREGIDA
import { libroService } from "../services/libro-service.js";
import { BaseManager } from "../components/BaseManager.js";
import { TableManager } from "../components/TableManager.js";
import { FormManager } from "../components/FormManager.js";

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
    this.init();
  }

  async init() {
    if (!(await this.checkAuthentication())) return;

    this.updateUserInfo();
    this.setupEventListeners();
    await this.cargarLibros();
  }

  setupEventListeners() {
    this.setupLogoutListener();
    this.formManager.setupForm((data) => this.registrarNuevoLibro(data));
    this.editFormManager.setupForm((data) => this.guardarEdicionLibro(data));

    this.setupSearchInput("searchInput", (value) => this.filtrarLibros(value));
    this.setupFilterSelect("filterStatus", (value) =>
      this.filtrarLibros(document.getElementById("searchInput").value, value)
    );
    this.setupFilterSelect("filterCategory", (value) =>
      this.filtrarLibros(
        document.getElementById("searchInput").value,
        document.getElementById("filterStatus").value,
        value
      )
    );

    // Event delegation para los botones de la tabla
    this.setupTableEventListeners();
  }

  setupTableEventListeners() {
    const tbody = document.getElementById("librosTableBody");
    if (tbody) {
      tbody.addEventListener("click", (e) => {
        const target = e.target;

        // Encontrar el boton clickeado
        const button = target.closest("button");
        if (!button) return;

        // Encontrar la fila
        const row = button.closest("tr");
        if (!row) return;

        // Obtener el ID del libro del dataset
        const libroId = row.dataset.libroId;
        if (!libroId) return;

        // Determinar la accion basada en la clase o icono
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

  async cargarLibros() {
    this.mostrarLoading(true);
    try {
      this.libros = await libroService.obtenerLibros();
      this.filtrados = [...this.libros];
      this.actualizarEstadisticas();
      this.renderizarTabla();
    } catch (error) {
      this.mostrarError("Error al cargar los libros: " + error.message);
    } finally {
      this.mostrarLoading(false);
    }
  }

  filtrarLibros(terminoBusqueda = "", filtroEstado = "", filtroCategoria = "") {
    let filtrados = this.libros;

    if (terminoBusqueda) {
      const termino = terminoBusqueda.toLowerCase();
      filtrados = filtrados.filter(
        (libro) =>
          libro.titulo.toLowerCase().includes(termino) ||
          libro.autor.toLowerCase().includes(termino) ||
          (libro.isbn && libro.isbn.toLowerCase().includes(termino))
      );
    }

    if (filtroEstado)
      filtrados = filtrados.filter((libro) => libro.estado === filtroEstado);
    if (filtroCategoria)
      filtrados = filtrados.filter(
        (libro) => libro.categoria === filtroCategoria
      );

    this.filtrados = filtrados;
    this.renderizarTabla();
  }

  renderizarTabla() {
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
      // Validar campos requeridos
      if (!formData.titulo || formData.titulo.trim() === "") {
        this.mostrarError("El título es obligatorio");
        return;
      }

      if (!formData.autor || formData.autor.trim() === "") {
        this.mostrarError("El autor es obligatorio");
        return;
      }

      // Preparar datos para enviar
      const libroData = {
        titulo: formData.titulo,
        autor: formData.autor,
        isbn: formData.isbn || null,
        categoria: formData.categoria || null,
        fecha_publicacion: formData.fecha_publicacion || null,
        descripcion: formData.descripcion || null,
        portada_url: formData.portada_url || null,
        estado: "disponible",
      };

      await this.formManager.submitForm(async () => {
        await libroService.crearLibro(libroData);
        this.mostrarExito("Libro registrado exitosamente");
        await this.cargarLibros();
      }, formData);
    } catch (error) {
      console.error("Error completo:", error);
      this.mostrarError("Error al registrar el libro: " + error.message);
    }
  }

  async editarLibro(libroId) {
    try {
      // Obtener los datos actuales del libro
      const libro = await libroService.obtenerLibroPorId(libroId);

      // Formatear la fecha para el input type="date"
      let fechaPublicacion = "";
      if (libro.fecha_publicacion) {
        const fecha = new Date(libro.fecha_publicacion);
        fechaPublicacion = fecha.toISOString().split("T")[0];
      }

      // Llenar el formulario de edicion
      this.editFormManager.fillForm({
        titulo: libro.titulo,
        autor: libro.autor,
        isbn: libro.isbn || "",
        categoria: libro.categoria || "",
        fecha_publicacion: fechaPublicacion,
        descripcion: libro.descripcion || "",
        portada_url: libro.portada_url || "",
        libroId: libro.id, // Esto se enviará en el formData
      });

      // Mostrar el modal de edición
      const editModal = new bootstrap.Modal(
        document.getElementById("editarLibroModal")
      );
      editModal.show();
    } catch (error) {
      console.error("Error al cargar libro:", error);
      this.mostrarError(
        "Error al cargar los datos del libro para edición: " + error.message
      );
    }
  }

  async guardarEdicionLibro(formData) {
    try {
      // Validar campos requeridos
      if (!formData.titulo || formData.titulo.trim() === "") {
        this.mostrarError("El título es obligatorio");
        return;
      }

      if (!formData.autor || formData.autor.trim() === "") {
        this.mostrarError("El autor es obligatorio");
        return;
      }

      const libroId = formData.libroId;

      if (!libroId) {
        this.mostrarError("ID de libro no encontrado para la edición.");
        return;
      }

      // Preparar datos para actualizar
      const libroData = {
        titulo: formData.titulo,
        autor: formData.autor,
        isbn: formData.isbn || null,
        categoria: formData.categoria || null,
        fecha_publicacion: formData.fecha_publicacion || null,
        descripcion: formData.descripcion || null,
        portada_url: formData.portada_url || null,
      };

      await this.editFormManager.submitForm(async () => {
        await libroService.actualizarLibro(libroId, libroData);
        this.mostrarExito("Libro actualizado exitosamente");
        await this.cargarLibros();
      }, formData);
    } catch (error) {
      console.error("Error completo:", error);
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
      await libroService.eliminarLibro(libroId);
      this.mostrarExito("Libro eliminado exitosamente");
      await this.cargarLibros();
    } catch (error) {
      console.error("Error al eliminar:", error);
      this.mostrarError("Error al eliminar el libro: " + error.message);
    }
  }
}

// Inicializar
let librosManager;
document.addEventListener("DOMContentLoaded", () => {
  librosManager = new LibrosManager();
});
