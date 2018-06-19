# Virtuoso SPARQL Client

[![npm](https://img.shields.io/npm/v/virtuoso-sparql-client.svg)](https://www.npmjs.com/package/virtuoso-sparql-client) [![npm](https://img.shields.io/npm/dw/virtuoso-sparql-client.svg)](https://www.npmjs.com/package/virtuoso-sparql-client) [![GitHub issues](https://img.shields.io/github/issues-raw/crs4/virtuoso-sparql-client.svg)](https://github.com/crs4/virtuoso-sparql-client/issues) [![GitHub closed pull requests](https://img.shields.io/github/issues-pr-closed-raw/crs4/virtuoso-sparql-client.svg)](https://github.com/crs4/virtuoso-sparql-client/pulls?q=is%3Apr+is%3Aclosed) [![GitHub contributors](https://img.shields.io/github/contributors/crs4/virtuoso-sparql-client.svg)](https://github.com/crs4/virtuoso-sparql-client/graphs/contributors) [![Known Vulnerabilities](https://snyk.io/test/npm/virtuoso-sparql-client/badge.svg?style=flat-square)](https://snyk.io/test/npm/virtuoso-sparql-client) [![npm](https://img.shields.io/npm/l/virtuoso-sparql-client.svg)](https://github.com/crs4/virtuoso-sparql-client/blob/master/LICENSE)

> An HTTP client for a Virtuoso SPARQL endpoint in Node.js.

## Table of contents

- [Install](#install)
- [Usage](#usage)
  - [Query](#query)
  - [Store](#store)
- [Client Query Methods](#client-query-methods)
- [Client Config Methods](#client-config-methods)
- [Client Util Methods](#client-util-methods)
- [Node](#node)
- [Text](#text)
- [Data](#data)
- [Triple Methods](#triple-methods)
- [Triple Getter](#triple-getter)

## Install

```bash
npm install virtuoso-sparql-client [--save]
```

## Usage

### Query

Use the `query()` method of an instantiated `Client` to make a custom query on a SPARQL endpoint:

```js
const {Client} = require('virtuoso-sparql-client');

const DbPediaClient = new Client('http://dbpedia.org/sparql');
DbPediaClient.query('DESCRIBE <http://dbpedia.org/resource/Sardinia>')
  .then((results) => {
    console.log(results);
  })
  .catch((err) => {
    console.log(err);
  });
```

### Store

Use a `LocalTripleStore` with an instantiated `Client` filled with some triples and call the `store()` method to execute insertion, deletions or updates on a SPARQL endpoint.

Note that we describe operations separately but if you prefer you can put Triple instances with **different operations** setted on the same `LocalTripleStore`.

#### Insertion triples

Add triples on the `LocalTripleStore` that will be inserted by the `store()` method.

```js
const {Client, Node, Text, Data, Triple} = require('virtuoso-sparql-client');

const SaveClient = new Client("http://www.myendpoint.org/sparql");
SaveClient.setOptions(
  "application/json",
  {"myprefix": "http://www.myschema.org/ontology/"},
  "http://www.myschema.org/resource/"
);

SaveClient.getLocalStore().add(
  new Triple(
    new Node("http://www.myschema.org/ontology/id123"),
    "dcterms:created",
    new Data(SaveClient.getLocalStore().now, "xsd:dateTimeStamp")
  )
);
SaveClient.getLocalStore().add(
  new Triple(
    "myprefix:id123",
    "rdfs:label",
    new Text("A new lable", "en"),
    Triple.ADD
  )
);

SaveClient.store(true)
.then((result)=>{
  console.log(result)
})
.catch((err) => {
  console.log(err);
});
```

Note that by default every `Triple` is created with the `Triple.ADD` operation setted but it is also possible to be specified as a fourth argument of the constructor.
You can also set this with the `setOperation()` method on a Triple instance.

#### Deletion triples

Add triples on the `LocalTripleStore` that will be deleted by the `store()` method.

```js
const {Client, Node, Text, Data, Triple} = require('virtuoso-sparql-client');

const SaveClient = new Client("http://www.myendpoint.org/sparql");
SaveClient.setOptions(
  "application/json",
  {"myprefix": "http://www.myschema.org/ontology/"},
  "http://www.myschema.org/resource/"
);

SaveClient.getLocalStore().add(
  new Triple(
    "myprefix:id123",
    "rdfs:label",
    new Text("A new lable", "en"),
    Triple.REMOVE
  )
);

SaveClient.store(true)
.then((result)=>{
  console.log(result)
})
.catch((err) => {
  console.log(err);
});
```

#### Update triples

Add triples on the `LocalTripleStore` that will be updated by the `store()` method.

```js
const {Client, Node, Text, Data, Triple} = require('virtuoso-sparql-client');

const SaveClient = new Client("http://www.myendpoint.org/sparql");
SaveClient.setOptions(
  "application/json",
  {"myprefix": "http://www.myschema.org/ontology/"},
  "http://www.myschema.org/resource/"
);

// Update a triple, method one
let updateOne = new Triple(
  "myprefix:id123",
  "rdfs:label",
  new Text("A new label", "en"),
  Triple.UPDATE
);
updateOne.setPrevious(
  new Triple(
    "myprefix:id123",
    "rdfs:label",
    new Text("A new lable", "en"),
  )
);
SaveClient.getLocalStore().add(updateOne);

SaveClient.store(true)
.then((result)=>{
  console.log(result)
})
.catch((err) => {
  console.log(err);
});
```

When updating more than one triple at the same time is needed, the `bulk`  method allows to reduce the total number of queries. It avoids to create a double query for every triple (the first query to remove the old triple and second to insert the new one) but bulks all the triples to remove in a single query and the modified triples that must to be added in the next query. In this way, modifing 20 triples produces just 2 queries, instead of 40.

```js
const {Client, Node, Text, Data, Triple} = require('virtuoso-sparql-client');

const SaveClient = new Client("http://www.myendpoint.org/sparql");
SaveClient.setOptions(
  "application/json",
  {"myprefix": "http://www.myschema.org/ontology/"},
  "http://www.myschema.org/resource/"
);

let updateTwo = new Triple(
  "myprefix:id123",
  "rdfs:label",
  new Text("A new label", "en"),
).update(
  "myprefix:id123",
  "myprefix:label",
  new Text("A very new label", "en")
);
SaveClient.getLocalStore().add(updateTwo);

let updateThree = new Triple(
  "myprefix:id123",
  "rdfs:label",
  new Text("A new label", "en"),
).updateObject(
  new Text("A very new label", "en")
);
SaveClient.getLocalStore().bulk([updateTwo, updateThree]);

SaveClient.store(true)
.then((result)=>{
  console.log(result)
})
.catch((err) => {
  console.log(err);
});
```

## Client Query Methods

### `constructor(endpoint)`

A `new Client()` is constructed using an `endpoint` in `String` format that is the URL of the SPARQL endpoint of Virtuoso (ex. `http://dbpedia.org/sparql`)

```js
new Client("http://www.myendpoint.org/sparql")
```

### `query(queryString, [echo])`

Executes the query, returns a `Promise` that, when resolved, gives the complete result object.

- `queryString` - defines the SPARQL query as a String.
- `echo` (optional) - set to `true` to print query in standard console (default `false`).

### `store([echo])`

Stores locally saved triples (from the `LocalTripleStore`), cache the execution and empty the client `LocalTripleStore`. Returns an array of promises that, when resolved, give the complete result object.

If there are triples in the `LocalTripleStore` with different operations the same operations are **chunked** and executed in the provided **sequential order**.

Note that if the store query is bigger than ~8MB (exactly 8.388.608 byte), or the number of triples is bigger than 1024 (Virtuoso seems to support only 1426 triples per query) it cuts the query in smaller part and stores the parts one by one.

- `echo` (optional) - set to `true` to print query in standard console (default `false`).

### `strip(className, [echo])`

Deletes data from individuals of `rdf:type` `className`.
Does **not remove** statements where the property is `dcterms:created`, `owl:sameAs` or `rdf:type` and where the property is a `owl:hasKey` of `className`.

- `className` - the `rdf:type` of individuals which have to be emptied. Accepts full IRI or prefix:ClassName if the prefix is set in the Client Default or Client Query prefixes.
- `echo` (optional) - set to `true` to print query in standard console (default `false`).

### `different(individuals, [echo])`

Makes individuals different.

- `individuals` - Array of different individuals. Elements can be a full IRI or a prefix:ClassName if the prefix is set in Client Default or Client Query prefixes.
- `echo` (optional) - set to `true` to print query in standard console (default `false`).

### `keys(className, [echo])`

Returns a Promise that, when resolved, gives an Array that contains all the key properties for `className`.

- `className` - the `rdf:type` of Individuals on which the map is created. Accepts full IRI or prefix:ClassName if the prefix is set in Client Default or Client Query prefixes.
- `echo` (optional) - set to `true` to print query in standard console (default `false`).

### `isKey(className, keyProperty, [echo])`

Checks if `keyProperty` is a key for `className`. Returns a Promise that, when resolved, gives a boolean value.

- `className` - the `rdf:type` of Individuals on which the map is created. Accepts full IRI or prefix:ClassName if the prefix is set in Client Default or Client Query prefixes.
- `keyProperty` - the property which becomes the map key. Accepts full IRI or prefix:PropertyName if the prefix is set in Client Default or Client Query prefixes.
- `echo` (optional) - set to `true` to print query in standard console (default `false`).

### `map(className, keyProperty, [recursive], [echo])`

Checks if the axiom `<className> owl:hasKey <keyProperty>` is present, if true, returns a Promise that, when resolved, gives a new `Map` that has the keyProperty values (in lower case) as keys and the related individuals IRIs as values.

- `className` - the `rdf:type` of Individuals on which the map is created. Accepts full IRI or prefix:ClassName if the prefix is set in Client Default or Client Query prefixes.
- `keyProperty` - the property which becomes the map key. Accepts full IRI or prefix:PropertyName if the prefix is set in Client Default or Client Query prefixes.
- `recursive` (optional) - set to `true` to set into the map also the Individuals that are instances of subclasses of `className` (default `false`).
- `echo` (optional) - set to `true` to print query in standard console (default `false`).

## Client Config Methods

### `setDefaultFormat(format)`

Sets the default format for the Client.

- `format` - the format as a String (ex. `application/json`), see [Virtuoso Response Formats](https://virtuoso.openlinksw.com/dataspace/doc/dav/wiki/Main/VOSSparqlProtocol#SPARQL%20Protocol%20Server%20Response%20Formats) for more info.

### `setDefaultPrefixes(prefixes)`

Sets a list of default prefixes for the Client.

- `prefixes` - list of prefixes as an Object.
    ```js
    const prefixes = {
      myprefix: "http://www.myschema.org/ontology/",
      ex: "http://example.org/ontology#"
    };
    ```

### `addPrefixes(prefixes)`

Adds a list of prefixes to default prefixes for the Client.

- `prefixes` - list of prefixes as an Object.
    ```js
    const prefixes = {
      myprefix: "http://www.myschema.org/ontology/",
      ex: "http://example.org/ontology#"
    };
    ```

### `setDefaultDefines(defines)`

Sets a list of default defines for the Client.

- `defines` - list of defines as an Object.
    ```js
    const defines = {
      "input:inference": "urn:owl:inference:rules:tests"
    };
    ```

### `addDefines(defines)`

Adds a list of defines to default defines for the Client.

- `defines` - list of defines as an Object.
    ```js
    const defines = {
      "input:inference": "urn:owl:inference:rules:tests"
    };
    ```

### `setDefaultGraph(graph)`

Sets the default graph for the Client.

- `iri` - the graph iri as a String;

### `setOptions([format], [prefixes], [graph], [defines])`

Sets the default options for the Client

- `format` (optional) - the default format as a String (ex. `application/json`), see [Virtuoso Response Formats](https://virtuoso.openlinksw.com/dataspace/doc/dav/wiki/Main/VOSSparqlProtocol#SPARQL%20Protocol%20Server%20Response%20Formats) for more info (default `application/ld+json`).
- `prefixes` (optional) - list of default prefixes as an Object.
    ```js
    const prefixes = {
      myprefix: "http://www.myschema.org/ontology/",
      ex: "http://example.org/ontology#"
    };
    ```
- `graph` (optional) - the default graph IRI as a String.
- `defines` (optional) - list of default defines as an Object. See [Virtuoso Define Pragmas](http://docs.openlinksw.com/virtuoso/rdfsparqlimplementatioptragmas/) for more info.
    ```js
    const defines = {
      "input:inference": "urn:owl:inference:rules:tests"
    };
    ```

### `setQueryGraph(iri)`

Sets the graph for the query

- `iri` - the graph IRI as a String.

### `setQueryFormat(format)`

Sets a format for the query

- `format` - the format as a String (ex. `application/json`), see [Virtuoso Response Formats](https://virtuoso.openlinksw.com/dataspace/doc/dav/wiki/Main/VOSSparqlProtocol#SPARQL%20Protocol%20Server%20Response%20Formats) for more info.

### `setQueryPrefixes(prefixes)`

Sets a list of prefixes for the query

- `prefixes` - list of prefixes as an Object.
    ```js
    const prefixes = {
      myprefix: "http://www.myschema.org/ontology/",
      ex: "http://example.org/ontology#"
    };
    ```

### `setQueryDefines(defines)`

Sets a list of defines for the query

- `defines` - list of defines as an Object.
    ```js
    const defines = {
      "input:inference": "urn:owl:inference:rules:tests"
    };
    ```

### `setQueryMaxrows(rows)`

Sets a maximum numbers of rows that should be returned by the query

- `rows` - maximum number, note that the Virtuoso maximum default is 10000 rows.

### Virtuoso Supported Parameters

- query
- default-graph-uri
- maxrows

For more info see: [Virtuoso HTTP Request Parameters](https://virtuoso.openlinksw.com/dataspace/doc/dav/wiki/Main/VOSSparqlProtocol#HTTP%20Request%20Parameters)

## Client Util Methods

### `getLocalStore()`

Returns the local store, it is an instance of `LocalTripleStore` class that exports this methods:

- **`getLocalStore().add(triple)`** - add an instance of Triple (`triple`) in the local store.
- **`getLocalStore().bulk(triples)`** - add an array of Triple (`triples`), wich have the same operation type, in the local store.
- **`getLocalStore().empty()`** - cache the triple in the `cache` Array and cleans the local store.
- **`getLocalStore().toTriplePattern()`** - returns the triple pattern `<subject> <predicate> <object>` of each triple as a single String.
- **`getLocalStore().prefixes`** - returns the prefixes object.
- **`getLocalStore().setPrefixes(prefixes)`** - set a new object of prefixes.
- **`getLocalStore().addPrefixes(prefixes)`** - add the prefixes to the local list.
- **`getLocalStore().now`** - returns a string of the JavaScript Date object in the ISO format.
- **`getLocalStore().size`** - return the number of triples.
- **`getLocalStore().last`** - return the last triple in the Array of triples.
- **`getLocalStore().cache`** - return the cache of triples stored divided in blocks of store operations.

The `LocalTripleStore` instances are iterable objects

```js
for (let triple of myClient.getLocalStore()) {
  console.log(triple); // triple is an instance of Triple
}
```

## Node

### `constructor(iri)`

A `new Node()` is constructed using an `iri` as a `String` of a valid IRI.

```js
new Node('http://www.myschema.org/ontology/id123')
```

## Text

### `constructor(value, [language])`

A `new Text()` is constructed using the text itself (`value`) and an optional `language` (default `null`) both as a `String`.

```js
new Text('A new label', 'en')
new Text('A new label', 'en-US')
```

Note that, if used the `language` must be a valid language identifier (RFC 3066), for more info: [xsd:language](http://www.datypic.com/sc/xsd/t-xsd_language.html).

## Data

### `constructor(value, [type])`

A `new Data()` is constructed using the data itself (`value`) and an optional `type` (default `null`) both as a `String`.

```js
new Data(123, 'xsd:integer')
new Data(true, 'xsd:boolean')
new Data(new Date().toISOString(), 'xsd:dateTimeStamp')
```

## Triple Methods

### `constructor(subject, predicate, object, [operation])`

A `new Triple()` is constructed using a `subject`, a `predicate` and a `object` and optionally an operation (default `Triple.ADD`).
Each one of `subject`, `predicate` and `object` can be an instance of `Node`, `Data`, `Text` or simple `String` (in IRI or using `prefix:id` format).

### `getOperation()`

Get the operation String of the `Triple` instance.

### `setOperation(operation)`

Set the `operation` of the `Triple` instance, must be one of `Triple.ADD`, `Triple.REMOVE`, `Triple.UPDATE`.

### `getPrevious()`

Get the previous version of the `Triple` instance (ex. before an update operation).

### `setPrevious(previous)`

Set the `previous` version of the `Triple` instance, must be an instance of Triple and must exist in the Virtuoso endpoint.

### `update([subject], [predicate], [object])`

Transform this triple setting the parameters as new values for subject, predicate and object and the operation as `Triple.UPDATE` and set the original triple as `previous`.

### `updateObject(object)`

A shortcut to `update([subject], [predicate], [object])` when only the object has to be updated.

### `toTriplePattern()`

Returns the triple pattern `<subject> <predicate> <object>` of the `Triple` instance as a String.

## Triple Getter

- **`byteLength`** - get the size in byte of the triple pattern `<subject> <predicate> <object>` String.
- **`ADD`** (static) - get the `ADD` operation String.
- **`REMOVE`** (static) - get the `REMOVE` operation String.
- **`UPDATE`** (static) - get the `UPDATE` operation String.