let Value = require("./value");

module.exports = class Data extends Value {
  constructor(value, type=null){
    super();
    this.value = value;
    this.type = type;
  }
  toTriplePattern(){
    let s = `"${this.value}"`;
    if(this.type !== null)
      s += `^^${this.type}`;
    return s;
  }
}
