const request = require('request');
const querystring = require('querystring');

const {VALID_QUERY_TYPES, DEFAULT_PREFIXES, JSON_TYPES} = require('./util');

class Client {
  constructor(endpoint){
    this.endpoint = endpoint;
    this.setOptions();
  }
  setQueryGraph(iri){
    this.graph = iri;
  }
  setQueryFormat(format){
    this.format = format;
  }
  setQueryPrefixes(prefixes){
    this.prefixes = prefixes;
  }
  setQueryMaxrows(rows){
    this.maxrows = rows;
  }
  setOptions(format = "application/ld+json", prefixes = DEFAULT_PREFIXES, graph = ""){
    this.defaultFormat = format;
    this.defaultPrefixes = prefixes;
    this.defaultGraph = graph;
  }
  query(query){
    return new Promise((resolve, reject) => {
      let opts = this._createQueryOptions(query);
      return request.post(opts, (err, res, body) => {
        this._cleanQueryData();
        if(err)
          return reject(err);

        if (res !== null && res !== undefined) {
          if(res.statusCode === 200){
            body = (JSON_TYPES.indexOf(opts.headers.accept) > -1) ? JSON.parse(body) : body;
            return resolve(body);
          }
          else{
            return reject({
              source: 'virtuoso-sparql-client',
              requestOptions: opts,
              statusCode: res.statusCode,
              statusMessage: res.statusMessage
            });
          }
        }
        else {
          return reject(err);
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

  _createQueryOptions(query){
    let opts = {
      uri: this.endpoint,
      encoding: 'utf8'
    };

    let body = {};
    let prefixes = (this.prefixes) ? this.prefixes : (this.defaultPrefixes) ? this.defaultPrefixes : DEFAULT_PREFIXES;
    body.query = `
      ${Client.composePrefixes(prefixes)}
      ${query}
    `;
    body["default-graph-uri"] = (this.graph) ? this.graph : (this.defaultGraph) ? this.defaultGraph : "";
    body.maxrows = (this.maxrows) ? this.maxrows : null;
    body["named-graph-uri"] = (this.queryUri) ? this.queryUri : null;
    opts.body = querystring.stringify(body);

    let format = (this.format) ? this.format : (this.defaultFormat) ? this.defaultFormat : "application/ld+json";
    opts.headers = {
      'content-type': 'application/x-www-form-urlencoded',
      'accept': format
    };


    return opts;
  }
  _cleanQueryData(){
    this.graph = null;
    this.prefixes = null;
    this.maxrows = null;
    this.namedGraphUri = null;
  }
}

exports.Client = Client;
