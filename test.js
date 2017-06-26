const {Client, LocalTripleStore, Triple, Value, Text, Data, Node} = require("./index")


TestClient = new Client("http://localhost:8890/sparql");
TestClient.setDefaultPrefixes(
  {"toti": "https://w3id.org/toti/"}
);
TestClient.setDefaultGraph("https://w3id.org/toti");


// TestClient.map("toti:Country", "toti:countryCodeISO3166-33", false, true)
// .then(console.log)
// .catch(console.log);

// TestClient.isKey("toti:Country", "toti:countryCodeISO3166-3", true)
// .then(console.log)
// .catch(console.log);

// TestClient.keys("toti:Country", true)
// .then(console.log)
// .catch(console.log);

// TestClient.strip("toti:Country", false)
// .then((result) => {
//   console.log(JSON.stringify(result))
// })
// .catch(console.log);

// TestClient.different(["aaaa", "bbbb"], true)
// .then((result) => {
//   console.log(JSON.stringify(result))
// })
// .catch(console.log);


SaveClient = new Client("http://localhost:8890/sparql");
SaveClient.setOptions(
  "application/json",
  {},
  "TEST"
);

SaveClient.getLocalStore().add(
  new Triple(
    new Node("ciao"),
    "rdfs:label",
    new Text("(из/ житель) Ангильи", "CZ")
  )
);
SaveClient.store(true)
.then((result)=>{
  console.log(JSON.stringify(result))
})
.catch(console.log)
