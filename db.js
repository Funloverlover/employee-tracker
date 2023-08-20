const mysql = require('mysql2');

module.exports = mysql.createConnection(
    {
        user: 'root',
        password: '',
        host: 'localhost',
        database: 'company_db'
    },
    console.log(`Connected to database`)
);
