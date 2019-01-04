var debug = function() {};
if (process.env.DEBUG) {
  debug = function() {
    console.debug.apply(console, arguments)
  }
}
var gql = require('graphql');
var introspectionQuery = require('graphql/utilities/introspectionQuery.js');
var gqdef = require('graphql/type/definition')
var {buildClientSchema, buildSchema} = require("graphql/utilities");
var {visit, visitWithTypeInfo} = require('graphql/language/visitor');
var {parse} = require('graphql/language/parser');


var isNamedType = function(obj, name) {
  if (obj && gql[`GraphQL${name}Type`]) {
    typeConstructor = gql[`GraphQL${name}Type`];
    if (obj.type) {
      if (obj.type.constructor === typeConstructor
        || (obj.type.ofType && obj.type.ofType.constructor === typeConstructor)) {
        return true;
      }
    } else {
      if (obj.constructor === typeConstructor) {
        return true;
      }
    }
  }
  return false;
}
var isGQScalar = function isGQScalar(obj) {
  return isNamedType(obj, 'Scalar');
}

var isGQEnum = function isGQEnum(obj) {
  return isNamedType(obj, 'Enum');
}

var isGQObject = function isGQObject(obj) {
  return isNamedType(obj, 'Object');
}

var isGQType = function isGQType(type) {
  return (isScalarType(type)
    || isObjectType(type)
    || isEnumType(type)
    || isInputObjectType(type)
  //  || isListType(type)
  //|| isInterfaceType(type) 
  //|| isUnionType(type)
  //|| isNonNullType(type)
  );
}

function isScalarType(type) {
  return type instanceof gql.GraphQLScalarType;
}
function isObjectType(type) {
  return type instanceof gql.GraphQLObjectType;
}
function isEnumType(type) {
  return type instanceof gql.GraphQLEnumType;
}
function isInputObjectType(type) {
  return type instanceof gql.GraphQLInputObjectType;
}


function printTopCall(query_name,query_arguments,content){
  return `\n{\n ${query_name} ${query_arguments} {\n${content} }\n}`;
}

var GSchema = function(SCHEMA) {
  try {
    // Get SCHEMA from JSON.
    if (typeof (SCHEMA.data) !== 'undefined' && SCHEMA.data.__schema) {
      this._internal_schema = SCHEMA.data.__schema;
    } else {
      this._internal_schema = SCHEMA.__schema;
    }

    // Get SCHEMA from JSON.
    if (typeof (SCHEMA.data) !== 'undefined') {
      SCHEMA = SCHEMA.data
    }
    this.schema = buildClientSchema(SCHEMA)
  } catch (e) {
    console.log(e)
    this.schema = buildSchema(SCHEMA);
  }
  /*
  // Get SCHEMA from JSON.
  if (typeof (SCHEMA.data) !== 'undefined' && SCHEMA.data.__schema) {
    this.schema = SCHEMA.data.__schema
  } else {
    this.schema = SCHEMA.__schema
  }*/

}

GSchema.introspectionQuery = introspectionQuery.introspectionQuery;
GSchema.prototype.getGQType = function(obj) {
  var tmp_type = obj;
  var tmp_oftype = obj.type;
  if (isGQType(tmp_oftype)) {
    tmp_type = this.schema.getType(tmp_oftype.name);
  } else {
    while ( /*!tmp_type && */ tmp_oftype.ofType) {
      tmp_oftype = tmp_oftype.ofType;
      tmp_type = this.schema.getType(tmp_oftype.name);
    }
  }
  return tmp_type;
}

// GSchema.prototype.get_types = function get_types() {
//   return this.schema.getTypeMap();
// }
//
// GSchema.prototype.get_scalar_types = function get_scalar_types() {
//   return this.get_types().filter(e => {
//     if (e.kind === 'SCALAR' || e.kind === 'ENUM') return e.name
//   }).map(e => e.name);
// }

/***
 returns getters

*/
GSchema.prototype.get_queries = function get_queries() {
  const query = this.schema.getQueryType();
  return query && query.getFields() || {};
}

/***
 returns setters 
*/
GSchema.prototype.get_mutations = function get_mutations() {
  const mutation = this.schema.getMutationType()
  return mutation && mutation.getFields() || {};
}

GSchema.prototype.get_type = function get_type(type_obj) {
  var typename = type_obj;
  if (typeof typename !== 'string' && typename.name) {
    typename = typename.name;
  }
  if (typeof typename === 'string') {
    var tmp_type = this.schema.getType(typename);
    if (!tmp_type && type_obj.type) {
      tmp_type = this.getGQType(type_obj);
    }
    return tmp_type;
  }
  else
    return typename;
}
var str = '';


GSchema.prototype.print_arguments = function print_arguments(field_object) {
  return (field_object.args && field_object.args.length > 0 ? '(' + field_object.args.map(el => {
    var constructorName;
    if (el.type) {
      var required = (el.type+'').endsWith('!');
      var inferred_type = this.getGQType(el);
      if (el.type.constructor.name.indexOf('Type') !== -1) {
        constructorName = el.type.constructor.name;
      }
      if (el.type.ofType && el.type.ofType.constructor.name.indexOf('Type') !== -1) {
        constructorName = el.type.ofType.constructor.name
      }
    }
    if (constructorName === 'GraphQLInputObjectType') {
      if (el.type._fields) {
        constructorName += el.type + ' ' + JSON.stringify(el.type._fields, null, 2);
      } else if (el.type && el.type.ofType) {
        constructorName += JSON.stringify(el.type.ofType._fields, null, 2);
      }

    }
    return el.name + ` #${required?"[Required]":""} ${inferred_type.name} \n`
  }) + ')' : '');
}


GSchema.prototype.expand_type = function expand_type(type, level) {
  level = level || 1;
  var tabs = ' '.repeat(level)
  var tmp_type = this.get_type(type);

  if (!tmp_type) {
    return;
  }
  if (this.visited_types.indexOf(tmp_type.name) !== -1) {
    str += `${tabs}# ${tmp_type.name} type circular object, already expanded\n`;
    return;
  }

  this.visited_types.push(tmp_type.name);

  if ( /*!isGQObject(tmp_type) &&*/ tmp_type.getFields) {
    var fields_obj = tmp_type.getFields();

    Object.keys(fields_obj).forEach(field_key => {
      var field_object = fields_obj[field_key];
      var inferred_type = this.getGQType(field_object)

      if (isGQEnum(field_object)) {
        debug("ENUM!", field_object + '<<<');
        str += `${tabs}${field_object.name} #ENUM -> ${inferred_type.getValues().map(el => {
          return `${tabs} # ${el.name}\n`
        }).join('')}`;
      } else if (isGQScalar(field_object)) {
        debug("!", field_object.name + '>>>>>>>>>>>>>>>>>>>>>>>>>>');
        
        str += `${tabs}${field_object.name} #type: ${inferred_type.name}\n`;
      } else /* if (isGQObject(field_object))*/ {
        debug("OBJECT!, entering in..", field_object)
        str += `${tabs}${field_object.name} ${this.print_arguments(field_object)} {\n`;
        if (inferred_type)
          var tmp = this.expand_type(field_object, ++level);
        str += `${tabs}}\n`;
      }

    })
  } else if (isGQEnum(tmp_type)) {
    str += tmp_type.getValues().map(el => {
      return `${tabs} # ${el.name}\n`;
    }).join('')
    debug("ENUMERATION>> ", tmp_type + '<<<')
    return
  } else {
    debug("OTHER      >> ", tmp_type + '<<<')
  }
//return "IL CONTENUTO";
}

GSchema.prototype.build_query = function build_query(name) {
  var q_content = this.get_queries()[name];
  if(!q_content){ 
    return this.build_mutation(name);
  }
  return this.build_entry(q_content);
}

GSchema.prototype.build_entry = function build_entry(q_content) {
    this.visited_types = [];
  //console.log(q_content)
  if (!q_content) {
    console.error(`Error: Can't find ${name} in this graphql Schema`);
    return "";
  }

  if (true /*q_content.args && q_content.args.length === 0*/ ) {
    this.expand_type(q_content, 2);
    // var q_string = `\n{\n ${q_content.name} ${this.print_arguments(q_content)} {\n${str} }\n}`;
    var q_string = printTopCall(q_content.name,this.print_arguments(q_content),str);
    str = '';
    return q_string;
  }
};

GSchema.prototype.build_mutation = function build_mutation(name) {
  var q_content = this.get_mutations()[name];
  return 'mutation ' + this.build_entry(q_content);
};

GSchema.prototype.build_queries = function build_query() {
  return Object.keys(this.get_queries()).map(e => this.build_query(e))
    .concat(Object.keys(this.get_mutations()).map(e => this.build_mutation(e)));
};
module.exports = GSchema;
