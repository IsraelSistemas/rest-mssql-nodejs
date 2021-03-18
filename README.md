# rest-mssql-nodejs

The purpose of this library is behave as wrap of the mssql package with only two methods to simplify it.

# Features!

  - Create an instance of MS SQL 
  - Execute queries with/without parameters and get the data
  - Get all parameters of a procedure with each data type only for fill
  - Execute stored procedures with/without parameters and get the data
  - Allow retrieve one or multiple result sets



### Installation

```sh
$ cd your_project
$ npm install --save rest-mssql-nodejs
```

### Accepted data types

  - tinyint
  - smallint
  - int
  - bigint
  - decimal
  - numeric
  - float
  - money
  - smallmoney
  - datetime
  - date
  - time
  - varchar
  - char
  - text
  - nchar
  - nvarchar
  - ntext
  - blob
  - bit

### Methods
| executeQuery (queryString, paramsData) |                                                                       |                                                              |
|----------------------------------------------|-----------------------------------------------------------------------|--------------------------------------------------------------|
| Parameter1: queryString                      | Query is going to be executed                                         | Example without parameter: select * from your_table;...; Example with parameter: select * from your_table where id = @id                      |
| Parameter2: paramsData (optional)      | Array of objects with the property: value is going to fill the params | Example: [{ name: 'id', type: 'Int', value: 1 }] |


| executeStoredProcedure (storedProcedure, schema, paramsData) |                                                                         |                          |
|--------------------------------------------------------------------|-------------------------------------------------------------------------|--------------------------|
| Parameter1: storedProcedure                                        | The stored procedure name you want to execute                           |                          |
| Parameter2: schema (optional)                                | If you are using a different schema, specify it here                    |                          |
| Parameter3: paramsData (optional)                            | Object with the property: value as your stored procedure is waiting for | Example: { id: 1 } |


### Usage

```js
/**
instance the class and pass the database config to the constructor 
you can declare this constant in the main file of your project and export it to use it in other files
**/
// filename: index.js
const rest = new (require('rest-mssql-nodejs'))({
    user: 'db_username',
    password: 'db_password',
    server: 'localhost', // replace this with your IP Server
    database: 'db_name',
    port: 1433, // this is optional, by default takes the port 1433
    options: { 
        encrypt: true // this is optional, by default is false
    } 
});

module.exports = {
    rest
}

// filename: controller.js
const { rest } = require('../../index.js');

// how to execute a query without parameters
const result = await rest.executeQuery(
    'select * from your_table'
);

// how to execute a query with parameters
const result = await rest.executeQuery(
`
    select 
        *
    from your_table 
    where (
        @id = 0 or id_id = @id
    )
    `,
    [{
        name: 'id',
        type: 'Int',
        value: 1
    }]
);

// print the result
console.log("QUERY RESULT: ", result.data);
//----------

// how to execute a stored procedure without parameters
const result = await rest.executeStoredProcedure('spName');

// how to execute a stored procedure with parameters
const result = await rest.executeStoredProcedure('spName', null, {
    id: 1
});

//print the result
console.log("STORED PROCEDURE RESULT: ", result.data);
```

License
----

MIT
