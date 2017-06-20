const request = require('request');
const querystring = require('querystring');

const {VALID_QUERY_TYPES, DEFAULT_PREFIXES, JSON_TYPES} = require('./util');
const {ResponseFormatError, EmptyGraphError} = require('./errors');

class AbstractQuery {
  constructor() {
    if (new.target === AbstractQuery) {
      throw new TypeError("Cannot construct Abstract instances directly");
    }
    if (this.getRdf === undefined) {
      // or maybe test typeof this.method === "function"
      throw new TypeError("Must override method");
    }
  }
}
class QueryNode extends AbstractQuery {
  constructor(iri){
    super();
    this.iri = iri;
  }
  getRdf(){
    return `<${this.iri}>`;
  }
}
class QueryString extends AbstractQuery {
  constructor(value, lang=null){
    super();
    this.value = value;
    this.lang = lang;
  }
  getRdf(){
    let s = `"${this.value}"`;
    if(this.lang !== null)
      s += `@${this.lang}`;
    return s;
  }
}
class QueryData extends AbstractQuery {
  constructor(value, type=null){
    super();
    this.value = value;
    this.type = type;
  }
  getRdf(){
    let s = `"${this.value}"`;
    if(this.type !== null)
      s += `^^${this.type}`;
    return s;
  }
}
class Triple{
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
}
class LocalTripleStore{
  constructor(prefixes = {}){
    this.prefixes = prefixes;
    this.localStore = [];
  }
  getPrefixes(){
    return this.prefixes;
  }
  now(){
    return new Date().toISOString();
  }
  add(triple){
    this.localStore.push(triple);
  }
  clear(){
    this.localStore = [];
  }
  toRdf(){
    let rdf = "";
    let rdfSubject, rdfPredicate, rfdObject;

    this.localStore.forEach((triple)=>{
      rdfSubject = (triple.getSubject() instanceof AbstractQuery) ? triple.getSubject().getRdf() : triple.getSubject();
      rdfPredicate = (triple.getPredicate() instanceof AbstractQuery) ? triple.getPredicate().getRdf() : triple.getPredicate();
      rfdObject = (triple.getObject() instanceof AbstractQuery) ? triple.getObject().getRdf() : triple.getObject();

      rdf += `
        ${rdfSubject} ${rdfPredicate} ${rfdObject} .`;
    });
    return rdf;
  }
}

class Client {
  constructor(endpoint){
    this.defaultPrefixes = DEFAULT_PREFIXES;
    this.endpoint = endpoint;
    this.triples = [];
    this.setOptions();
  }
  setQueryGraph(graph){
    this.queryGraph = graph;
  }
  setQueryFormat(format){
    this.queryFormat = format;
  }
  setQueryPrefixes(prefixes){
    this.queryPrefixes = prefixes;
  }
  setQueryMaxrows(rows){
    this.queryMaxrows = rows;
  }
  setOptions(format = "application/ld+json", prefixes = {}, graph = ""){
    this.setDefaultFormat(format);
    this.addPrefixes(prefixes);
    this.setDefaultGraph(graph);
  }

  // NEWS START
  setDefaultFormat(format){
    this.defaultFormat = format;
  }
  setDefaultPrefixes(prefixes){
    this.defaultPrefixes = prefixes;
  }
  addPrefixes(prefixes){
    let joinedPrefixes = Object.assign({}, this.defaultPrefixes, prefixes);
    this.setDefaultPrefixes(joinedPrefixes);
    return this.defaultPrefixes;
  }
  setDefaultGraph(graph){
    this.defaultGraph = graph;
  }

  // localStore must be an istance of LocalTripleStore
  store(localStore, echo = false){
    //ERRORS

    if(!Boolean(this._calculateQueryGraph()))
      throw new EmptyGraphError();
    if(this._calculateQueryFormat() === "application/ld+json")
      throw new ResponseFormatError(this._calculateQueryFormat());

    let queryString = `INSERT DATA { GRAPH <${this._calculateQueryGraph()}> { ${localStore.toRdf()} }}`;

    this.setQueryPrefixes(localStore.getPrefixes());
    return this.query(queryString, echo);
  }
  // NEWS END

  query(query, echo = false){

    return new Promise((resolve, reject) => {
      let opts = this._createQueryOptions(query, echo);
      return request.post(opts, (err, res, body) => {
        this._cleanQueryData();
        if(err)
          return reject({
            source: 'virtuoso-sparql-client',
            method: 'query',
            error: err
          });

        if (Boolean(res)) {
          if(res.statusCode === 200){
            body = (JSON_TYPES.indexOf(opts.headers.accept) > -1) ? JSON.parse(body) : body;
            return resolve(body);
          }
          else{
            return reject({
              source: 'virtuoso-sparql-client',
              method: 'query',
              requestOptions: opts,
              statusCode: res.statusCode,
              statusMessage: res.statusMessage
            });
          }
        }
        else {
          return reject({
            source: 'virtuoso-sparql-client',
            method: 'query',
            message: 'Boolean(RequestResponse) returns false',
            error: err
          });
        }
      });

    });
  }

  static composePrefixes(prefixes) {
    let prefix, iri;
    let prefixesString = "";
    for (prefix in prefixes) {
      iri = prefixes[prefix];
      prefixesString += `prefix ${prefix}: <${iri}>
      `;
    }
    return prefixesString;
  }
  _createQueryOptions(query, echo){
    let opts = {
      uri: this.endpoint,
      encoding: 'utf8'
    };

    let body = {};
    let prefixes = Object.assign(DEFAULT_PREFIXES, this.defaultPrefixes, this.queryPrefixes);
    body.query = `
      ${Client.composePrefixes(prefixes)}
      ${query}
    `;
    if(echo) console.log(body.query);

    body["default-graph-uri"] = this._calculateQueryGraph();
    body.maxrows = this._calculateQueryMaxrows();
    body["named-graph-uri"] = this._calculateQueryUri();
    opts.body = querystring.stringify(body);

    opts.headers = {
      'content-type': 'application/x-www-form-urlencoded',
      'accept': this._calculateQueryFormat()
    };
    return opts;
  }
  _calculateQueryFormat(){
    return (this.queryFormat) ? this.queryFormat : (this.defaultFormat) ? this.defaultFormat : "application/ld+json";
  }
  _calculateQueryUri(){
    return (this.queryUri) ? this.queryUri : null;
  }
  _calculateQueryMaxrows(){
    return (this.queryMaxrows) ? this.queryMaxrows : null;
  }
  _calculateQueryGraph(){
    let value = (this.queryGraph) ? this.queryGraph : (this.defaultGraph) ? this.defaultGraph : "";
    return value;
  }
  _cleanQueryData(){
    this.queryGraph = null;
    this.queryPrefixes = null;
    this.queryMaxrows = null;
    this.namedGraphUri = null;
  }
}

module.exports = {
  QueryNode,
  QueryString,
  QueryData,
  Triple,
  LocalTripleStore,
  Client,
  ResponseFormatError,
  EmptyGraphError
}
