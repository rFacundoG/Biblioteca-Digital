// Servicio para calcular y gestionar multas por retrasos y danos
export class MultasService {
  constructor() {
    this.tasaMultaDiaria = 10; // $10 por cada dia de retraso
    this.multaPorDano = 50; // $50 por dano al libro
    this.diasGracia = 0; // No hay dias de gracia
  }

  // Calcula cuantos dias de retraso tiene un prestamo
  calcularDiasRetraso(fechaDevolucionEsperada) {
    const hoy = new Date();
    const fechaDev = new Date(fechaDevolucionEsperada);
    // Calcula la diferencia en milisegundos entre hoy y la fecha esperada
    const diffTime = hoy - fechaDev;
    // Convierte milisegundos a dias y asegura que no sea negativo
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  // Calcula el monto de multa solo por retraso
  calcularMultaRetraso(fechaDevolucionEsperada) {
    const diasRetraso = this.calcularDiasRetraso(fechaDevolucionEsperada);
    // Multiplica dias de retraso por la tasa diaria
    return diasRetraso * this.tasaMultaDiaria;
  }

  // Calcula la multa total (retraso + dano)
  calcularMultaTotal(fechaDevolucionEsperada, tieneDano = false) {
    const multaRetraso = this.calcularMultaRetraso(fechaDevolucionEsperada);
    // Agrega multa por dano si aplica
    const multaDano = tieneDano ? this.multaPorDano : 0;
    // Suma ambos conceptos
    return multaRetraso + multaDano;
  }

  // Verifica si un prestamo tiene multa
  tieneMulta(fechaDevolucionEsperada) {
    return this.calcularDiasRetraso(fechaDevolucionEsperada) > 0;
  }

  // Obtiene informacion detallada sobre la multa
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

  // Formatea la informacion de multa para mostrar al usuario
  formatearInfoMulta(fechaDevolucionEsperada, tieneDano = false) {
    const info = this.obtenerInfoMulta(fechaDevolucionEsperada, tieneDano);

    // Si no hay multa
    if (!info.tieneMulta) {
      return {
        texto: "Sin multa",
        clase: "success",
        monto: 0,
        desglose: [],
      };
    }

    // Construye el desglose de la multa
    const desglose = [];
    if (info.diasRetraso > 0) {
      desglose.push(
        `Retraso: ${info.diasRetraso} dia(s) - $${info.multaRetraso}`
      );
    }
    if (info.tieneDano) {
      desglose.push(`Dano: $${info.multaDano}`);
    }

    return {
      texto: `Multa total: $${info.multaTotal}`,
      clase: info.multaTotal > 0 ? "warning" : "success",
      monto: info.multaTotal,
      desglose: desglose,
    };
  }
}

// Exporta una instancia unica del servicio
export const multasService = new MultasService();
