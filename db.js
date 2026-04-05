const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'restaurant.'//ชื่อต้องเหมือนในXAMPP
});

module.exports = connection;