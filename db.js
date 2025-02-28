const mysql = require('mysql2');

// database connection
// สร้างการเชื่อมต่อกับฐานข้อมูล MySQL
const db = mysql.createConnection({
    host: 'localhost',  // เปลี่ยนเป็น host ของคุณ
    user: 'root',       // เปลี่ยนเป็น user ของ MySQL
    password: 'sumet4631022',       // เปลี่ยนเป็น password ของ MySQL
    database: 'naimet' // เปลี่ยนเป็นชื่อ database ของคุณ
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