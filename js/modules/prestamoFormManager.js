export class PrestamoFormManager {
  constructor(formManager) {
    this.formManager = formManager;
  }

  configurarFechas() {
    const fechaPrestamo = document.getElementById("fechaPrestamo");
    const fechaDevolucion = document.getElementById("fechaDevolucion");

    const hoy = new Date().toISOString().split("T")[0];
    fechaPrestamo.value = hoy;

    const fechaDefault = new Date();
    fechaDefault.setDate(fechaDefault.getDate() + 15);
    fechaDevolucion.value = fechaDefault.toISOString().split("T")[0];

    fechaPrestamo.addEventListener("change", () => this.validarFechas());
    fechaDevolucion.addEventListener("change", () => this.validarFechas());
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

  mostrarError(mensaje) {
    // Usar la notificación global si está disponible
    if (window.prestamosManager) {
      window.prestamosManager.mostrarError(mensaje);
    } else {
      // Fallback: alerta simple
      alert(mensaje);
    }
  }

  actualizarResumen(socios, librosDisponibles) {
    const socioId = document.getElementById("selectSocio").value;
    const libroId = document.getElementById("selectLibro").value;
    const fechaPrestamo = document.getElementById("fechaPrestamo").value;
    const fechaDevolucion = document.getElementById("fechaDevolucion").value;

    const [resumenSocio, resumenLibro, resumenFechas, resumenDias] = [
      "resumenSocio",
      "resumenLibro",
      "resumenFechas",
      "resumenDias",
    ].map((id) => document.getElementById(id));

    if (socioId && libroId && fechaPrestamo && fechaDevolucion) {
      const socio = socios.find((s) => s.id == socioId);
      const libro = librosDisponibles.find((l) => l.id == libroId);
      const fechaP = new Date(fechaPrestamo);
      const fechaD = new Date(fechaDevolucion);
      const diffDays = Math.ceil((fechaD - fechaP) / (1000 * 60 * 60 * 24));

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
      [resumenSocio, resumenLibro, resumenFechas, resumenDias].forEach(
        (el) => (el.textContent = "")
      );
      resumenSocio.textContent = "Selecciona un socio y un libro";
    }
  }
}
