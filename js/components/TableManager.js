export class TableManager {
  constructor(tableId, emptyStateId) {
    this.tableId = tableId;
    this.emptyStateId = emptyStateId;
  }

  renderTable(data, renderRowCallback) {
    const tbody = document.getElementById(this.tableId);
    const table = document.getElementById(this.tableId)?.closest("table");
    const empty = document.getElementById(this.emptyStateId);

    if (!tbody || !empty) return;

    if (data.length === 0) {
      table?.classList.add("d-none");
      empty.classList.remove("d-none");
      return;
    }

    table?.classList.remove("d-none");
    empty.classList.add("d-none");

    tbody.innerHTML = data.map(renderRowCallback).join("");
  }

  createActionButton(icon, title, onClick, className = "", disabled = false) {
    const safeOnClick = onClick.replace(/'/g, "\\'");
    return `
      <button class="btn btn-sm ${className}" 
              title="${title}" 
              ${disabled ? "disabled" : ""}
              onclick="${safeOnClick}">
        <i class="fas fa-${icon}"></i>
      </button>
    `;
  }

  createBadge(text, type = "secondary") {
    // Clases corregidas para mejor contraste
    const classes = {
      // Estados de libros
      disponible: "bg-success text-white",
      prestado: "bg-warning text-dark",
      mantenimiento: "bg-secondary text-white",

      // Estados generales
      success: "bg-success text-white",
      danger: "bg-danger text-white",
      warning: "bg-warning text-dark",
      secondary: "bg-secondary text-white",

      // Estados de socios
      active: "bg-success text-white",
      inactive: "bg-secondary text-white",
    };

    return `<span class="badge ${
      classes[type] || "bg-secondary text-white"
    }">${text}</span>`;
  }

  // Método específico para estados de socios
  createSocioBadge(activo) {
    return activo
      ? '<span class="badge bg-success text-white">Activo</span>'
      : '<span class="badge bg-secondary text-white">Inactivo</span>';
  }

  // Método específico para estados de libros
  createLibroBadge(estado) {
    const clases = {
      disponible: "bg-success text-white",
      prestado: "bg-warning text-dark",
      mantenimiento: "bg-secondary text-white",
    };

    const textos = {
      disponible: "Disponible",
      prestado: "Prestado",
      mantenimiento: "En Mantenimiento",
    };

    const clase = clases[estado] || "bg-secondary text-white";
    const texto = textos[estado] || estado;

    return `<span class="badge ${clase}">${texto}</span>`;
  }

  crearOpcionesSelect(opciones, valorSeleccionado = "") {
    return opciones
      .map(
        (opcion) =>
          `<option value="${opcion.value}" ${
            opcion.value === valorSeleccionado ? "selected" : ""
          }>
        ${opcion.text}
      </option>`
      )
      .join("");
  }
}
