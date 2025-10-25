import { servicioSingleton } from "../services/servicios-module.js";
import { BaseManager } from "../components/BaseManager.js";
import { PrestamoUtils } from "./prestamoUtils.js";
import { PrestamoRender } from "./prestamoRender.js";
import { PrestamoFormManager } from "./PrestamoFormManager.js";
import { multasService } from "./multas.js";
import { TableManager } from "../components/TableManager.js";
import { FormManager } from "../components/FormManager.js";

class PrestamosManager extends BaseManager {
  constructor() {
    super();
    this.prestamosActivos = [];
    this.socios = [];
    this.librosDisponibles = [];
    this.prestamoSeleccionado = null;

    this.tableManager = new TableManager(
      "prestamosActivosBody",
      "emptyActivos"
    );
    this.formManager = new FormManager(
      "nuevoPrestamoForm",
      "nuevoPrestamoModal"
    );
    this.prestamoRender = new PrestamoRender(this.tableManager);
    this.prestamoFormManager = new PrestamoFormManager(this.formManager);
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

    document
      .getElementById("selectSocio")
      .addEventListener("change", () =>
        this.prestamoFormManager.actualizarResumen(
          this.socios,
          this.librosDisponibles
        )
      );
    document
      .getElementById("selectLibro")
      .addEventListener("change", () =>
        this.prestamoFormManager.actualizarResumen(
          this.socios,
          this.librosDisponibles
        )
      );

    this.prestamoFormManager.configurarFechas();

    document
      .getElementById("confirmarDevolucionBtn")
      .addEventListener("click", () => this.confirmarDevolucion());

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
    this.socios = await servicioSingleton.obtenerSocios();
    this.actualizarSelect(
      "selectSocio",
      this.socios.filter((s) => s.activo),
      (s) => `${s.nombre} (${s.numero_socio})`
    );
  }

  async cargarLibrosDisponibles() {
    this.librosDisponibles = await servicioSingleton.obtenerLibrosDisponibles();
    this.actualizarSelect(
      "selectLibro",
      this.librosDisponibles,
      (l) => `${l.titulo} - ${l.autor}`
    );
  }

  actualizarSelect(selectId, datos, formatearTexto) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Seleccionar...</option>';
    datos.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = formatearTexto(item);
      select.appendChild(option);
    });
  }

  renderizarPrestamosActivos() {
    this.tableManager.renderTable(this.prestamosActivos, (prestamo) =>
      this.prestamoRender.renderFila(prestamo)
    );
  }

  renderizarPrestamosParaDevolucion() {
    const tbody = document.getElementById("prestamosParaDevolucionBody");
    tbody.innerHTML = this.prestamosActivos
      .map((prestamo) =>
        this.prestamoRender.renderFilaDevolucion(
          prestamo,
          this.prestamoSeleccionado
        )
      )
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
