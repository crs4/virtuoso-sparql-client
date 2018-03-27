let Value = require("./value");
let {UPDATE_TYPES} = require("./util");

module.exports = class Triple{
  constructor(subj, pred, obj, operation = Triple.ADD){
    this.subj=subj;
    this.pred=pred;
    this.obj=obj;
    this.operation=operation;
    this.previous=null;
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
  getOperation(){
    return this.operation;
  }
  setOperation(operation){
    this.operation = operation;
  }
  getPrevious(){
    return this.previous;
  }
  setPrevious(previous){
    this.previous = previous;
  }
  update(subj=null, pred=null, obj=null) {
    let previous = Object.assign(new Triple(), this);
    previous.setOperation(null);
    if(subj) this.subj = subj;
    if(pred) this.pred = pred;
    if(obj) this.obj = obj;
    this.setOperation(Triple.UPDATE);
    this.setPrevious(previous);
  }
  updateObject(obj) {
    this.update(null, null, obj);
  }
  getParts() {
    const s = (this.getSubject() instanceof Value) ? this.getSubject().toTriplePattern() : this.getSubject();
    const p = (this.getPredicate() instanceof Value) ? this.getPredicate().toTriplePattern() : this.getPredicate();
    const o = (this.getObject() instanceof Value) ? this.getObject().toTriplePattern() : this.getObject();
    return { s, p, o };
  }
  toTriplePattern(){
    const {s, p, o} = this.getParts(); 
    return `${s} ${p} ${o} .`;
  }

  get byteLength (){
    return Buffer.byteLength(this.toTriplePattern(), 'utf8')
  }

  static get ADD(){
    return UPDATE_TYPES.add;
  }
  static get REMOVE(){
    return UPDATE_TYPES.remove;
  }
  static get UPDATE(){
    return UPDATE_TYPES.update;
  }
};
