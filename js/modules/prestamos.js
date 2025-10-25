import { servicioSingleton } from "../services/servicios-module.js";
import { BaseManager } from "../components/BaseManager.js";
import { TableManager } from "../components/TableManager.js";
import { FormManager } from "../components/FormManager.js";
import { multasService } from "./multas.js";

class PrestamosManager extends BaseManager {
  constructor() {
    super();
    this.prestamosActivos = [];
    this.socios = [];
    this.librosDisponibles = [];
    this.prestamoSeleccionado = null;
    this.instance = null;

    this.tableManager = new TableManager(
      "prestamosActivosBody",
      "emptyActivos"
    );
    this.formManager = new FormManager(
      "nuevoPrestamoForm",
      "nuevoPrestamoModal"
    );
  }

  async init() {
    await super.init();

    // Guardar instancia globalmente
    window.prestamosManager = this;

    this.setupEventListeners();
    await this.loadData();
  }

  async loadData() {
    await Promise.all([
      this.cargarPrestamosActivos(),
      this.cargarSocios(),
      this.cargarLibrosDisponibles(),
    ]);
  }

  setupEventListeners() {
    super.setupEventListeners();
    this.formManager.setupForm((data) => this.registrarNuevoPrestamo(data));

    // Cambios en selects del modal
    document
      .getElementById("selectSocio")
      .addEventListener("change", () => this.actualizarResumen());
    document
      .getElementById("selectLibro")
      .addEventListener("change", () => this.actualizarResumen());

    // Configurar fechas automáticamente
    this.configurarFechas();

    // Devolución
    document
      .getElementById("confirmarDevolucionBtn")
      .addEventListener("click", () => {
        this.confirmarDevolucion();
      });

    // Actualizar multa cuando cambie el estado del libro
    document.querySelectorAll('input[name="estadoLibro"]').forEach((radio) => {
      radio.addEventListener("change", () => this.actualizarInfoMulta());
    });
  }

  setupTableEventListeners() {
    const tbody = document.getElementById("prestamosActivosBody");
    if (tbody) {
      tbody.addEventListener("click", (e) => {
        const button = e.target.closest("button");
        if (!button) return;

        const row = button.closest("tr");
        const prestamoId = row?.dataset.prestamoId;
        if (!prestamoId) return;

        if (button.classList.contains("btn-devolver")) {
          this.seleccionarParaDevolucion(parseInt(prestamoId));
        }
      });
    }
  }

  configurarFechas() {
    const fechaPrestamo = document.getElementById("fechaPrestamo");
    const fechaDevolucion = document.getElementById("fechaDevolucion");

    // Fecha de préstamo por defecto: hoy
    const hoy = new Date().toISOString().split("T")[0];
    fechaPrestamo.value = hoy;

    // Fecha de devolución por defecto: 15 días desde hoy
    const fechaDefault = new Date();
    fechaDefault.setDate(fechaDefault.getDate() + 15);
    fechaDevolucion.value = fechaDefault.toISOString().split("T")[0];

    // Validar que la fecha de devolución sea posterior a la de préstamo
    fechaPrestamo.addEventListener("change", () => this.validarFechas());
    fechaDevolucion.addEventListener("change", () => this.validarFechas());

    this.actualizarResumen();
  }

  validarFechas() {
    const fechaPrestamo = document.getElementById("fechaPrestamo").value;
    const fechaDevolucion = document.getElementById("fechaDevolucion").value;

    if (fechaPrestamo && fechaDevolucion) {
      const fechaP = new Date(fechaPrestamo);
      const fechaD = new Date(fechaDevolucion);

      if (fechaD <= fechaP) {
        this.mostrarError(
          "La fecha de devolución debe ser posterior a la fecha de préstamo"
        );
        document.getElementById("fechaDevolucion").value = "";
        return false;
      }
    }
    return true;
  }

  async cargarPrestamosActivos() {
    this.mostrarLoading(true);
    try {
      this.prestamosActivos = await servicioSingleton.obtenerPrestamosActivos();
      this.actualizarBadges();
      this.renderizarPrestamosActivos();
      this.renderizarPrestamosParaDevolucion();
    } catch (error) {
      this.mostrarError(
        "Error al cargar los préstamos activos: " + error.message
      );
    } finally {
      this.mostrarLoading(false);
    }
  }

  async cargarSocios() {
    try {
      this.socios = await servicioSingleton.obtenerSocios();
      this.actualizarSelectSocios();
    } catch (error) {
      console.error("Error cargando socios:", error);
    }
  }

  async cargarLibrosDisponibles() {
    try {
      this.librosDisponibles =
        await servicioSingleton.obtenerLibrosDisponibles();
      this.actualizarSelectLibros();
    } catch (error) {
      console.error("Error cargando libros disponibles:", error);
    }
  }

  actualizarSelectSocios() {
    const select = document.getElementById("selectSocio");
    select.innerHTML = '<option value="">Seleccionar socio...</option>';

    this.socios
      .filter((socio) => socio.activo)
      .forEach((socio) => {
        const option = document.createElement("option");
        option.value = socio.id;
        option.textContent = `${socio.nombre} (${socio.numero_socio})`;
        select.appendChild(option);
      });
  }

  actualizarSelectLibros() {
    const select = document.getElementById("selectLibro");
    select.innerHTML = '<option value="">Seleccionar libro...</option>';

    this.librosDisponibles.forEach((libro) => {
      const option = document.createElement("option");
      option.value = libro.id;
      option.textContent = `${libro.titulo} - ${libro.autor}`;
      select.appendChild(option);
    });
  }

  actualizarResumen() {
    const socioId = document.getElementById("selectSocio").value;
    const libroId = document.getElementById("selectLibro").value;
    const fechaPrestamo = document.getElementById("fechaPrestamo").value;
    const fechaDevolucion = document.getElementById("fechaDevolucion").value;

    const resumenSocio = document.getElementById("resumenSocio");
    const resumenLibro = document.getElementById("resumenLibro");
    const resumenFechas = document.getElementById("resumenFechas");
    const resumenDias = document.getElementById("resumenDias");

    if (socioId && libroId && fechaPrestamo && fechaDevolucion) {
      const socio = this.socios.find((s) => s.id == socioId);
      const libro = this.librosDisponibles.find((l) => l.id == libroId);

      const fechaP = new Date(fechaPrestamo);
      const fechaD = new Date(fechaDevolucion);
      const diffTime = fechaD - fechaP;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      resumenSocio.textContent = `Socio: ${socio.nombre}`;
      resumenLibro.textContent = `Libro: ${libro.titulo}`;
      resumenFechas.textContent = `Préstamo: ${fechaP.toLocaleDateString(
        "es-ES"
      )} | Devolución: ${fechaD.toLocaleDateString("es-ES")}`;
      resumenDias.textContent = `Duración: ${diffDays} día${
        diffDays !== 1 ? "s" : ""
      }`;
      resumenDias.className =
        diffDays >= 7 ? "mb-0 text-success" : "mb-0 text-warning";
    } else {
      resumenSocio.textContent = "Selecciona un socio y un libro";
      resumenLibro.textContent = "";
      resumenFechas.textContent = "";
      resumenDias.textContent = "";
    }
  }

  renderizarPrestamosActivos() {
    this.tableManager.renderTable(this.prestamosActivos, (prestamo) =>
      this.renderFila(prestamo)
    );
  }

  renderFila(prestamo) {
    const diasRestantes = this.calcularDiasRestantes(prestamo.fecha_devolucion);
    const diasClass = this.getClaseDiasRestantes(diasRestantes);

    return `
      <tr data-prestamo-id="${prestamo.id}">
        <td>
          <strong>${prestamo.socios?.nombre || "N/A"}</strong><br>
          <small class="text-muted">${
            prestamo.socios?.numero_socio || ""
          }</small>
        </td>
        <td>
          <strong>${prestamo.libros?.titulo || "N/A"}</strong><br>
          <small class="text-muted">${prestamo.libros?.autor || ""}</small>
        </td>
        <td>${new Date(prestamo.fecha_inicio).toLocaleDateString("es-ES")}</td>
        <td>${new Date(prestamo.fecha_devolucion).toLocaleDateString(
          "es-ES"
        )}</td>
        <td>
          <span class="dias-restantes ${diasClass}">
            ${diasRestantes > 0 ? `${diasRestantes} días` : "Vencido"}
          </span>
        </td>
        <!-- Quitamos la columna de acciones -->
      </tr>
    `;
  }

  renderizarPrestamosParaDevolucion() {
    const tbody = document.getElementById("prestamosParaDevolucionBody");

    tbody.innerHTML = this.prestamosActivos
      .map((prestamo) => {
        const infoMulta = multasService.obtenerInfoMulta(
          prestamo.fecha_devolucion
        );
        const estado = this.getEstadoPrestamo(infoMulta.diasRetraso);

        return `
          <tr onclick="window.prestamosManager.seleccionarParaDevolucion(${
            prestamo.id
          })" 
              class="${
                this.prestamoSeleccionado?.id === prestamo.id
                  ? "prestamo-seleccionado"
                  : ""
              }">
            <td>
              <input class="form-check-input" type="radio" name="prestamoDevolucion" 
                     ${
                       this.prestamoSeleccionado?.id === prestamo.id
                         ? "checked"
                         : ""
                     }
                     onclick="window.prestamosManager.seleccionarParaDevolucion(${
                       prestamo.id
                     })">
            </td>
            <td>
              <strong>${prestamo.socios?.nombre || "N/A"}</strong><br>
              <small class="text-muted">${
                prestamo.socios?.numero_socio || ""
              }</small>
            </td>
            <td>
              <strong>${prestamo.libros?.titulo || "N/A"}</strong><br>
              <small class="text-muted">${prestamo.libros?.autor || ""}</small>
            </td>
            <td>${new Date(prestamo.fecha_inicio).toLocaleDateString(
              "es-ES"
            )}</td>
            <td>${new Date(prestamo.fecha_devolucion).toLocaleDateString(
              "es-ES"
            )}</td>
            <td>
              <span class="badge ${this.getBadgeClassEstado(estado)}">
                ${estado}
              </span>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  seleccionarParaDevolucion(prestamoId) {
    this.prestamoSeleccionado = this.prestamosActivos.find(
      (p) => p.id === prestamoId
    );
    this.mostrarDetallesDevolucion();
    this.renderizarPrestamosParaDevolucion();
  }

  mostrarDetallesDevolucion() {
    const details = document.getElementById("devolucionDetails");
    const empty = document.getElementById("devolucionEmpty");

    if (this.prestamoSeleccionado) {
      details.classList.remove("d-none");
      empty.classList.add("d-none");

      const prestamo = this.prestamoSeleccionado;

      // Resetear selección de estado
      document
        .querySelectorAll('input[name="estadoLibro"]')
        .forEach((radio) => {
          radio.checked = false;
        });

      document.getElementById("devolucionLibroTitulo").textContent =
        prestamo.libros?.titulo || "N/A";
      document.getElementById("devolucionSocioNombre").textContent =
        prestamo.socios?.nombre || "N/A";
      document.getElementById("devolucionFechaPrestamo").textContent = new Date(
        prestamo.fecha_inicio
      ).toLocaleDateString("es-ES");
      document.getElementById("devolucionFechaEsperada").textContent = new Date(
        prestamo.fecha_devolucion
      ).toLocaleDateString("es-ES");

      this.actualizarInfoMulta();
    } else {
      details.classList.add("d-none");
      empty.classList.remove("d-none");
    }
  }

  actualizarInfoMulta() {
    if (!this.prestamoSeleccionado) return;

    const prestamo = this.prestamoSeleccionado;
    const tieneDano = document.getElementById("estadoDano")?.checked || false;

    const infoMulta = multasService.formatearInfoMulta(
      prestamo.fecha_devolucion,
      tieneDano
    );

    const multaInfo = document.getElementById("multaInfo");
    const multaMonto = document.getElementById("multaMonto");

    if (infoMulta.monto > 0) {
      multaInfo.classList.remove("d-none");

      // Mostrar desglose de multa
      let contenidoMulta = `<strong>Multa total:</strong> $${infoMulta.monto}`;
      if (infoMulta.desglose.length > 0) {
        contenidoMulta += `<br><small>${infoMulta.desglose.join(
          "<br>"
        )}</small>`;
      }

      multaMonto.innerHTML = contenidoMulta;
    } else {
      multaInfo.classList.add("d-none");
    }
  }

  async registrarNuevoPrestamo(formData) {
    try {
      if (
        !this.validarCamposRequeridos(formData, [
          "selectSocio",
          "selectLibro",
          "fechaDevolucion",
        ])
      )
        return;

      // Validar fechas
      if (!this.validarFechas()) return;

      const libroId = parseInt(formData.selectLibro);
      const socioId = parseInt(formData.selectSocio);

      // Validar que el libro sigue disponible
      const libro = await servicioSingleton.obtenerLibroPorId(libroId);
      if (libro.estado !== "disponible") {
        this.mostrarError("El libro ya no está disponible para préstamo");
        return;
      }

      const prestamoData = {
        libro_id: libroId,
        socio_id: socioId,
        fecha_inicio:
          formData.fechaPrestamo || new Date().toISOString().split("T")[0],
        fecha_devolucion: formData.fechaDevolucion,
        estado: "activo",
      };

      await this.formManager.submitForm(async () => {
        const submitBtn = document.querySelector(
          '#nuevoPrestamoForm button[type="submit"]'
        );
        submitBtn.disabled = true;

        try {
          await servicioSingleton.registrarPrestamo(prestamoData);
          await servicioSingleton.actualizarLibro(libroId, {
            estado: "prestado",
          });

          this.mostrarExito("Préstamo registrado exitosamente");
          await this.loadData();
        } finally {
          submitBtn.disabled = false;
        }
      }, formData);
    } catch (error) {
      this.mostrarError("Error al registrar el préstamo: " + error.message);
    }
  }

  async confirmarDevolucion() {
    if (!this.prestamoSeleccionado) {
      this.mostrarError("Selecciona un préstamo para devolver");
      return;
    }

    // Validar estado del libro
    const estadoLibro = document.querySelector(
      'input[name="estadoLibro"]:checked'
    );
    if (!estadoLibro) {
      this.mostrarError("Debes seleccionar el estado del libro");
      return;
    }

    try {
      const tieneDano = estadoLibro.value === "dano";
      const infoMulta = multasService.obtenerInfoMulta(
        this.prestamoSeleccionado.fecha_devolucion,
        tieneDano
      );

      await servicioSingleton.registrarDevolucion(
        this.prestamoSeleccionado.id,
        tieneDano,
        infoMulta.multaTotal
      );

      await servicioSingleton.actualizarLibro(
        this.prestamoSeleccionado.libro_id,
        {
          estado: "disponible",
          ...(tieneDano && { necesita_revision: true }),
        }
      );

      let mensajeExito = `Devolución registrada exitosamente`;
      if (infoMulta.multaTotal > 0) {
        mensajeExito += `. Multa aplicada: $${infoMulta.multaTotal}`;
        if (infoMulta.multaRetraso > 0) {
          mensajeExito += ` (Retraso: $${infoMulta.multaRetraso}`;
          if (infoMulta.multaDano > 0) {
            mensajeExito += ` + Daño: $${infoMulta.multaDano}`;
          }
          mensajeExito += `)`;
        }
      }

      this.mostrarExito(mensajeExito);

      this.prestamoSeleccionado = null;
      await this.loadData();
      this.mostrarDetallesDevolucion();
    } catch (error) {
      this.mostrarError("Error al registrar la devolución: " + error.message);
    }
  }

  // Métodos utilitarios
  calcularDiasRestantes(fechaDevolucion) {
    const hoy = new Date();
    const fechaDev = new Date(fechaDevolucion);
    const diffTime = fechaDev - hoy;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getClaseDiasRestantes(dias) {
    if (dias < 0) return "dias-negativo";
    if (dias <= 3) return "dias-neutral";
    return "dias-positivo";
  }

  getEstadoPrestamo(diasRetraso) {
    if (diasRetraso > 0) return "Vencido";
    const diasRestantes = this.calcularDiasRestantes(
      this.prestamoSeleccionado?.fecha_devolucion
    );
    if (diasRestantes <= 3) return "Por vencer";
    return "En plazo";
  }

  getBadgeClassEstado(estado) {
    const clases = {
      "En plazo": "badge-activo",
      "Por vencer": "badge-proximo-vencer",
      Vencido: "badge-vencido",
    };
    return clases[estado] || "badge-secondary";
  }

  actualizarBadges() {
    document.getElementById("badgeActivos").textContent =
      this.prestamosActivos.length;
  }

  validarCamposRequeridos(formData, campos) {
    for (const campo of campos) {
      if (!formData[campo]?.trim()) {
        this.mostrarError(`El campo ${campo} es obligatorio`);
        return false;
      }
    }
    return true;
  }
}

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  new PrestamosManager().init();
});