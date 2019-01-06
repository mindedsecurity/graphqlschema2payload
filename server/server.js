'use strict';

var express = require('express');
var bodyParser = require('body-parser')

var gschema = require('../gschema.js');

var fetch = require('node-fetch');


var _renderGraphiQL = require('./renderGraphiQL');


var gschema_obj;

var app = express();

app.use('/static', express.static(__dirname + '/public'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true
}))

// parse application/json
app.use(bodyParser.json(
{limit: '50mb'}
  ));


/**
 * All information about a GraphQL request.
 */

function graphqlMiddleware(request, response) {
  
  var query = void 0;
  var variables = void 0;
  var operationName = void 0;

  var result = {
    data: {}
  }

  var payload = (0, _renderGraphiQL.renderGraphiQL)({
    query: query,
    variables: variables,
    operationName: operationName,
    result: result
  });
  return sendResponse(response, 'text/html', payload);
}

/**
  Fetcher for the GraphQL Schema that will be used by GSchema.
  This is a solution using GSchema on the server side that simplifies the whole implementation (aka Quick and dirty :>).
*/
function schemaFetcher(req, res) {
  var remote_schema = req.body.remote_url;
  var additional_headers = req.body.headers && JSON.parse(req.body.headers);
  var data = req.body;
  var headers = {
    'Content-Type': 'application/json'
  }
  if (additional_headers) {
    Object.getOwnPropertyNames(additional_headers).forEach(key => {
      headers[key] = additional_headers[key]
    })
  }

  fetch(remote_schema, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      "query": gschema.introspectionQuery
    })
  }).then(response => {
    if (response.status === 200)
      return response.json();
    else {
      throw Error('Status: ' + response.status);
    }
  }).then(text => {
    gschema_obj = new gschema(text);
    var response_obj = JSON.stringify({
      "queries": Object.keys(gschema_obj.get_queries()),
      "mutations": Object.keys(gschema_obj.get_mutations())
    });
    sendResponse(res, "application/json", response_obj);
  }).catch(err => sendResponse(res, "text/plain", err + ''));
}

/**
  Fetcher for the GraphQL Schema that will be used by GSchema.
  This is a solution using GSchema on the server side that simplifies the whole implementation (aka Quick and dirty :>).
*/
function queryFetcher(req, res) {
  var query_name = req.query.name;
  if(!gschema_obj){
    return res.end("No Schema");
  }
  res.end(gschema_obj.build_query(query_name));
}


/**
  Proxy function to execute requests on remote GraphQL Server
*/
function remoteFetcher(req, res) {
  var remote_schema = req.query.remote_url;
  var additional_headers = req.query.headers && JSON.parse(req.query.headers);
  var data = req.body;
  var headers = {
    'Content-Type': 'application/json'
  }
  if (additional_headers) {
    Object.getOwnPropertyNames(additional_headers).forEach(key => {
      headers[key] = additional_headers[key]
    })
  }
  
  fetch(remote_schema, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(data)
  }).then(response => {
    if (response.status === 200)
      return response.text();
    else {
      throw Error('Status: ' + response.status);
    }
  }
  ).then(text => sendResponse(res, "application/json", text)).catch(err => sendResponse(res, "application/data", err + ''));
}

/**
 * Helper function for sending a response using only the core Node server APIs.
 */
function sendResponse(response, type, data) {
  var chunk = new Buffer(data, 'utf8');
  response.setHeader('Content-Type', type + '; charset=utf-8');
  response.setHeader('Content-Length', String(chunk.length));
  response.end(chunk);
}

app.get('/', graphqlMiddleware);
app.get('/gschema/queryFetcher', queryFetcher);
app.post('/gschema/schemaFetcher', schemaFetcher);
app.post('/fetcher', remoteFetcher);
app.listen(4000, () => console.log('Express GraphQL Server Now Running On localhost:4000/'));

