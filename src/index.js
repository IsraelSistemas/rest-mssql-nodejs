const mssql = require('mssql');

class sqlRest {
    #pool;
    #dbConfig;

    // Handling errors
    #error = {};

    constructor(config) {
        try {
            this.#dbConfig = config;
            
            this.#pool = new mssql.ConnectionPool({
                user: this.#dbConfig.user,
                password: this.#dbConfig.password,
                server: this.#dbConfig.server,
                database: this.#dbConfig.database,
                options: {
                    enableArithAbort: true,
                    encrypt: false
                }
            });
    
            this.#pool.connect(err => {
                if (err) {
                    this.#error = {
                        error: true,
                        type: 'db_connection_error',
                        stack: err.stack,
                        error_message: `Something went wrong when connecting to the database ${this.#dbConfig.database}`                        
                    }                    
                    
                    console.log(this.#error);

                    return;
                }
    
                console.log(`Connection succesfully to the server ${this.#dbConfig.server}`);
            });                
        } catch (err) {
            console.log(err);
        }
    }


    async executeQuery(queryString, paramsData) {
        if (this.handleErrors()) {
            return;
        }

        const request = await this.#pool.request();        

        for (let param of paramsData) {
            request.input(param.name, mssql[param.type], param.value);
        }

        return await request.query(queryString).then(res => {            
            return {
                success: true,
                error: false,                
                data: res.recordset                
            };
        }).catch(err => {
            return {
                success: false,
                error: true,
                errorDetail: err.stack,
                message: err.message
            }
        });
    }

    async executeStoredProcedure(storedProcedure, schema, paramsData) {
        if (this.handleErrors()) {
            return;
        }

        const request = await this.#pool.request();
        const paramsProcedure = await this.getProcedureParams(storedProcedure);
        
        for (let prop in paramsData) {                                            
            paramsProcedure.data[prop].value = paramsData[prop];
            request.input(paramsProcedure.data[prop].name, paramsProcedure.data[prop].type, paramsProcedure.data[prop].value);
        }
                
        return request.execute(`${!schema  ? 'dbo' : schema}.${storedProcedure}`).then(res => {            
            return {
                success: true,
                error: false,                
                data: res.recordset,
                NUMREGISTROS: res.recordset.length >= 1 ? res.recordset[0].NUMREGISTROS : 0
            }
        }).catch(err => {            
            return {
                success: false,
                error: true,
                errorDetail: err.stack,
                message: err.message
            }
        })
    }

    async getProcedureParams(storedProcedure) {
        return this.#pool.request()
            .input('procedure_name', mssql.VarChar, storedProcedure)
            .execute('sp_sproc_columns').then(res => {                
                const params = [];

                for (let record of res.recordset) {
                    if (record.COLUMN_NAME != '@RETURN_VALUE') {
                        const param = record.COLUMN_NAME.replace('@', '');
                        
                        params[param] = {
                            name: param,
                            type: this.getParamProcedureType(record),                            
                            value: this.getParamProcedureDefaultValue(record)
                        }
                    }
                }

                return {
                    success: true,
                    error: false,
                    data: params
                }
        }).catch(err => {
            return {
                success: false,
                error: true,
                errorDetail: err.stack,
                message: err.message
            }
        });
    }

    getParamProcedureType = (record) => {
        let type = null;

        switch (record.TYPE_NAME) {
            case 'bigint':
            case 'int':
            case 'smallint':
            case 'tinyint':
            case 'decimal':
            case 'numeric':
            case 'money':
            case 'smallmoney':
            case 'float':
                type = mssql.Int;
                
                break;
            case 'datetime':
            case 'date':
            case 'time':
                type = mssql.NVarChar;

                break;
            case 'varchar':
            case 'char':
            case 'text':
            case 'nchar':
            case 'nvarchar':
            case 'ntext':
            case 'blob':
                type = mssql.NVarChar;

                break;
            case 'bit':
                type = mssql.Bit;

                break;
        }

        return type;
    }

    getParamProcedureDefaultValue(record) {
        let defaultValue = null;

        if (record.COLUMN_NAME == '@start') {
            defaultValue = 0;
        }

        if (record.COLUMN_NAME == '@limit') {
            defaultValue = 100;
        }

        if (record.COLUMN_NAME == '@page') {
            defaultValue = 1;
        }

        switch (record.TYPE_NAME) {
            case 'bigint':
            case 'int':
            case 'smallint':
            case 'tinyint':
            case 'bit':
            case 'decimal':
            case 'numeric':
            case 'money':
            case 'smallmoney':
            case 'float':
                defaultValue = 0;

                break;
            case 'datetime':
                defaultValue = '1900-01-01 00:00:00';

                break;
            case 'date':
                defaultValue = '1900-01-01';

                break;
            case 'time':
                defaultValue = '00:00:00';

                break;
            case 'varchar':
            case 'char':
            case 'text':
            case 'nchar':
            case 'nvarchar':
            case 'ntext':
            case 'blob':
                defaultValue = '';

                break;        
        }

        return defaultValue;
    }

    handleErrors() {
        let existError = false;

        switch (this.#error.type) {
            case 'db_connection_error':
                existError = true;    

                break;        
        } 

        if (existError) {
            console.log(this.#error.type);
        }

        return existError;
    }
}

module.exports = sqlRest;
