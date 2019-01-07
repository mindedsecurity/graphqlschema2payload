# graphqlschema2payload
This little piece of software helps to recreate GraphQL payloads from a GraphQL Schema. 
It works by visiting the Schema and resolving all types.
Its main purpose is to create tests that can be used for QA or pentesting.

## Install

```
npm install 
```

## Server Version 

The server version integrates [GraphiQL](https://github.com/graphql/graphiql) interface and populates the editor with an automatically 
generate template from the schema.

1. Launch the server:
```npm start```

2. Visit http://localhost:4000/

3. Add the remote URL and optional Headers (Ie. Authorization Bearer) separated by lines (eg. https://bahnql.herokuapp.com/graphql).
![image](https://user-images.githubusercontent.com/1196560/50766648-50a7e000-127a-11e9-859f-d246cda20c16.png)

4. Click Continue in order to let GraphiQL fetch the Schema via the local server. Local server also instantiates GSchema which automatically extracts templates from gqlSchema.

5. Use the dropdown menus *Query* and *Mutations* to populate the editor with a specific template.

![image](https://user-images.githubusercontent.com/1196560/50769657-ecd6e480-1284-11e9-8722-26926dafa92f.png)

6. Edit the template with the arguments.

7. Execute the query and get the response from the remote URL.

![image](https://user-images.githubusercontent.com/1196560/50769782-6373e200-1285-11e9-8786-f1320a030bdc.png)


## CLI Version Usage:

The CLI version helps exploring the GQL Schema. 

```
Usage: node ./index.js [-r] [-q] [-m] [-a] [-f filename_schema]|[[-p] -u http://URL [-H 'NAME1=VALUE1|NAME2=VALUE2']] [action_name]
  -q : prints all queries
  -m : prints all mutations
  -f : schema path 
  -a : print all actions
  -u : url to download grapql schema
  -H : Header to add. Use format like NAME1=VALUE1|NAME2=VALUE2 for multiple pairs
  -p : print downloaded schema [to save it somewhere use redirection >/output_schema.json ]
  -r : prints the POST payload to be used as template for testing - NB: No Arguments Value Given user needs to add them by hand -

```

eg. download one of https://github.com/APIs-guru/graphql-voyager/tree/master/demo/presets/	
```
node index.js -f ./sample_schemas/graphbrainz.json.json -a
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
