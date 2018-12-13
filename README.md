# graphqlschema2payload
This sw gets a GraphQL Schema and is creates queries by resolving types in order to create tests
that can be used for QA or pentesting.

## Install

```
npm install 
```

## Usage:

At the moment it is expected to already have downloaded a schema via introspection.
```
Usage: ./index.js [-q] [-m] [-a] [-f filename_schema]|[[-p] -u http://URL [-H 'NAME1=VALUE1|NAME2=VALUE2']] [action_name]
  -q : prints all queries
  -m : prints all mutations
  -f : schema path 
  -a : print all actions
  -u : url to download grapql schema
  -H : Header to add. Use format like NAME1=VALUE1|NAME2=VALUE2 for multiple pairs
  -p : print downloaded schema [to save it somewhere use redirection >/output_schema.json ]


```

eg. download one of https://github.com/APIs-guru/graphql-voyager/tree/master/demo/presets/	
```
node index.js -f ./mydownloadedgqlschema.json -a
```

eg. Download Schema using introspection and print all query names:
```
node index.js -u 'https://api.github.com/graphql' -H 'Authorization= bearer TOKEN' -q
```  

# Examples 
http://apis.guru/graphql-apis/

# TODO
- add compatibility to previous graphql versions.
EG. :
```
https://pokeapi-graphiql.herokuapp.com/

``` 
s