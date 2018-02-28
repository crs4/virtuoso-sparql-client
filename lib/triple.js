let Value = require("./value");
let Authoring = require("./authoring");

module.exports = class Triple{
  constructor(subj, pred, obj, authoring = {}){
    this.subj=subj;
    this.pred=pred;
    this.obj=obj;
    this.authoring=authoring;
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
  getAuthoring(){
    return this.authoring;
  }
  toTriplePattern(){
    let s = (this.getSubject() instanceof Value) ? this.getSubject().toTriplePattern() : this.getSubject();
    let p = (this.getPredicate() instanceof Value) ? this.getPredicate().toTriplePattern() : this.getPredicate();
    let o = (this.getObject() instanceof Value) ? this.getObject().toTriplePattern() : this.getObject();

    return `${s} ${p} ${o} .`;
  }
  hasAuthoring(){
    return (this.getAuthoring() instanceof Authoring);
  }
  getAnnotationPattern(){
    if(!this.hasAuthoring()){
      return '';
    }

    let s = (this.getSubject() instanceof Value) ? this.getSubject().toTriplePattern() : this.getSubject();
    let p = (this.getPredicate() instanceof Value) ? this.getPredicate().toTriplePattern() : this.getPredicate();
    let o = (this.getObject() instanceof Value) ? this.getObject().toTriplePattern() : this.getObject();

    return this.getAuthoring().toTriplePattern(s, p, o);
  }
};
