Simple SPARQL HTTP Client library for Node.js
=============================================

Getting Started
--------------------

### Install

    npm install sparql-simple-client

### Use

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


Core API
--------------------

### query

    Returns the complete results object, its format depends on request header in the opts object.
    Opts object defines:
      uri: "",        // To change the default Client endpoint
      headers: {},
      encoding: '',   // Default: utf8
      prefixes: {}    // To override the default Client prefixes
