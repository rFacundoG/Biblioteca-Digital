export class MultasService {
  constructor() {
    this.tasaMultaDiaria = 10; // $10 por día de retraso
    this.multaPorDano = 50; // $50 por daño al libro
    this.diasGracia = 0; // 0 días de gracia
  }

  // Calcular días de retraso
  calcularDiasRetraso(fechaDevolucionEsperada) {
    const hoy = new Date();
    const fechaDev = new Date(fechaDevolucionEsperada);
    const diffTime = hoy - fechaDev;
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  // Calcular monto de multa por retraso
  calcularMultaRetraso(fechaDevolucionEsperada) {
    const diasRetraso = this.calcularDiasRetraso(fechaDevolucionEsperada);
    return diasRetraso * this.tasaMultaDiaria;
  }

  // Calcular multa total (retraso + daño)
  calcularMultaTotal(fechaDevolucionEsperada, tieneDano = false) {
    const multaRetraso = this.calcularMultaRetraso(fechaDevolucionEsperada);
    const multaDano = tieneDano ? this.multaPorDano : 0;
    return multaRetraso + multaDano;
  }

  // Verificar si tiene multa
  tieneMulta(fechaDevolucionEsperada) {
    return this.calcularDiasRetraso(fechaDevolucionEsperada) > 0;
  }

  // Obtener información completa de multa
  obtenerInfoMulta(fechaDevolucionEsperada, tieneDano = false) {
    const diasRetraso = this.calcularDiasRetraso(fechaDevolucionEsperada);
    const multaRetraso = this.calcularMultaRetraso(fechaDevolucionEsperada);
    const multaTotal = this.calcularMultaTotal(
      fechaDevolucionEsperada,
      tieneDano
    );

    return {
      tieneMulta: diasRetraso > 0 || tieneDano,
      diasRetraso: diasRetraso,
      tieneDano: tieneDano,
      multaRetraso: multaRetraso,
      multaDano: tieneDano ? this.multaPorDano : 0,
      multaTotal: multaTotal,
      tasaDiaria: this.tasaMultaDiaria,
    };
  }

  // Formatear información de multa para mostrar
  formatearInfoMulta(fechaDevolucionEsperada, tieneDano = false) {
    const info = this.obtenerInfoMulta(fechaDevolucionEsperada, tieneDano);

    if (!info.tieneMulta) {
      return {
        texto: "Sin multa",
        clase: "success",
        monto: 0,
        desglose: [],
      };
    }

    const desglose = [];
    if (info.diasRetraso > 0) {
      desglose.push(
        `Retraso: ${info.diasRetraso} día(s) - $${info.multaRetraso}`
      );
    }
    if (info.tieneDano) {
      desglose.push(`Daño: $${info.multaDano}`);
    }

    return {
      texto: `Multa total: $${info.multaTotal}`,
      clase: info.multaTotal > 0 ? "warning" : "success",
      monto: info.multaTotal,
      desglose: desglose,
    };
  }
}

export const multasService = new MultasService();
