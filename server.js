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
const multer = require('multer');
const fs = require('fs');




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


// ตั้งค่า multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
})
const upload = multer({ storage: storage });


// app set view engine
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(session({secret: 'my secret', resave : false , saveUninitialized: false}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(express.static('public'))
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist'))


app.use((req, res, next) => {
    res.locals.user = req.session.user || '';
    res.locals.login = req.session.login || '';
    res.locals.password = req.session.password || '';
    res.locals.isValid = req.session.isValid || false;
    next();
});

    app.get('/', (req, res) => {
        res.render('index');
    });



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
            let user = results[0];
            req.session.user = user;
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



app.all('/create', upload.single('image'), (req, res) => {
    let { name, description } = req.body;
    const image = req.file ? req.file.filename : null;

    const sql = 'INSERT INTO products (name, description, image) VALUES (?, ?, ?)';
    db.query(sql, [name, description, image], (err, results) => {
        if (err) {
            console.error('เกิดข้อผิดพลาด:', err);
            return res.render('create', { message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล' });
        }else{
            res.redirect('/list_product');
        }

    });


});

app.get('/list_product',(req,res) => {
    let sql = "SELECT * FROM products ORDER BY id DESC"
    db.query(sql, (err, results) => {
        if (err) {
            console.error('เกิดข้อผิดพลาด:', err);
            return res.render('list_product', { message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
        }
        res.render('list_product', {product: results})
    });
})


app.get('/member2',(req,res) => {
    let sql2 = "SELECT * FROM tbl_user"
    db.query(sql2, (err, results) => {
        if (err) {
            console.error('เกิดข้อผิดพลาด:', err);
            return res.render('member2', { message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
        }
        res.render('member2', {data: results})
    });
})
app.all('/product/edit/:id/',(req,res) => {
    let id = req.params.id
    let sql = "SELECT * FROM products WHERE id = ?"
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('เกิดข้อผิดพลาด:', err);
            return res.render('edit', { message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
        }
        res.render('edit', {product: results[0]})
    });
})
app.all('/product/update/:id', upload.single('image'), (req, res) => {
    let id = req.params.id;
    let { name, description } = req.body;
    let image = req.file ? req.file.filename : null;

    // ตรวจสอบว่ามีการอัปโหลดไฟล์หรือไม่
    if (image) {
        let sql = "UPDATE products SET name = ?, description = ?, image = ? WHERE id = ?";
        db.query(sql, [name, description, image, id], (err, results) => {
            if (err) {
                console.error('เกิดข้อผิดพลาด:', err);
                return res.render('edit', { message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล', product: { id, name, description, image } });
            }
            res.redirect('/list_product');
        });
    } else {
        let sql = "UPDATE products SET name = ?, description = ? WHERE id = ?";
        db.query(sql, [name, description, id], (err, results) => {
            if (err) {
                console.error('เกิดข้อผิดพลาด:', err);
                return res.render('edit', { message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล', product: { id, name, description } });
            }
            res.redirect('/list_product');
        });
    }
});
app.listen(port,()=>{
    console.log('server is listening on port', port);
})