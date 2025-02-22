// สร้าง server ด้วย express และใช้ ejs เป็น view engine
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const ejs = require('ejs');
const session = require('express-session');
const cookieParser = require('cookie-parser');  
const bodyParser = require('body-parser');
const mysql = require('mysql2');



// app set view engine
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

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

app.use(session({secret: 'my secret', resave : false , saveUninitialized: false}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(express.static('public'))
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist'))


app.use((req, res, next) => {
    res.locals.login = req.session.login || '';
    res.locals.password = req.session.password || '';
    res.locals.isValid = req.session.isValid || false;
    next();
});

    app.get('/', (req, res) => {
        res.render('index');
    });
    

// app.all('/login', (req, res) => {
//     let login = req.body.login || ''; // ✅ กำหนดค่าเริ่มต้นให้ login
//     let password = req.body.password || '';
//     if (login === 'admin' && password === 'sumet022') {
//         req.session.login = login;
//         req.session.isValid = true;
//         res.redirect('/member');
//     } else {
//         res.render('index');
//     }
//     req.session.password = login
//     req.session.isValid = true
// });

app.all('/login', (req, res) => {
    let login = req.body.login || '';
    let password = req.body.password || '';

    if (!login || !password) {
        return res.render('index', { message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    // ค้นหา username และ password ในฐานข้อมูล
    let sql = 'SELECT * FROM tbl_user WHERE use_username = ? AND use_password = ?';
    db.query(sql, [login, password], (err, results) => {
        if (err) {
            console.error('เกิดข้อผิดพลาด:', err);
            return res.render('index', { message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
        }

        if (results.length > 0) {
            // ถ้าพบข้อมูลในฐานข้อมูล แสดงว่า login สำเร็จ
            req.session.login = login;
            req.session.isValid = true;
            res.redirect('/member');
        } else {
            // ถ้าไม่พบข้อมูล แสดงว่า login ไม่ถูกต้อง
            res.render('index', { message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }
    });
});


app.get('/logout',(req,res) => {
    req.session.destroy()
    res.redirect('/')
})
app.get('/member', (req, res) => {
    if (res.locals.login) {
        res.render('member');
    } else {
        res.redirect('/');
    }
  

});


app.get('/product/:fruit',(req,res) => {
    let  fruit = req.params.fruit
    
    res.render('product', {data: fruit})
    
})

app.get('/contact',(req,res) => {
    res.render('contact')
})
app.listen(port,()=>{
    console.log('server is listening on port', port);
})