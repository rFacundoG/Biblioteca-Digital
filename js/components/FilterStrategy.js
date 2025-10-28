// Estrategias de filtrado para diferentes tipos de datos
export class FilterStrategy {
  // Estrategia para busqueda de texto en multiples campos
  static TEXT = class {
    constructor(fields) {
      this.fields = fields; // Campos donde buscar
    }

    filter(data, term) {
      if (!term) return data; // Si no hay termino, devuelve todos
      const searchTerm = term.toLowerCase();
      return data.filter((item) =>
        this.fields.some(
          (field) =>
            item[field] &&
            item[field].toString().toLowerCase().includes(searchTerm)
        )
      );
    }
  };

  // Estrategia para filtrar por estado especifico
  static STATUS = class {
    constructor(statusField) {
      this.statusField = statusField; // Campo que contiene el estado
    }

    filter(data, status) {
      if (!status) return data; // Si no hay estado, devuelve todos
      return data.filter((item) => item[this.statusField] === status);
    }
  };

  // Estrategia para filtros booleanos (activo/inactivo)
  static BOOLEAN = class {
    constructor(field) {
      this.field = field; // Campo booleano a evaluar
    }

    filter(data, value) {
      if (!value) return data;
      return data.filter((item) =>
        value === "activo" ? item[this.field] : !item[this.field]
      );
    }
  };

  // Estrategia para combinar multiples filtros
  static COMPOSITE = class {
    constructor(strategies) {
      this.strategies = strategies; // Array de estrategias a aplicar
    }

    filter(data, ...filters) {
      let result = data;
      // Aplica cada estrategia en orden
      this.strategies.forEach((strategy, index) => {
        if (filters[index]) {
          result = strategy.filter(result, filters[index]);
        }
      });
      return result;
    }
  };
}

// Manejador principal de filtros
export class FilterManager {
  constructor(strategy) {
    this.strategy = strategy; // Estrategia de filtrado actual
  }

  // Cambia la estrategia de filtrado
  setStrategy(strategy) {
    this.strategy = strategy;
  }

  // Aplica el filtro a los datos
  applyFilter(data, ...filters) {
    return this.strategy.filter(data, ...filters);
  }
}