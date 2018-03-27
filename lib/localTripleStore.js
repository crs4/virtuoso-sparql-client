let Triple = require("./triple");

module.exports = class LocalTripleStore{
  constructor(prefixes = {}){
    this.prefixes = prefixes;
    this.triples = [];
    this.nil = "rdf:nil";
    this.localCache = [];
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
  get cache(){
    return this.localCache;
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
    let {add, remove} = this._check(triple);
    if(remove)
      this.triples.push(remove);
    if(add)
      this.triples.push(add);
  }
  bulk(triples){
    let toAdd = [];
    let toRemove = [];

    const firstOperation = triples[0].getOperation();
    
    triples.forEach((triple)=>{
      if(triple.getOperation() != firstOperation)
        throw new TypeError("All the triples must have the same operation type"); 
      let {add, remove} = this._check(triple);
      if(remove)
        toRemove.push(remove);
      if(add)
        toAdd.push(add);
    });
    this.triples.push(...toRemove);
    this.triples.push(...toAdd);
  }
  empty(){
    this._pushCache();
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
  _pushCache(){
    this.localCache.push({
      triples: this.triples,
      date: new Date().toISOString().slice(0,-5)+"Z"
    });
  }
  _check(triple){
    let toAdd = null;
    let toRemove = null;
    if(!(triple instanceof Triple))
      throw new TypeError(triple + " must be an instance of virtuoso-sparql-client Triple");

    if(triple.getOperation() === Triple.UPDATE){
      if(!triple.getPrevious() || !(triple.getPrevious() instanceof Triple)){
        triple.setOperation(Triple.ADD);
        triple.setPrevious(null);
        toAdd = triple;
        console.warn(`Operation ${Triple.UPDATE} requires a reference to the tiple to modify. Operation is modified in ${Triple.ADD}`, triple.toTriplePattern());
      }
      else{
        toRemove = triple.getPrevious();
        toRemove.setOperation(Triple.REMOVE);
        
        triple.setOperation(Triple.ADD);
        triple.setPrevious(null);
        toAdd = triple;
      }
    }
    else{
      if(triple.getOperation() === Triple.ADD)
        toAdd = triple;
      if(triple.getOperation() === Triple.REMOVE)
        toRemove = triple;
    }
    return {add: toAdd, remove: toRemove};
  }
};
