const request = require('request');
const querystring = require('querystring');

const {VALID_QUERY_TYPES, DEFAULT_PREFIXES, JSON_TYPES, DONOT_STRIP} = require('./util');
const LocalTripleStore = require('./localTripleStore');
const Triple = require('./triple');

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
      throw new Error(`Graph name is empty.\nUse the methods 'setDefaultGraph()' or 'setQueryGraph()' to set it`);

    let queryString = `INSERT DATA {
      GRAPH <${this._calculateQueryGraph()}> {
        ${this.getLocalStore().toTriplePattern()}
      }
    }`;
    this.setQueryPrefixes(this.getLocalStore().getPrefixes());
    this.setQueryFormat("application/json");
    this.getLocalStore().empty();
    return this.query(queryString, echo);
  }
  keys(className, echo = false){
    this.methodName = "keys";
    let localMethodName = this.methodName;

    return new Promise((resolve, reject) => {
      className = this._prepareTripleField(className);

      let query = `SELECT ?key {
        ${className} owl:hasKey/rdf:rest*/rdf:first ?key}`;

      this.setQueryFormat("application/json");
      this.query(query, echo)
      .then((result)=>{
        let keys = []
        result.results.bindings.forEach((current)=>{
          keys.push(current.key.value);
        });
        resolve(keys)
      })
      .catch(reject)
    });
  }
  isKey(className, keyProperty, echo = false){
    this.methodName = "isKey";
    let localMethodName = this.methodName;

    return new Promise((resolve, reject) => {
      let graph = this._calculateQueryGraph();
      className = this._prepareTripleField(className);
      keyProperty = this._prepareTripleField(keyProperty);

      let query = `ASK FROM <${graph}> {
        ${className} owl:hasKey/rdf:rest*/rdf:first ${keyProperty}}`;

      this.setQueryFormat("application/json");
      this.query(query, echo)
      .then((result)=>{
        resolve(result.boolean)
      })
      .catch(reject)
    });
  }
  map(className, keyProperty, recursive = false, echo = false){
    this.methodName = "map";
    let localMethodName = this.methodName;

    return new Promise((resolve, reject) => {
      this.isKey(className, keyProperty, echo)
      .then((result)=>{
        if(Boolean(result)) { // Is a Key
          className = this._prepareTripleField(className);
          keyProperty = this._prepareTripleField(keyProperty);

          let filterClass = (recursive)
            ? `?class rdfs:subClassOf* ${className} .
               ?id a ?class .`
            : `?id a ${className} .`

          let queryString = `select ?key ?id  where {
            ${filterClass}
            ?id ${keyProperty} ?key .
          } order by ?id`;

          this.setQueryFormat("application/json");

          return this.query(queryString, echo)
        }
        else {
          reject({
            source: 'virtuoso-sparql-client',
            method: localMethodName,
            message: `The property "${keyProperty}" is not a OWL key for the class "${className}"`
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
      .catch((error)=>{
        reject({
          source: 'virtuoso-sparql-client',
          method: localMethodName,
          message: "The property is not a Key",
          error
        });
      });

    });
  }
  strip(className, echo = false){
    this.methodName = "strip";

    return new Promise((resolve, reject) => {
      this.keys(className, echo)
      .then((keys)=>{
        let preserve = keys.concat(DONOT_STRIP)
        .map((key)=>{
          return this._prepareTripleField(key);
        });
        let filter = preserve.join(" && ?p != ");
        filter =  "?p != " + filter;
        let query = `WITH <${this._calculateQueryGraph()}> DELETE { ?s ?p ?o }
          WHERE {
            ?s a ${className} .
            ?s ?p ?o .
            FILTER ( ${filter} )
          }`;
        return this.query(query, echo);
      })
      .then(resolve)
      .catch((error) => {
        reject(error);
      });
    });
  }
  different(individuals, echo = false){
    this.methodName = "different";
    let localMethodName = this.methodName;

    return new Promise((resolve, reject) => {
      let IRIs = individuals.map((key)=>{
        return this._prepareTripleField(key);
      });
      let query = `with <${this._calculateQueryGraph()}> INSERT {
          [] rdf:type owl:AllDifferent ;
             dcterms:created "${this.getLocalStore().now()}"^^xsd:dateTimeStamp;
             owl:distinctMembers (${IRIs.join(" ")})
        }
        WHERE {
          SELECT * {
            OPTIONAL { ?s ?p ?o . }
          } LIMIT 1
        }`;
      this.setQueryFormat("application/json");
      this.query(query, echo)
      .then((iri)=>{
        resolve(iri);
      })
      .catch((error) => {
        reject(error);
      });
    });
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
    let prefixes = this._calculateQueryPrefixes();
    return prefixes[fieldName.split(":")[0]] ? fieldName : `<${fieldName}>`;
  }
}
