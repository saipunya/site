const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const winston = require('winston');
const dotenv = require('dotenv');  // เพิ่มการนำเข้า dotenv
dotenv.config();  // โหลดไฟล์ .env

const app = express();

// ✅ ตั้งค่า CORS
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));

// ✅ เชื่อมต่อฐานข้อมูล MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
});

// ตรวจสอบการเชื่อมต่อ
db.connect((err) => {
  if (err) {
    console.error('❌ เชื่อมต่อฐานข้อมูลล้มเหลว:', err);
    process.exit(1);
  }
  console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ!');
});

// ตั้งค่า Multer สำหรับอัปโหลดไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ตั้งค่าระบบ Middleware
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: 'my secret', resave: false, saveUninitialized: false }));

// ตั้งค่า Logger ด้วย winston
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir); // Create log directory if it doesn't exist
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: `${logDir}/combined.log` })],
});

// View Engine (EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

// Middleware สำหรับใช้งาน session ใน view
app.use((req, res, next) => {
  res.locals.user = req.session.user || '';
  res.locals.login = req.session.login || '';
  res.locals.isValid = req.session.isValid || false;
  next();
});

// หน้าแรก
app.get('/', (req, res) => {
  res.render('index', { password: req.session.password || '' });
});

// ระบบ Login
app.all('/login', async (req, res) => {
  try {
    let { login, password } = req.body;
    if (!login || !password) return res.render('index', { message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });

    let sql = 'SELECT * FROM tbl_user WHERE use_username = ? AND use_password = ?';
    db.query(sql, [login, password], (err, results) => {
      if (err) {
        logger.error('❌ Login Error:', err);
        return res.render('index', { message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
      }

      if (results.length > 0) {
        let user = results[0];
        req.session.user = user;
        req.session.login = login;
        req.session.isValid = true;
        return res.redirect('/member');
      } else {
        req.session.isValid = false;
        res.render('index', { message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      }
    });
  } catch (error) {
    logger.error('❌ Login Exception:', error);
    res.render('index', { message: 'เกิดข้อผิดพลาด' });
  }
});

// ระบบ Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// หน้า Member
app.get('/member', (req, res) => {
  console.log("Session data:", req.session);
  if (!req.session.isValid) return res.redirect('/');
  res.render('member', { 
    login: req.session.login,
    user: req.session.user || {},
    password: req.session.password || '',
    isValid: req.session.isValid
  });
});

// หน้า ทดสอบ Create
app.get('/create', (req, res) => {
  res.render('create', { user: req.session.user || {}, password: req.session.password || '' });
});

// ติดต่อเรา
app.get('/contact', (req, res) => {
  res.render('contact', { user: req.session.user || {}, password: req.session.password || '' });
});

app.get('/privacy', (req, res) => {
  res.render('privacy', { user: req.session.user || {}, password: req.session.password || '' });
});

// API ค้นหากฎหมายสหกรณ์
app.get('/api/laws/search', (req, res) => {
  let searchTerm = req.query.name || '';
  let sql = `SELECT * FROM tbl_laws WHERE law_number LIKE ? OR law_detail LIKE ? OR law_search LIKE ? ORDER BY law_id ASC`;

  db.query(sql, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`], (err, results) => {
    if (err) {
      logger.error('❌ ค้นหากฎหมายสหกรณ์ Error:', err);
      return res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด' });
    }
    res.json({ status: 'success', data: results });
  });
});

// API ค้นหากฎหมายกลุ่มเกษตรกร
app.get('/api/glaws/search', (req, res) => {
  let searchTerm = req.query.name || '';
  let sql = `SELECT * FROM tbl_glaws WHERE glaw_number LIKE ? OR glaw_detail LIKE ? OR glaw_comment LIKE ? ORDER BY glaw_id ASC`;

  db.query(sql, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`], (err, results) => {
    if (err) {
      logger.error('❌ ค้นหากฎหมายกลุ่มเกษตรกร Error:', err);
      return res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด' });
    }
    res.json({ status: 'success', data: results });
  });
});

// Middleware จัดการ Error 404
app.use((req, res, next) => {
  res.status(404).json({ status: 'error', message: 'Not Found' });
});

// ฟัง Port
const PORT = process.env.PORT || 3000; // เปลี่ยนจาก process.env.PORT ให้มีค่าเริ่มต้นเป็น 5000
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});
