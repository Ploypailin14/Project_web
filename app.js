const express = require('express');
const app = express();
const con = require('./db')
const path = require('path');
const argon2 = require('@node-rs/argon2');

app.use(express.json());

// hashing password
app.get('/password/:raw', (req, res) => {
const raw = req.params.raw;
const hash = argon2.hashSync(raw);
// console.log(hash.length);
// 97 characters
res.send(hash);
});

// login
app.post('/admin/login', async function(req, res) {
    const { username, password } = req.body;

    // 1. เปลี่ยนชื่อคอลัมน์ใน SELECT เป็น password (ตามที่คุณแจ้งมา)
    const sql = "SELECT username, password FROM admin WHERE username = ?";
    
    con.query(sql, [username], async function(err, results) {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }

        // 2. ตรวจสอบว่ามี username นี้ในระบบไหม
        if (results.length !== 1) {
            return res.status(401).send('Wrong username');
        }

        try {
            // 3. ใช้ argon2.verify เทียบ password จาก body กับ password (hash) จาก DB
            // ต้องใช้ await เพราะเป็น Async
            const isMatch = await argon2.verify(results[0].password, password);

            if (!isMatch) {
                return res.status(401).send('Wrong password');
            }

            // 4. Login สำเร็จ
            res.status(200).json({
                message: 'Login OK',
                username: results[0].username
            });

        } catch (error) {
            console.error("Verification error:", error);
            res.status(500).send('Internal verification error');
        }
    });
});
//******************** Admin ***********************
//get all products
app.get('/admin/products', function(req, res) {
    const sql = "SELECT * FROM product";
    con.query(sql, function(err, results) {
        if(err) {
            res.status(500).send('Server error');
        } else {
            res.status(200).json(results);
        }
    });
});

//********************** User************************

// ================= Page Routes ===================
//add stock page
app.get('/add/stock', function(req, res) {
    res.status(200).sendFile(path.join(__dirname, 'views/admin/stock.html'));
});

// root service
app.get('/', function(req, res) {
    res.status(200).sendFile(path.join(__dirname, 'views/login.html'));
});

app.listen(3000, function() {
    console.log('Server is running at 3000');
});

// #####################################################################################
// (CUSTOMER)
// #####################################################################################
// ================= Page Routes (Customer) ===================

// หน้าแรก (กรอกเลขโต๊ะ)
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'views/login.html'));
});

// หน้าเมนู
app.get('/menu', function(req, res) {
    res.sendFile(path.join(__dirname, 'views/menu.html'));
});

// หน้าสถานะออเดอร์
app.get('/status', function(req, res) {
    res.sendFile(path.join(__dirname, 'views/status.html'));
});

// ================= API Routes (Customer) ===================

// 1. สร้าง Session เมื่อเลือกโต๊ะ
app.post('/customer/session', (req, res) => {
    const { table_id } = req.body;
    const sql = "INSERT INTO customer_session (table_id, status) VALUES (?, 'active')";
    con.query(sql, [table_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ sessionId: result.insertId });
    });
});

// 2. ดึงรายการเมนู
app.get('/customer/menu', (req, res) => {
    const sql = "SELECT * FROM menu_item WHERE status = 'available'";
    con.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 3. สั่งอาหาร
app.post('/customer/order', (req, res) => {
    const { session_id, items } = req.body; 
    const sqlOrder = "INSERT INTO order_table (session_id, status) VALUES (?, 'pending')";
    
    con.query(sqlOrder, [session_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        const orderId = result.insertId;

        const itemValues = items.map(item => [
            orderId, item.menu_id, item.quantity, item.detail, item.extra, item.extra_price
        ]);

        const sqlItems = "INSERT INTO order_item (order_id, menu_id, quantity, detail, extra, extra_price) VALUES ?";
        con.query(sqlItems, [itemValues], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(200).json({ message: 'Order placed!', orderId: orderId });
        });
    });
});

// 4. ดูสถานะออเดอร์
app.get('/customer/order-status/:sessionId', (req, res) => {
    const sql = `SELECT ot.order_id, ot.status as order_status, oi.*, mi.name 
                 FROM order_table ot 
                 JOIN order_item oi ON ot.order_id = oi.order_id 
                 JOIN menu_item mi ON oi.menu_id = mi.menu_id 
                 WHERE ot.session_id = ? ORDER BY ot.order_id DESC`;
    con.query(sql, [req.params.sessionId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});



// #####################################################################################
// (COOK)
// #####################################################################################








// #####################################################################################
// (ADMIN)
// #####################################################################################


