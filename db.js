const mysql = require('mysql2');
require('dotenv').config();
// database connection
// สร้างการเชื่อมต่อกับฐานข้อมูล MySQL
// ตั้งค่าการเชื่อมต่อฐานข้อมูล MySQL
//  การเชื่อมต่อนี้ได้แสดงในไฟล์ server.js แล้ว
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
// เชื่อมต่อกับ MySQL
db.connect((err) => {
    if (err) {
        console.error('เชื่อมต่อฐานข้อมูลล้มเหลว:', err);
    } else {
        console.log('เชื่อมต่อฐานข้อมูลสำเร็จ!');
    }
});

module.exports = db;