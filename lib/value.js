module.exports = class Value {
  constructor() {
    if (new.target === Value) {
      throw new TypeError("Cannot construct Abstract instances directly");
    }
    if (this.toTriplePattern === undefined) {
      // or maybe test typeof this.method === "function"
      throw new TypeError("Must override method");
    }
  }
}
