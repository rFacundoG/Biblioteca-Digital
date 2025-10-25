import { multasService } from "./multas.js";

export class PrestamoUtils {
  static calcularDiasRestantes(fechaDevolucion) {
    const hoy = new Date();
    const fechaDev = new Date(fechaDevolucion);
    const diffTime = fechaDev - hoy;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  static getClaseDiasRestantes(dias) {
    if (dias < 0) return "dias-negativo";
    if (dias <= 3) return "dias-neutral";
    return "dias-positivo";
  }

  static getEstadoPrestamo(prestamo) {
    const diasRetraso = multasService.calcularDiasRetraso(
      prestamo.fecha_devolucion
    );
    if (diasRetraso > 0) return "Vencido";

    const diasRestantes = this.calcularDiasRestantes(prestamo.fecha_devolucion);
    if (diasRestantes <= 3) return "Por vencer";
    return "En plazo";
  }

  static getBadgeClassEstado(estado) {
    const clases = {
      "En plazo": "badge-activo",
      "Por vencer": "badge-proximo-vencer",
      Vencido: "badge-vencido",
    };
    return clases[estado] || "badge-secondary";
  }
}
