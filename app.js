const express = require('express');
const app = express();
const con = require('./db')
const path = require('path');
const argon2 = require('argon2');
const cors = require('cors');

app.use(cors()); // อนุญาตให้ Frontend จากพอร์ตอื่นเรียกใช้งาน API ได้
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

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

app.listen(3000, function() {
    console.log('Server is running at 3000');
});

// #####################################################################################
// (CUSTOMER)
// #####################################################################################
// ================= Page Routes (Customer) ===================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'viewe/customer/login_table.html')));
app.get('/menu', (req, res) => res.sendFile(path.join(__dirname, 'viewe/customer/menu.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(__dirname, 'viewe/customer/cart.html')));
app.get('/status', (req, res) => res.sendFile(path.join(__dirname, 'viewe/customer/status.html')));
app.get('/history', (req, res) => res.sendFile(path.join(__dirname, 'viewe/customer/history.html')));
app.get('/payment', (req, res) => res.sendFile(path.join(__dirname, 'viewe/customer/payment.html')));
app.get('/review', (req, res) => res.sendFile(path.join(__dirname, 'viewe/customer/review.html')));

// หน้าแรก (กรอกเลขโต๊ะ)
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'views/customer/login_table.html'));
});
// ================= API Routes (Customer) ===================

// 1. สร้าง Session เมื่อเลือกโต๊ะ (ตรวจสอบชื่อคอลัมน์ status ให้ตรงกับ enum ใน SQL)
app.post('/customer/table', (req, res) => {
    const { table_id } = req.body;
    // ใน SQL ใช้ชื่อตาราง customer_session และมีคอลัมน์ status
    const sql = "INSERT INTO customer_session (table_id, status, login_time) VALUES (?, 'active', NOW())";
    con.query(sql, [table_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ customerId: result.insertId });
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

// 3. บันทึกออเดอร์จากตะกร้า
app.post('/customer/order', (req, res) => {
    // ตรวจสอบชื่อคอลัมน์: ถ้าใน DB เป็น session_id ให้เปลี่ยนจาก customer_id เป็น session_id นะครับ
    const { customer_id, items } = req.body; 

    if (!items || items.length === 0) {
        return res.status(400).json({ error: "No items in basket" });
    }

    const sqlOrder = "INSERT INTO order_table (customer_id, status) VALUES (?, 'pending')";
    
    con.query(sqlOrder, [customer_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const orderId = result.insertId; // ดึง ID ของ Order ที่เพิ่งสร้าง
        
        // เตรียมข้อมูลสำหรับ Bulk Insert เข้า order_item
        const itemValues = items.map(item => [
            orderId, 
            item.menu_id, 
            item.qty || item.quantity, 
            item.detail || '', 
            item.extra || '', 
            item.extra_price || 0
        ]);
        
        const sqlItems = "INSERT INTO order_item (order_id, menu_id, quantity, detail, extra, extra_price) VALUES ?";
        
        con.query(sqlItems, [itemValues], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            // --- ส่วนที่แก้ไข: ส่ง Response กลับตามโครงสร้างที่คุณต้องการ ---
            res.status(200).json({ 
                order_id: orderId, 
                status: "pending" 
            });
        });
    });
});

// 4. ดูสถานะออเดอร์ (อ้างอิงชื่อคอลัมน์จาก order_table และ menu_item)
app.get('/customer/status/:customerId', (req, res) => {
    const sql = `SELECT ot.status as order_status, mi.name, oi.detail, oi.quantity 
                 FROM order_table ot 
                 JOIN order_item oi ON ot.order_id = oi.order_id 
                 JOIN menu_item mi ON oi.menu_id = mi.menu_id 
                 WHERE ot.customer_id = ? ORDER BY ot.order_id DESC`;
    con.query(sql, [req.params.customerId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 5. แจ้งชำระเงิน (สร้างรายการ Payment)
app.post('/customer/payment', (req, res) => {
    // 1. รับค่า customer_id แทน session_id
    const { order_id, amount, customer_id } = req.body;

    // ตรวจสอบค่าที่ส่งมา
    if (!order_id || !customer_id) {
        return res.status(400).json({ error: "Missing order_id or customer_id" });
    }

    // 2. บันทึกข้อมูลลงตาราง payment (ใช้โครงสร้างตามรูป phpMyAdmin ของคุณ)
    const sqlPayment = "INSERT INTO payment (order_id, amount, payment_time) VALUES (?, ?, NOW())";
    
    con.query(sqlPayment, [order_id, amount], (err, result) => {
        if (err) {
            console.error("Payment Error:", err);
            return res.status(500).json({ error: err.message });
        }

        // 3. อัปเดตสถานะในตาราง customer_session (หรือตารางที่คุณใช้เก็บสถานะลูกค้า)
        // เปลี่ยน WHERE เป็น customer_id ตามที่คุณต้องการ
        const sqlUpdateStatus = "UPDATE customer_session SET status = 'pending_payment' WHERE customer_id = ?";
        
        con.query(sqlUpdateStatus, [customer_id], (errUpdate) => {
            if (errUpdate) {
                console.error("Update Status Error:", errUpdate);
                return res.status(500).json({ error: errUpdate.message });
            }
            
            res.status(200).json({ 
                message: 'Payment Recorded', 
                payment_id: result.insertId 
            });
        });
    });
});

// 6. บันทึกรีวิว (ใน SQL ใช้ชื่อคอลัมน์ review_time ซึ่งจะ Gen อัตโนมัติ ไม่ต้องใส่ใน Insert)
app.post('/customer/review', (req, res) => {
    const { order_id, rating, comment } = req.body;
    // ตาราง review มี review_id (AI), order_id, rating, comment, review_time (Current_Timestamp)
    const sql = "INSERT INTO review (order_id, rating, comment) VALUES (?, ?, ?)";
    con.query(sql, [order_id, rating, comment], (err) => {
        if (err) return res.status(500).json(err);
        res.status(200).send('Review Success');
    });
});


// 7. ดึงประวัติการสั่งซื้อ (เปลี่ยนจาก created_at เป็น order_time ตาม SQL)
app.get('/customer/history/:customerId', (req, res) => {
    const sql = `SELECT ot.order_id, ot.order_time, 
                 SUM(oi.quantity * (mi.price + oi.extra_price)) as total_price
                 FROM order_table ot
                 JOIN order_item oi ON ot.order_id = oi.order_id
                 JOIN menu_item mi ON oi.menu_id = mi.menu_id
                 WHERE ot.customer_id = ? GROUP BY ot.order_id`;
    con.query(sql, [req.params.customerId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});



// #####################################################################################
// (COOK)
// #####################################################################################








// #####################################################################################
// (ADMIN)
// #####################################################################################


