module.exports = class LocalTripleStore{
  constructor(prefixes = {}){
    this.prefixes = prefixes;
    this.triples = [];
  }
  getPrefixes(){
    return this.prefixes;
  }
  setPrefixes(prefixes){
    this.prefixes = prefixes;
  }
  addPrefixes(prefixes){
    let joinedPrefixes = Object.assign({}, this.prefixes, prefixes);
    this.setPrefixes(joinedPrefixes);
    return this.defaultPrefixes;
  }
  now(){
    return new Date().toISOString();
  }
  add(triple){
    if(!(triple instanceof Triple)) throws new TypeError();
    this.triples.push(triple);
  }
  clean(){
    this.triples = [];
  }
  toTriplePattern(){
    let rdf = "";
    this.triples.forEach((triple)=>{
      rdf += `
        ${triple.toTriplePattern()}`;
    });
    return rdf;
  }
}
