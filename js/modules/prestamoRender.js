export class PrestamoRender {
  constructor(tableManager) {
    this.tableManager = tableManager;
  }

  renderFila(prestamo) {
    const diasRestantes = PrestamoUtils.calcularDiasRestantes(
      prestamo.fecha_devolucion
    );
    const diasClass = PrestamoUtils.getClaseDiasRestantes(diasRestantes);

    return `
      <tr data-prestamo-id="${prestamo.id}">
        <td><strong>${prestamo.socios?.nombre || "N/A"}</strong><br>
          <small class="text-muted">${
            prestamo.socios?.numero_socio || ""
          }</small>
        </td>
        <td><strong>${prestamo.libros?.titulo || "N/A"}</strong><br>
          <small class="text-muted">${prestamo.libros?.autor || ""}</small>
        </td>
        <td>${new Date(prestamo.fecha_inicio).toLocaleDateString("es-ES")}</td>
        <td>${new Date(prestamo.fecha_devolucion).toLocaleDateString(
          "es-ES"
        )}</td>
        <td><span class="dias-restantes ${diasClass}">
            ${diasRestantes > 0 ? `${diasRestantes} días` : "Vencido"}
          </span>
        </td>
      </tr>
    `;
  }

  renderFilaDevolucion(prestamo, prestamoSeleccionado) {
    const estado = PrestamoUtils.getEstadoPrestamo(prestamo);

    return `
      <tr onclick="window.prestamosManager.seleccionarParaDevolucion(${
        prestamo.id
      })" 
          class="${
            prestamoSeleccionado?.id === prestamo.id
              ? "prestamo-seleccionado"
              : ""
          }">
        <td><input class="form-check-input" type="radio" name="prestamoDevolucion" 
               ${prestamoSeleccionado?.id === prestamo.id ? "checked" : ""}
               onclick="window.prestamosManager.seleccionarParaDevolucion(${
                 prestamo.id
               })">
        </td>
        <td><strong>${prestamo.socios?.nombre || "N/A"}</strong><br>
          <small class="text-muted">${
            prestamo.socios?.numero_socio || ""
          }</small>
        </td>
        <td><strong>${prestamo.libros?.titulo || "N/A"}</strong><br>
          <small class="text-muted">${prestamo.libros?.autor || ""}</small>
        </td>
        <td>${new Date(prestamo.fecha_inicio).toLocaleDateString("es-ES")}</td>
        <td>${new Date(prestamo.fecha_devolucion).toLocaleDateString(
          "es-ES"
        )}</td>
        <td><span class="badge ${PrestamoUtils.getBadgeClassEstado(
          estado
        )}">${estado}</span></td>
      </tr>
    `;
  }
}
