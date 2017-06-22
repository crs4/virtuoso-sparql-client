const request = require('request');
const querystring = require('querystring');

const {VALID_QUERY_TYPES, DEFAULT_PREFIXES, JSON_TYPES} = require('./util');
const {ResponseFormatError, EmptyGraphError} = require('./errors');
const LocalTripleStore = require('./localTripleStore');

module.exports = class Client {
  constructor(endpoint){
    this.defaultPrefixes = DEFAULT_PREFIXES;
    this.endpoint = endpoint;
    this.triples = [];
    this.setOptions();
    this.localStore = new LocalTripleStore();
    this.methodName = "query";
  }
  query(query, echo = false){
    return new Promise((resolve, reject) => {
      let opts = this._createQueryOptions(query, echo);

      return request.post(opts, (error, res, body) => {
        this._resetQueryData();
        if(error){
          return reject({
            source: 'virtuoso-sparql-client',
            method: this.methodName,
            error: error
          });
        }
        if (!Boolean(res)) {
          return reject({
            source: 'virtuoso-sparql-client',
            method: this.methodName,
            message: 'Boolean(RequestResponse) returns false'
          });
        }
        if(res.statusCode !== 200){
          return reject({
            source: 'virtuoso-sparql-client',
            method: this.methodName,
            requestOptions: opts,
            statusCode: res.statusCode,
            statusMessage: res.statusMessage
          });
        }

        body = (JSON_TYPES.indexOf(opts.headers.accept) > -1) ? JSON.parse(body) : body;
        return resolve(body);
      });

    });
  }
  store(echo = false){
    this.methodName = "store";
    if(!Boolean(this._calculateQueryGraph()))
      throw new EmptyGraphError();
    if(this._calculateQueryFormat() === "application/ld+json")
      throw new ResponseFormatError(this._calculateQueryFormat());

    let queryString = `INSERT DATA {
      GRAPH <${this._calculateQueryGraph()}> {
        ${this.getLocalStore().toTriplePattern()}
      }
    }`;
    this.setQueryPrefixes(this.getLocalStore().getPrefixes());
    this.getLocalStore().empty();
    return this.query(queryString, echo);
  }
  map(className, keyProperty, recursive = false, echo = false){
    this.methodName = "map";
    if(this._calculateQueryFormat() === "application/ld+json")
      throw new ResponseFormatError(this._calculateQueryFormat());

    return new Promise((resolve, reject) => {
      let graph = this._calculateQueryGraph();
      className = this._prepareTripleField(className);
      keyProperty = this._prepareTripleField(keyProperty);

      let queryKey = `ASK FROM <${graph}> {className owl:hasKey keyProperty}`;

      this.query(query, echo)
      .then((result)=>{
        if(Boolean(result.boolean)) { // Is a Key
          let filterClass = (recursive)
            ? `?class rdfs:subClassOf* ${className} .
               ?id a ?class .`
            : `?id a ${className} .`

          let queryString = `select ?key ?id  where {
            ${filterClass}
            ?id ${keyProperty} ?key .
          } order by ?id`;

          return this.query(queryString, echo)
        }
        else {
          reject(return reject({
            source: 'virtuoso-sparql-client',
            method: this.methodName,
            message: "The property is not a Key"
          });
        }
      })
      .then((result)=>{
        let map = new Map();
        result.results.bindings.forEach((data) => {
          map.set(data.key.value, data.id.value)
        });

        return resolve(map);
      })
      .catch(reject);

    });
  }
  strip(className, echo = false){
    this.methodName = "emptyClass";
    let graph = this._calculateQueryGraph();
    className = this._prepareTripleField(className);

    let query = `DELETE DATA FROM <${grpah}>
      { ?s ?p ?o }
      WHERE {
        ?s a ${className} .
        FILTER ( NOT EXIST {${className} owl:hasKey ?o} || ?o != dcterms:created )
      }`;

    return this.query(queryString, echo);
  }

  getLocalStore(){
    return this.localStore;
  }
  addPrefixes(prefixes){
    let joinedPrefixes = Object.assign({}, this.defaultPrefixes, prefixes);
    this.setDefaultPrefixes(joinedPrefixes);
    return this.defaultPrefixes;
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

  setOptions(format = "application/ld+json", prefixes = {}, graph = ""){
    this.setDefaultFormat(format);
    this.addPrefixes(prefixes);
    this.setDefaultGraph(graph);
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
  setDefaultFormat(format){
    this.defaultFormat = format;
  }
  setDefaultPrefixes(prefixes){
    this.defaultPrefixes = prefixes;
  }
  setDefaultGraph(graph){
    this.defaultGraph = graph;
  }

  _createQueryOptions(query, echo){
    let opts = {
      uri: this.endpoint,
      encoding: 'utf8'
    };

    let body = {};
    let prefixes = this._calculateQueryPrefixes();
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
  _calculateQueryPrefixes(){
    return Object.assign({}, DEFAULT_PREFIXES, this.defaultPrefixes, this.queryPrefixes);
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
  _resetQueryData(){
    this.queryGraph = null;
    this.queryPrefixes = null;
    this.queryMaxrows = null;
    this.namedGraphUri = null;
    this.methodName = "query";
  }
  _prepareTripleField(fieldName){
    let prefixex = this._calculateQueryPrefixes();
    return prefixes[fieldName.split(":")[0]] ? fieldName : `<${fieldName}>`;
  }
}
