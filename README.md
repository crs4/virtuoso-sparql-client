Virtuoso SPARQL HTTP Client for Node.js
=============================================

## Install
```
npm install virtuoso-sparql-client
```

## Usage
```js
const Sparql = require('virtuoso-sparql-client');
const Client = new Sparql.Client("http://dbpedia.org/sparql");

Client.setOptions("application/ld+json");

Client.query('DESCRIBE <http://dbpedia.org/resource/Sardinia>')
  .then((results)=>{
    console.log(results);
  })
  .catch((err) => {
    console.log(err);
  });
```

## Methods

#### `query(queryString)`
Returns the complete results object, it's format is setted from setOptions Client method.

`queryString` defines the SPARQL query as a String;

#### `setOptions([format, prefixes, graph])`
Set the default options for the Client

`format` the default format as a String (ex. 'application/json'); [Virtuoso Response Formats](https://virtuoso.openlinksw.com/dataspace/doc/dav/wiki/Main/VOSSparqlProtocol#SPARQL%20Protocol%20Server%20Response%20Formats)

`prefixes` list of default prefixes as an Object;
```js
let prefixes = {
  po      : "http://po.example.org/2016/08/po-schema/",
  ba      : "http://example.org/ontology/ba#"
};
```

`graph` the default graph iri as a String;

#### `setQueryGraph(iri)`
Set the graph for the query

`iri` the graph iri as a String;

#### `setQueryFormat(format)`
Set a format for the query

`format` the format as a String (ex. 'application/json');

#### `setQueryPrefixes(prefixes)`
Set a list of prefixes for the query

`prefixes` list of prefixes as an Object;
```js
let prefixes = {
  po      : "http://po.example.org/2016/08/po-schema/",
  ba      : "http://example.org/ontology/ba#"
};
```

#### `setQueryMaxrows(rows)`
Set a maximum numbers of rows that should be returned by the query

`rows` maximum number;

## Notes
#### `Supported Parameters`
* query
* default-graph-uri
* maxrows

[Virtuoso HTTP Request Parameters](https://virtuoso.openlinksw.com/dataspace/doc/dav/wiki/Main/VOSSparqlProtocol#HTTP%20Request%20Parameters)
