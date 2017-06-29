let Value = require("./value");

module.exports = class Text extends Value {
  constructor(value, lang=null){
    super();
    this.value = value;
    this.lang = lang;
  }
  toTriplePattern(){
    let s = `"${this.value}"`;
    if(this.lang !== null)
      s += `@${this.lang}`;
    return s;
  }
}
