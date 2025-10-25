export class FilterStrategy {
  static TEXT = class {
    constructor(fields) {
      this.fields = fields;
    }

    filter(data, term) {
      if (!term) return data;
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

  static STATUS = class {
    constructor(statusField) {
      this.statusField = statusField;
    }

    filter(data, status) {
      if (!status) return data;
      return data.filter((item) => item[this.statusField] === status);
    }
  };

  static BOOLEAN = class {
    constructor(field) {
      this.field = field;
    }

    filter(data, value) {
      if (!value) return data;
      return data.filter((item) =>
        value === "activo" ? item[this.field] : !item[this.field]
      );
    }
  };

  static COMPOSITE = class {
    constructor(strategies) {
      this.strategies = strategies;
    }

    filter(data, ...filters) {
      let result = data;
      this.strategies.forEach((strategy, index) => {
        if (filters[index]) {
          result = strategy.filter(result, filters[index]);
        }
      });
      return result;
    }
  };
}

export class FilterManager {
  constructor(strategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  applyFilter(data, ...filters) {
    return this.strategy.filter(data, ...filters);
  }
}
