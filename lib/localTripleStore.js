let Triple = require("./triple");

module.exports = class LocalTripleStore{
  constructor(prefixes = {}){
    this.prefixes = prefixes;
    this.triples = [];
    this.nil = "rdf:nil";
    this.cache = [];
  }
  [Symbol.iterator]() {
    var index = -1;
    var data  = this.triples;

    return {
      next: () => ({ value: data[++index], done: !(index in data) })
    };
  }
  get size(){
    return this.triples.length;
  }
  get last(){
    return this.triples[this.triples.length - 1];
  }
  getCache(){
    return this.cache;
  }
  pushCache(){
    this.cache.push({
      triples: this.triples,
      date: new Date().toISOString().slice(0,-5)+"Z"
    });
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
  get now(){
    return new Date().toISOString();
  }
  add(triple){
    if(!(triple instanceof Triple))
      throw new TypeError(triple + " must be an instance of virtuoso-sparql-client Triple");

    if(triple.getOperation() === Triple.UPDATE){
      if(!triple.getPrevious() || !(triple.getPrevious() instanceof Triple)){
        triple.setOperation(Triple.ADD);
        triple.setPrevious(null);
        this.triples.push(triple);
        console.warn(`Operation ${Triple.UPDATE} requires a reference to the tiple to modify. Operation is modified in ${Triple.ADD}`, triple.toTriplePattern());
      }
      else{
        let previous = triple.getPrevious();
        previous.setOperation(Triple.REMOVE);
        
        triple.setOperation(Triple.ADD);
        triple.setPrevious(null);

        this.triples.push(previous);
        this.triples.push(triple);
      }
    }
    else{
      this.triples.push(triple);
    }
    
  }
  empty(){
    this.pushCache();
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
};
