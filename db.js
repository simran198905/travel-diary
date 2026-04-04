const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'simran1234',
  database: process.env.DB_NAME || 'travel_diary',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const db = pool.promise();

// Test connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('Make sure MySQL is running and the database "travel_diary" exists.');
    console.log('Run the schema.sql file to set up the database.');
  } else {
    console.log('✅ Database connected successfully');
    connection.release();
  }
});

module.exports = db;