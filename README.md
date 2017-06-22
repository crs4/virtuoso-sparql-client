Virtuoso SPARQL HTTP Client for Node.js
=============================================

## Install
```
npm install [--save] virtuoso-sparql-client
```

## Usage

#### Query
```js
const {Client} = require('virtuoso-sparql-client');

let DbPediaClient = new Client("http://dbpedia.org/sparql");
DbPediaClient.query('DESCRIBE <http://dbpedia.org/resource/Sardinia>')
  .then((results)=>{
    console.log(results);
  })
  .catch(console.log);
```

#### Store
```js
const {Client, Node, Text, Data, Triple} = require('virtuoso-sparql-client');

SaveClient = new Client("http://www.myendpoint.org/sparql");
SaveClient.setOptions(
  "application/json",
  {"myprefix": "http://www.myschema.org/ontology/"},
  "http://www.myschema.org/resource/");

SaveClient.getLocalStore().add(
  new Triple(
    "myprefix:id123",
    "dcterms:created",
    new Data(SaveClient.getLocalStore().now(), "xsd:dateTimeStamp")
  )
);
SaveClient.getLocalStore().add(
  new Triple(
    "myprefix:id123",
    "rdfs:label",
    new Text("A new lable", "en")
  )
);
SaveClient.getLocalStore().add(
  new Triple(
    "myprefix:id123",
    "owl:sameAs",
    new Node("http://dbpedia.org/resource/Sardinia")
  )
);
SaveClient.store(true)
.then((result)=>{
  console.log(JSON.stringify(result))
})
.catch(console.log);
```

## Query Methods

#### `query(queryString [, echo])`
Executes the query, returns a Promise that, when resolved, gives the complete result object.
 - `queryString` defines the SPARQL query as a String;
 - `echo` set to 'true' to print query in standard console. 'false' is the default value;

#### `store([echo])`
Remotely stores the triples locally saved onto the endpoint and cleans the local triple store.
Invokes the 'query' method and returns its Promise
 - `echo` set to 'true' to print query in standard console. 'false' is the default value;

#### `map(className, keyProperty [, recursive [, echo]])`
Checks if the axion "'className' owl:hasKey 'keyProperty'" is present, if true, returns a Promise that, when resolved, gives a Map object where the key is the value property and the value is the related Individual IRI.
 - `className` the rdf:type of Individuals on which the map is created. Accept complete URI or prefix:ClassName if the client knows it.
 - `keyProperty` the property which becomes the map key. Accept complete URI or prefix:ClassName if the client knows it.
 - `recursive` set to 'true' to set into the map also the Individuals that are instances of subclasses of `className`. 'false' is the default value;
 - `echo` set to 'true' to print query in standard console. 'false' is the default value;


## Util Methods
#### `getLocalStore()`
Returns the local store, it is an instance of TripleLocalStore class and exports this methods:
 - getLocalStore().getPrefixes()
 - getLocalStore().setPrefixes(prefixes)
 - getLocalStore().addPrefixes(prefixes)
 - getLocalStore().now()                  // Returns new Date().toISOString()
 - getLocalStore().add(triple)            // 'triple' mast be an instance of Triple
 - getLocalStore().clean()                // Cleans the local store
 - getLocalStore().toTriplePattern()      // Returns the Triple Pattern as a String

## Config Methods

#### `setDefaultFormat(format)`
Sets the default format for the Client
 - `format` the format as a String (ex. 'application/json'); [Virtuoso Response

#### `setDefaultPrefixes(prefixes)`
Sets a list of default prefixes for the Client
 - `prefixes` list of prefixes as an Object;
    ```js
    let prefixes = {
      myprefix: "http://www.myschema.org/ontology/",
      ex: "http://example.org/ontology#"
    };
    ```

#### `addPrefixes(prefixes)`
Adds a list of prefixes to default prefixes for the Client
 - `prefixes` list of prefixes as an Object;
    ```js
    let prefixes = {
      myprefix: "http://www.myschema.org/ontology/",
      ex: "http://example.org/ontology#"
    };
    ```

#### `setDefaultGraph(graph)`
Sets the default graph for the Client
 - `iri` the graph iri as a String;

#### `setOptions([format, prefixes, graph])`
Sets the default options for the Client
 - `format` the default format as a String (ex. 'application/json'); [Virtuoso Response Formats](https://virtuoso.openlinksw.com/dataspace/doc/dav/wiki/Main/VOSSparqlProtocol#SPARQL%20Protocol%20Server%20Response%20Formats)
 - `prefixes` list of default prefixes as an Object;
    ```js
    let prefixes = {
      myprefix: "http://www.myschema.org/ontology/",
      ex: "http://example.org/ontology#"
    };
   ```
 - `graph` the default graph iri as a String;

#### `setQueryGraph(iri)`
Sets the graph for the query
 - `iri` the graph iri as a String;

#### `setQueryFormat(format)`
Sets a format for the query
 - `format` the format as a String (ex. 'application/json');

#### `setQueryPrefixes(prefixes)`
Sets a list of prefixes for the query
 - `prefixes` list of prefixes as an Object;
    ```js
    let prefixes = {
      myprefix: "http://www.myschema.org/ontology/",
      ex: "http://example.org/ontology#"
    };
    ```

#### `setQueryMaxrows(rows)`
Sets a maximum numbers of rows that should be returned by the query
 - `rows` maximum number;

## Notes
#### Supported Parameters
* query
* default-graph-uri
* maxrows

[Virtuoso HTTP Request Parameters](https://virtuoso.openlinksw.com/dataspace/doc/dav/wiki/Main/VOSSparqlProtocol#HTTP%20Request%20Parameters)
