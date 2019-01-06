'use strict';

var readFileSync = require('fs').readFileSync

exports.renderGraphiQL = renderGraphiQL;

// Current latest version of GraphiQL.
var GRAPHIQL_VERSION = '0.12.0';

// Ensures string values are safe to be used within a <script> tag.
/**
 *  Copyright (c) 2015-present, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 *   strict
 */

function safeSerialize(data) {
  return data ? JSON.stringify(data).replace(/\//g, '\\/') : 'undefined';
}

/**
 * When express-graphql receives a request which does not Accept JSON, but does
 * Accept HTML, it may present GraphiQL, the in-browser GraphQL explorer IDE.
 *
 * When shown, it will be pre-populated with the result of having executed the
 * requested query.
 */
function renderGraphiQL(data) {
  var queryString = data.query;
  var variablesString = data.variables ? JSON.stringify(data.variables, null, 2) : null;
  var resultString = data.result ? JSON.stringify(data.result, null, 2) : null;
  var operationName = data.operationName;
  
  return readFileSync('./view/index.html').toString().replace(/\$\{GRAPHIQL_VERSION\}/g,GRAPHIQL_VERSION);
}