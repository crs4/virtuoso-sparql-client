let Value = require("./Value");

module.exports = class Node extends Value {
  constructor(iri){
    super();
    this.iri = iri;
  }
  toTriplePattern(){
    return `<${this.iri}>`;
  }
}
