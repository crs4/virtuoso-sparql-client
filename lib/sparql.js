const request = require('request');
const querystring = require('querystring');

class Client {
  constructor(endpoint, prefixes = {}){
    this.endpoint = endpoint;

    this.prefixes = Client.composePrefixes(prefixes);
  }
  setDefaultGraph(iri){
    this.defaultGraph = iri;
  }
  setGraph(iri){
    this.graph = iri;
  }
  query(query, options = {}){
    return new Promise((resolve, reject) => {
      let defaults = {
        uri: this.endpoint,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'accept': 'application/sparql-results+json'
        },
        body: querystring.stringify({
          query
        }),
        encoding: 'utf8',
        prefixes: this.prefixes
      };
      if(this.defaultGraph){
        defaults.body = querystring.stringify({
          ["default-graph-uri"] : this.defaultGraph,
          query
        });
      }
      if(this.graph){
        defaults.body = querystring.stringify({
          ["default-graph-uri"] : this.graph,
          query
        });
      }
      let opts = Object.assign({}, defaults, options);

      query = opts.prefixes + "\n\n" + query;

      return request.post(opts, (err, res, body) => {
        this.graph = null;
        if (res !== null && res.statusCode === 200) {
          return resolve(JSON.parse(body));
        } else {
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
      prefixesString += "prefix " + prefix + ": <" + iri + ">\n";
    }
    return prefixesString;
  }
}

exports.Client = Client;
