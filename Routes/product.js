const express = require('express');
const app = express();
const router = express.Router();
const fs = require('fs');
const multer = require('multer');
const path = require('path');   // เรียกใช้งาน path
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
app.get('/product/delete/:id', (req, res) => {
    let id = req.params.id;
    let sql = "SELECT * FROM products WHERE id = ?";
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('เกิดข้อผิดพลาด:', err);
            return res.redirect('/list_product');
        }

        let product = results[0];
        let sql = "DELETE FROM products WHERE id = ?";
        db.query(sql, [id], (err, results) => {
            if (err) {
                console.error('เกิดข้อผิดพลาด:', err);
                return res.redirect('/list_product');
            }

            if (product.image) {
                fs.unlinkSync('public/uploads/' + product.image);
            }

            res.redirect('/list_product');
        });
    });
});

module.exports = multer; // ส่งค่า multer ออกไปให้ไฟล์อื่นเรียกใช้งานได้