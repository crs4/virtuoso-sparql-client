const {Client, Node, Text, Data, Triple} = require('./index');

SaveClient = new Client("http://tzuccuru.crs4.it:8890/sparql");
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
    "owl:sameas",
    new Node("http://dbpedia.org/resource/Sardinia")
  )
);
SaveClient.store(true)
.then((result)=>{console.log(JSON.stringify(result))})
.catch(console.log);
