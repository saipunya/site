// การนำเข้าโมดูลที่ใช้
const express = require('express');
const app = express();
const path = require('path');
const mysql = require('mysql2');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const winston = require('winston');
require('dotenv').config();

// ตั้งค่าการใช้งาน CORS
const corsOptions = {
    origin: '*',  // กำหนดให้ทุกโดเมนสามารถเข้าถึง API ได้ (สามารถเปลี่ยนเป็นโดเมนเฉพาะได้)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// ตั้งค่าการเชื่อมต่อฐานข้อมูล MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// เชื่อมต่อกับฐานข้อมูล MySQL
db.connect((err) => {
    if (err) {
        winston.error('เชื่อมต่อฐานข้อมูลล้มเหลว:', err);
    } else {
        winston.info('เชื่อมต่อฐานข้อมูลสำเร็จ!');
    }
});

// ตั้งค่า multer สำหรับการอัปโหลดไฟล์
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// ตั้งค่าระบบ bodyParser และ cookie
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ตั้งค่าการใช้งาน session
app.use(session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false
}));

// สร้าง logger ของ winston
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'api-server' },
    transports: [
        // บันทึก log ไปที่คอนโซล
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
        // บันทึก log ไปที่ไฟล์
        new winston.transports.File({ filename: 'logs/combined.log' })
    ],
});

// ใช้ logger ในการแสดง log
logger.info('เชื่อมต่อฐานข้อมูลสำเร็จ!');
// ตั้งค่าการใช้งาน view engine (EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

// Middleware เพื่อให้ข้อมูลผู้ใช้พร้อมใช้งานใน view
app.use((req, res, next) => {
    res.locals.user = req.session.user || '';
    res.locals.login = req.session.login || '';
    res.locals.isValid = req.session.isValid || false;
    next();
});

// หน้าแรก (render index.ejs)
app.get('/', (req, res) => {
    res.render('index', { password : req.session.password || '' });
});

// ระบบ login (auth)
app.all('/login', (req, res) => {
    let login = req.body.login || '';
    let password = req.body.password || '';

    if (!login || !password) {
        return res.render('index', { message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    let sql = 'SELECT * FROM tbl_user WHERE use_username = ? AND use_password = ?';
    db.query(sql, [login, password], (err, results) => {
        if (err) {
            logger.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ:', err);
            return res.render('index', { message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
        }

        if (results.length > 0) {
            let user = results[0];
            req.session.user = user;
            req.session.login = login;
            req.session.isValid = true;
            res.redirect('/member');
        } else {
            res.render('index', { message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }
    });
});

// ระบบ logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// หน้า member
app.get('/member', (req, res) => {
    if (res.locals.login) {
        res.render('member');
    } else {
        res.redirect('/');
    }
});

// API ค้นหากฎหมายสหกรณ์
app.get('/api/laws/search', (req, res) => {
    let searchTerm = req.query.name || ''; // รับค่าจาก query string เช่น ?name=กฎหมายการเกษตร

    let sql = `
        SELECT * FROM tbl_laws 
        WHERE law_number LIKE ? OR law_detail LIKE ? OR law_search LIKE ?
        ORDER BY law_id DESC
    `;

    db.query(sql, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`], (err, results) => {
        if (err) {
            logger.error('เกิดข้อผิดพลาดในการค้นหากฎหมายสหกรณ์:', err);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการค้นหากฎหมายสหกรณ์' });
        }
        res.json(results);
    });
});

// API ค้นหากฎหมายกลุ่มเกษตรกร
app.get('/api/glaws/search', (req, res) => {
    let searchTerm = req.query.name || ''; // รับค่าจาก query string เช่น ?name=กฎหมายการเกษตร

    let sql = `
        SELECT * FROM tbl_glaws 
        WHERE glaw_number LIKE ? OR glaw_detail LIKE ? OR glaw_comment LIKE ?
        ORDER BY glaw_id DESC
    `;

    db.query(sql, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`], (err, results) => {
        if (err) {
            logger.error('เกิดข้อผิดพลาดในการค้นหากฎหมายกลุ่มเกษตรกร:', err);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการค้นหากฎหมายกลุ่มเกษตรกร' });
        }
        res.json(results);
    });
});

// ฟัง Port
app.listen(process.env.PORT || 3000, () => {
    logger.info('Server is running on port 3000');
});
