const request = require('request');
const qs = require('qs');

const {VALID_QUERY_TYPES, DEFAULT_PREFIXES, JSON_TYPES, DONOT_STRIP} = require('./util');
const LocalTripleStore = require('./localTripleStore');
const Triple = require('./triple');

module.exports = class Client {
  constructor(endpoint){
    this.defaultPrefixes = DEFAULT_PREFIXES;
    this.defaultDefines = {};
    this.endpoint = endpoint;
    this.triples = [];
    this.setOptions();
    this.localStore = new LocalTripleStore();
    // incredible! the maximum number of triples seems to be 1426
    this.maximumTriples = 1024;
    // the maximum query size in byte is 10000000 but we use 2^log2(10000000)
    this.maximumByte = 8388608;
  }
  query(query, echo = false){
    return new Promise((resolve, reject) => {
      let opts = this._createQueryOptions(query, echo);

      return request.post(opts, (error, res, body) => {
        if(Buffer.byteLength(query, 'utf8') >= 10000000){
          reject({
            source: 'virtuoso-sparql-client',
            error: new Error(`A single query exceeds the maximum size (10.000.000 byte)`),
            query: query
          });
        }
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
          opts.body = qs.parse(opts.body);
          opts.body.query= opts.body.query.replace(/(\r\n|\n|\r)/gm,"");
          return reject({
            source: 'virtuoso-sparql-client',
            method: this.methodName,
            requestOptions: opts,
            statusCode: res.statusCode,
            statusMessage: res.statusMessage
          });
        }

        this._resetQueryData();
        body = (JSON_TYPES.indexOf(opts.headers.accept) > -1) ? JSON.parse(body) : body;
        return resolve(body);
      });

    });
  }
  store(echo = false){
    this.methodName = "store";

    if(!Boolean(this._calculateQueryGraph()))
      throw new Error(`Graph name is empty.\nUse the methods 'setDefaultGraph()' or 'setQueryGraph()' to set it`);

    if(this.getLocalStore().triples.length === 0)
      return Promise.resolve();
    
    let blocks = [];
    blocks.push([])
    let queryBytes = 0;
    let count = 0;
    let pattern = "";
    let currentOperation = "";
    let queryString = "";
    for (let triple of this.getLocalStore()) {
      if(triple.byteLength >= this.maximumByte){
        throw new Error(`A triple is ${triple.byteLength} bytes length and exceeds the maximum size (${this.maximumByte} byte)`);
      }
      if(!triple.getOperation()){
        triple.setOperation(Triple.ADD);
        console.warn(`Operation is null. Triple.ADD is setted by default`, triple.toTriplePattern());
      }
      if(count === 0) {
        currentOperation = triple.getOperation();
      }
      queryBytes += triple.byteLength;
      if(triple.getOperation() !== currentOperation){
        queryString = this._createQuery(pattern, currentOperation);
        blocks[blocks.length - 1].push(queryString);
        blocks.push([]);
        pattern = "";
        currentOperation = triple.getOperation();
      }
      if(count <= this.maximumTriples && queryBytes <= this.maximumByte){
        pattern += `
          ${triple.toTriplePattern()}`;
        count++;
      }
      else{
        queryString = this._createQuery(pattern, currentOperation);
        blocks[blocks.length - 1].push(queryString);
        pattern = `
          ${triple.toTriplePattern()}`;
        if(count > this.maximumTriples)
          count = 1;
      }
    }
    if(this.getLocalStore().last.getOperation() !== currentOperation){
      blocks.push([]);
    }
    queryString = this._createQuery(pattern, currentOperation);
    blocks[blocks.length - 1].push(queryString);  

    blocks = blocks.map((currentBlock)=>{
      return () => {
        const blockPromises = [];
          
        currentBlock.forEach((currentQuery) => {
          this.setQueryPrefixes(this.getLocalStore().prefixes);
          this.setQueryFormat("application/json");
          blockPromises.push(this.query(currentQuery, echo));
        });

        return Promise.all(blockPromises);
      };
    });
    this.getLocalStore().empty();
    return this._executeSequential(blocks);
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
            ?id a ?class;`
            : `?id a ${className};`

          let queryString = `select ?key ?id  where {
            ${filterClass}
            ${keyProperty} ?key .
          } order by ?key`;

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
          console.log(data.key.value.toLowerCase());
          map.set(data.key.value.toLowerCase(), data.id.value)
        });
        if(map.size===0)
          console.log(`WARNING: the Map is empty`);
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
             dcterms:created "${this.getLocalStore().now}"^^xsd:dateTimeStamp;
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
  addDefines(defines){
    let joinedDefines = Object.assign({}, defines);
    this.setDefaultDefines(joinedDefines);
    return this.defaultDefines;
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

  static composeDefines(defines) {
        let define, literal;
        let defineString = "";
        for (define in defines) {
          literal = defines[define];
          defineString += `define ${define} '${literal}'
          `;
        }
        return defineString;
  }

  setOptions(format = "application/ld+json", prefixes = {}, graph = "", defines = {}){
    this.setDefaultFormat(format);
    this.addPrefixes(prefixes);
    this.setDefaultGraph(graph);
    this.addDefines(defines);
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
  setQueryDefines(defines){
    this.queryDefines = defines;
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
  setDefaultDefines(defines){
    this.defaultDefines = defines;
  }
  setDefaultGraph(graph){
    this.defaultGraph = graph;
  }
  _createQuery(pattern, currentOperation){
    if (currentOperation === Triple.ADD) {
      return `
        INSERT IN GRAPH <${this._calculateQueryGraph()}> {
          ${pattern}
        }`;
    }
    else if (currentOperation === Triple.REMOVE) {
      return `
        WITH <${this._calculateQueryGraph()}>
        DELETE { 
          ${pattern} 
        }`;
    }
    else {
      throw new Error(`${currentOperation} is not a valid operation name`);
    }
  }
  _createQueryOptions(query, echo){
    let opts = {
      uri: this.endpoint,
      encoding: 'utf8'
    };

    let body = {};
    let prefixes = this._calculateQueryPrefixes();
    let defines = this._calculateQueryDefines();
    body.query = `
      ${Client.composeDefines(defines)}
      ${Client.composePrefixes(prefixes)}
      ${query}
    `;
    if(echo) console.log(body.query);

    body["default-graph-uri"] = this._calculateQueryGraph();
    body.maxrows = this._calculateQueryMaxrows();
    body["named-graph-uri"] = this._calculateQueryUri();
    opts.body = qs.stringify(body);

    opts.headers = {
      'content-type': 'application/x-www-form-urlencoded',
      'accept': this._calculateQueryFormat()
    };
    return opts;
  }
  _calculateQueryPrefixes(){
    return Object.assign({}, DEFAULT_PREFIXES, this.defaultPrefixes, this.queryPrefixes);
  }
  _calculateQueryDefines(){
    return Object.assign({}, this.defaultDefines, this.queryDefines);
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
    this.queryFormat = null;
    this.queryPrefixes = null;
    this.queryDefines = null;
    this.queryMaxrows = null;
    this.namedGraphUri = null;
    this.methodName = "query";
  }
  _prepareTripleField(fieldName){
    let prefixes = this._calculateQueryPrefixes();
    return prefixes[fieldName.split(":")[0]] ? fieldName : `<${fieldName}>`;
  }
  _executeSequential(arr){
    return new Promise((resolve, reject) => {
      let sequence = new Promise((resolve, reject) => resolve({ start: true }));
      let all = [];
      arr.forEach((p, i) => {
        sequence = sequence.then((a) => {        
          if(i > 0 && a)
            all.push(a);
          return p();
        })
        .catch((e) => {
          all.push(e);
        });
      });
  
      sequence.then((b)=>{
        if(b){
          all.push(b);
        }

        all = this._flatten(all);
        return resolve(all);
      });
    });
  }
  _flatten(arr) {
    return arr.reduce((a, b) => {
      return a.concat(Array.isArray(b) ? this._flatten(b) : b);
    }, []);
  }
}
