let Value = require("./value");
let Data = require("./data");
let {UPDATE_TYPES} = require("./util");

module.exports = class Authoring{
  constructor(contributor, type, changeNote = ""){
    this.contributor=contributor;
    this.type=new Data(type, "xsd:string");
    this.changeNote=new Data(changeNote, "xsd:string");

    let now = new Date().toISOString().slice(0,-5)+"Z";
    this.modified=new Data(now, "xsd:dateTimeStamp");
  }
  getContributor(){
    return (this.contributor instanceof Value) ? this.contributor.toTriplePattern() : this.contributor;
  }
  getType(){
    return (this.type instanceof Value) ? this.type.toTriplePattern() : this.type;
  }
  getChangeNote(){
    return (this.changeNote instanceof Value) ? this.changeNote.toTriplePattern() : this.changeNote;
  }
  getModified(){
    return (this.modified instanceof Value) ? this.modified.toTriplePattern() : this.modified;
  }
  toTriplePattern(s, p, o){
    return `[] a owl:Axiom ;
    owl:AnnotationSource ${s} ;
    owl:AnnotationProperty ${p} ;
    owl:AnnotationTarget ${o} ;
    dcterms:contributor ${this.getContributor()};
    dcterms:modified ${this.getModified()};
    dcterms:type ${this.getType()};
    skos:changeNote ${this.getChangeNote()}.`;
  }
  static isAdd(){
    return UPDATE_TYPES.add;
  }
  static isRemove(){
    return UPDATE_TYPES.remove;
  }
};