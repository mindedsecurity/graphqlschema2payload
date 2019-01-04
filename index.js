var DEBUG=process.env.DEBUG
var repl = require('repl')

var fetch = require('node-fetch')
var gschema = require("./gschema");

const fs = require('fs');
/*
Minimal cli argument parser 
# get_argument("-x") > true||false
# get_argument("-f:") > next parameter||false

*/
function get_argument(name) {
  var args = process.argv;
  if (name.endsWith(':')) {
    name = name.slice(0, -1);
    var expectArg = true;
  }
  var index = args.indexOf(name);
  if (index !== -1) {
    args.splice(index, 1);
    if (!expectArg) {
      return true;
    } else {
      return args.splice(index, 1)[0];
    }
  }
  return false;
}


var args = process.argv;
var show_queries = get_argument("-q");
var show_mutations = get_argument("-m");
var print_all = get_argument("-a");
var execute_request = get_argument("-r");
var file_schema = get_argument('-f:');
var remote_schema = get_argument('-u:');
var print_schema = get_argument("-p");
var header = get_argument('-H:');
if (get_argument("-h") || (!file_schema && !remote_schema)) {
  console.log(`Usage: ${args[1]} [-q] [-m] [-a] [-f filename_schema]|[[-p] -u http://URL [-H 'NAME1=VALUE1|NAME2=VALUE2']] [action_name]
  -q : prints all queries
  -m : prints all mutations
  -f : schema path 
  -u : url to download grapql schema
  -H : Header to add. Use format like NAME1=VALUE1|NAME2=VALUE2
  -a : print all actions
  -p : print downloaded schema [to save it somewhere use redirection >/output_schema.json ]
  -r : prints the POST payload to be used as template for testing - NB: No Arguments Value Given user needs to add them by hand -
`);
  process.exit()
}
(async function() {
  if (file_schema) {
    try {
      var SCHEMA = JSON.parse(fs.readFileSync(file_schema) + '');
    } catch (e) {
      console.error("Error:", e);
      //process.exit()
      var SCHEMA = fs.readFileSync(file_schema) + '';
    }
  } else if (remote_schema) {
    var headers = {
      'Content-Type': 'application/json'
    }
    if (header) {
      header.split('|').reduce((acc, el) => {
        var pair = el.split('=');
        acc[pair[0]] = pair[1]
        return acc;
      }, headers);
    }
    response = await fetch(remote_schema, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({"query":gschema.introspectionQuery})
  });
    SCHEMA = await response.json();
    if(print_schema)
      console.log(JSON.stringify(SCHEMA,null,2))
    SCHEMA = SCHEMA;
  }

  var g = new gschema(SCHEMA);

  if (show_queries) {
    console.log(Object.keys(g.get_queries()))
  }
  if (show_mutations) {
    console.log(Object.keys(g.get_mutations()))
  }
  if (print_all) {
    console.log(g.build_queries().join('\n'));
  }
  if(args[2] && execute_request){
    const payload = JSON.stringify({variables: null,query:g.build_query(args[2])},null, 2);
    console.log(payload);
    process.exit(1);
  }
  if (args[2])
    console.log(g.build_query(args[2]));
})();