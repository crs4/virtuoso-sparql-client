const firstTest = () => {
  const { Client } = require("./index");

  let DbPediaClient = new Client("http://dbpedia.org/sparql");
  DbPediaClient.query("DESCRIBE <http://dbpedia.org/resource/Sardinia>")
    .then((results) => {
      console.log(results);
    })
    .catch(console.log);
};

const secondTest = () => {
  const { Client, Node, Text, Data, Triple } = require("./index");

  SaveClient = new Client("http://localhost:8890/sparql");
  SaveClient.setOptions(
    "application/json",
    { "myprefix": "http://www.myschema.org/ontology/" },
    "http://www.myschema.org/resource/"
  );

  SaveClient.getLocalStore().add(
    new Triple(
      "myprefix:id123",
      "dcterms:created",
      new Data(SaveClient.getLocalStore().now, "xsd:dateTimeStamp")
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
    .then((result) => {
      console.log(JSON.stringify(result))
    })
    .catch(console.log);
};

//firstTest();
/*
  {
    '@graph': [
      {
        '@id': 'http://dbpedia.org/resource/Overseas_constituencies_of_Italian_Parliament',
        'http://dbpedia.org/ontology/wikiPageWikiLink': []
      },
      {
        '@id': 'http://dbpedia.org/resource/Francesco_Boffo',
        'http://dbpedia.org/ontology/wikiPageWikiLink': []
      },
      {
        '@id': 'http://dbpedia.org/resource/1016',
        'http://dbpedia.org/ontology/wikiPageWikiLink': []
      },
      {
        '@id': 'http://dbpedia.org/resource/1049',
        'http://dbpedia.org/ontology/wikiPageWikiLink': []
      },
      {
        '@id': 'http://dbpedia.org/resource/1133',
        'http://dbpedia.org/ontology/wikiPageWikiLink': []
      }
    ]
  }
*/

//secondTest();
/*
  [
    {
      "head": {
        "link": [],
        "vars": [
          "callret-0"
        ]
      },
      "results": {
        "distinct": false,
        "ordered": true,
        "bindings": [
          {
            "callret-0": {
              "type": "literal",
              "value": "Insert into <http://www.myschema.org/resource/>, 3 (or less) triples -- done"
            }
          }
        ]
      }
    }
  ]
*/