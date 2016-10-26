Simple SPARQL HTTP Client library for Node.js
=============================================

## install
```
    npm install sparql-simple-client
```

## usage
```js
const Sparql = require('simple-sparql-client');
const Client = new Sparql.Client("http://dbpedia.org/sparql", {dbpedia : "http://dbpedia.org/"});

let opts = {
  headers: {
    'content-type': 'application/x-www-form-urlencoded',
    'accept': 'application/ld+json'
  }
};

Client.query('DESCRIBE <http://dbpedia.org/resource/Sardinia>', opts)
  .then((results)=>{
    console.log(results);
  })
  .catch((err) => {
    console.log(err);
  });
```

## methods

#### `query(queryString [, opts])`

Returns the complete results object, its format depends on request header in the opts object.

`queryString` defines the SPARQL query as a String;

`Opts` object defines:
* uri: "",        // To change the default Client endpoint
* headers: {},
* encoding: '',   // Default: utf8
* prefixes: {}    // To override the default Client prefixes

#### `setDefaultGraph(iri)`
Set the default graph for the Client

`iri` the graph iri as a String;

#### `setGraph(iri)`
Set a graph for the next query

`iri` the graph iri as a String;
