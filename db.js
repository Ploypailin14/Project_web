const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.MYSQLHOST || 'localhost',
    port: process.env.MYSQLPORT || 3306,
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'restaurant_update2'
});

connection.connect((err) => {
    if (err) {
        console.error('❌ MySQL connection failed:', err.message);
        return;
    }

    console.log('✅ MySQL connected successfully');
});

module.exports = connection;