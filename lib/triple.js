let Value = require("./value");

module.exports = class Triple{
  constructor(subj, pred, obj){
    this.subj=subj;
    this.pred=pred;
    this.obj=obj;
  }
  getSubject(){
    return this.subj;
  }
  getPredicate(){
    return this.pred;
  }
  getObject(){
    return this.obj;
  }
  toTriplePattern(){
    let s = (this.getSubject() instanceof Value) ? this.getSubject().toTriplePattern() : this.getSubject();
    let p = (this.getPredicate() instanceof Value) ? this.getPredicate().toTriplePattern() : this.getPredicate();
    let o = (this.getObject() instanceof Value) ? this.getObject().toTriplePattern() : this.getObject();

    return `${s} ${p} ${o} .`;
  }
}
