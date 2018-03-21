const SELECT = "select";
const ASK = "ask";
const CONSTRUCT = "construct";
const DESCRIBE = "describe";

const JSON_TYPES = [
  'application/json',
  'application/sparql-results+json',
  'application/odata+json',
  'application/microdata+json',
  'application/rdf+json',
  'application/x-rdf+json',
  'application/x-json+ld',
  'application/ld+json'
];

const DONOT_STRIP = ["dcterms:created", "rdf:type", "owl:sameAs"];

const VALID_QUERY_TYPES = {
  'application/sparql-results+xml' : [SELECT, ASK],
  'text/rdf+n3' : [SELECT, ASK, CONSTRUCT, DESCRIBE],
  'text/rdf+ttl' : [SELECT, ASK, CONSTRUCT, DESCRIBE],
  'text/rdf+turtle' : [SELECT, ASK, CONSTRUCT, DESCRIBE],
  'text/turtle' : [SELECT, ASK, CONSTRUCT, DESCRIBE],
  'text/n3' : [SELECT, ASK, CONSTRUCT, DESCRIBE],
  'application/turtle' : [SELECT, ASK, CONSTRUCT, DESCRIBE],
  'application/x-turtle' : [SELECT, ASK, CONSTRUCT, DESCRIBE],
  'application/x-nice-turtle' : [SELECT, ASK, CONSTRUCT, DESCRIBE],
  'text/rdf+nt' : [SELECT],
  'text/plain' : [SELECT],
  'text/ntriples' : [SELECT, CONSTRUCT, DESCRIBE],
  'application/x-trig' : [SELECT, CONSTRUCT, DESCRIBE],
  'application/rdf+xml' : [SELECT, CONSTRUCT, DESCRIBE],
  'application/soap+xml' : [SELECT],
  'application/soap+xml;11' : [SELECT],
  'text/html' : [SELECT],
  'text/md+html' : [SELECT, CONSTRUCT, DESCRIBE],
  'text/microdata+html' : [SELECT, CONSTRUCT, DESCRIBE],
  'text/x-html+ul' : [SELECT, CONSTRUCT, DESCRIBE],
  'text/x-html+tr' : [SELECT, CONSTRUCT, DESCRIBE],
  'application/vnd.ms-excel' : [SELECT],
  'text/csv' : [SELECT, CONSTRUCT, DESCRIBE],
  'text/tab-separated-values' : [SELECT],
  'application/javascript' : [SELECT],
  'application/json' : [SELECT],
  'application/sparql-results+json' : [SELECT, ASK],
  'application/odata+json' : [SELECT, ASK, CONSTRUCT, DESCRIBE],
  'application/microdata+json' : [SELECT, CONSTRUCT, DESCRIBE],
  'application/rdf+json'	: [CONSTRUCT, DESCRIBE],
  'application/x-rdf+json'	: [CONSTRUCT, DESCRIBE],
  'application/x-json+ld'	: [CONSTRUCT, DESCRIBE],
  'application/ld+json'	: [CONSTRUCT, DESCRIBE],
  'text/cxml' : [SELECT, CONSTRUCT, DESCRIBE],
  'text/cxml+qrcode' : [SELECT,CONSTRUCT, DESCRIBE],
  'application/atom+xml' : [SELECT, CONSTRUCT, DESCRIBE],
  'application/xhtml+xml' : [SELECT]
};

const DEFAULT_PREFIXES = {
  owl	      : "http://www.w3.org/2002/07/owl#",
  rdf	      : "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  rdfs      : "http://www.w3.org/2000/01/rdf-schema#",
  xsd       : "http://www.w3.org/2001/XMLSchema#",
  dcterms   : "http://purl.org/dc/terms/",
  op        : "local:operation:"
};

const UPDATE_TYPES = {
  add: "op:add",
  remove: "op:delete",
  update: "op:update"
};

module.exports = {VALID_QUERY_TYPES, DEFAULT_PREFIXES, JSON_TYPES, DONOT_STRIP, UPDATE_TYPES};
