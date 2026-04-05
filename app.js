const express = require('express');
const cors = require('cors');
const path = require('path');
const argon2 = require('argon2');
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken'); 
const con = require('./db'); 

// นำเข้า Multer สำหรับจัดการไฟล์รูปภาพ
const multer = require('multer');

const app = express();
const JWT_SECRET = "my_super_secret_restaurant_key_2026"; 

app.use(cors()); 
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname)); 

// ตั้งค่าการจัดเก็บไฟล์รูปภาพ
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/image/') 
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname) 
    }
});
const upload = multer({ storage: storage });

// #####################################################################################
// 👑 (ADMIN) - ระบบหลังบ้าน
// #####################################################################################

app.get('/admin/login', (req, res) => res.sendFile(path.join(__dirname, 'viewe/admin/login.html')));
app.get('/admin/page/login', (req, res) => res.sendFile(path.join(__dirname, 'viewe/admin/login.html')));
app.get('/admin/page/welcome', (req, res) => res.sendFile(path.join(__dirname, 'viewe/admin/welcome.html')));
app.get('/admin/page/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'viewe/admin/dashboard.html')));
app.get('/admin/page/review', (req, res) => res.sendFile(path.join(__dirname, 'viewe/admin/review.html')));
app.get('/admin/page/menu', (req, res) => res.sendFile(path.join(__dirname, 'viewe/admin/menu_management.html')));
app.get('/admin/page/edit-menu', (req, res) => res.sendFile(path.join(__dirname, 'viewe/admin/edit_menu.html')));
app.get('/admin/page/cook', (req, res) => res.sendFile(path.join(__dirname, 'viewe/admin/cook_management.html')));

app.get('/password/:raw', (req, res) => {
    res.send(argon2.hashSync(req.params.raw));
});

app.post('/admin/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Please provide username and password');
    try {
        const hashPassword = await argon2.hash(password);
        const sql = "INSERT INTO admin (username, password, role) VALUES (?, ?, 'admin')";
        con.query(sql, [username, hashPassword], (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to create admin." });
            res.status(201).json({ message: 'Admin created successfully!', username: username });
        });
    } catch (error) { res.status(500).send('Error encrypting password'); }
});

app.post('/admin/login', async function(req, res) {
    const { username, password } = req.body;
    const sql = "SELECT username, password FROM admin WHERE username = ?";
    con.query(sql, [username], async function(err, results) {
        if (err) return res.status(500).send('Server error');
        if (results.length !== 1) return res.status(401).send('Wrong username');
        try {
            const isMatch = await argon2.verify(results[0].password, password);
            if (!isMatch) return res.status(401).send('Wrong password');
            res.status(200).json({ message: 'Login OK', username: results[0].username });
        } catch (error) { res.status(500).send('Internal verification error'); }
    });
});

app.get('/admin/dashboard', function(req, res) {
    const sqlCustomer = `SELECT COUNT(customer_id) AS customer_count FROM customer_session WHERE DATE(login_time) = CURDATE()`;
    const sqlRevenue = `SELECT SUM(amount) AS total_revenue FROM payment WHERE DATE(payment_date) = CURDATE()`;
    const sqlAllTime = `SELECT (SELECT SUM(amount) FROM payment) as all_time_revenue, (SELECT AVG(rating) FROM review) as avg_rating`;

    con.query(sqlCustomer, (err, cRes) => {
        if(err) return res.status(500).send('Database error');
        con.query(sqlRevenue, (err, rRes) => {
            if(err) return res.status(500).send('Database error');
            con.query(sqlAllTime, (err, aRes) => {
                if(err) return res.status(500).send('Database error');
                res.status(200).json({
                    customer_count: cRes[0].customer_count || 0,
                    today_revenue: parseInt(rRes[0].total_revenue || 0),
                    total_revenue: parseInt(aRes[0].all_time_revenue || 0),
                    avg_rating: parseFloat(aRes[0].avg_rating || 0).toFixed(1)
                });
            });
        });
    });
});

app.get('/admin/payments', (req, res) => {
    con.query("SELECT payment_id, amount FROM payment", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// 🌟 จัดการเมนู 🌟

// 💡 [เพิ่มใหม่] API ดึงข้อมูล Top 3 เมนูขายดี (สำหรับหน้า Dashboard)
app.get('/admin/top-menus', (req, res) => {
    const sql = `
        SELECT m.menu_id, m.name, m.image, SUM(oi.quantity) as total_sold
        FROM order_item oi
        JOIN menu_item m ON oi.menu_id = m.menu_id
        GROUP BY m.menu_id, m.name, m.image
        ORDER BY total_sold DESC
        LIMIT 3
    `;
    con.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

app.get('/admin/menus-list', (req, res) => {
    const sql = "SELECT * FROM menu_item";
    con.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

app.put('/admin/menu/status/:id', (req, res) => {
    const { status } = req.body;
    const sql = "UPDATE menu_item SET status = ? WHERE menu_id = ?";
    con.query(sql, [status, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "status updated" });
    });
});

app.post('/admin/menu', upload.single('imageFile'), (req, res) => {
    const { name, price } = req.body;
    const imagePath = req.file ? `/public/image/${req.file.filename}` : '';
    const sql = "INSERT INTO menu_item (name, price, status, image) VALUES (?, ?, 'available', ?)";
    con.query(sql, [name, price, imagePath], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "added" });
    });
});

app.put('/admin/menu/:id', upload.single('imageFile'), (req, res) => {
    const { name, price, status } = req.body; 
    if (req.file) {
        const imagePath = `/public/image/${req.file.filename}`;
        const sql = "UPDATE menu_item SET name = ?, price = ?, status = ?, image = ? WHERE menu_id = ?";
        con.query(sql, [name, price, status || 'available', imagePath, req.params.id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(200).json({ message: "updated with image" });
        });
    } else {
        const sql = "UPDATE menu_item SET name = ?, price = ?, status = ? WHERE menu_id = ?";
        con.query(sql, [name, price, status || 'available', req.params.id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(200).json({ message: "updated without image" });
        });
    }
});

// 🌟 จัดการ Cook 🌟
app.get('/admin/cooks', (req, res) => {
    con.query("SELECT cook_id, status, password FROM cook", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

app.post('/admin/cook', (req, res) => {
    const { cook_id } = req.body;
    const sql = "INSERT INTO cook (cook_id, password, role, status) VALUES (?, '', 'cook', 'inactive')";
    
    con.query(sql, [cook_id], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "มี Cook ID นี้ในระบบแล้ว" });
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: "added" });
    });
});

app.put('/admin/cook/:id', (req, res) => {
    const { status } = req.body; 
    con.query("UPDATE cook SET status = ? WHERE cook_id = ?", [status, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "updated" }); 
    });
});

// #####################################################################################
// 🍽️ (CUSTOMER) - ระบบลูกค้า
// #####################################################################################

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'viewe/customer/login_table.html')));
app.get('/menu', (req, res) => res.sendFile(path.join(__dirname, 'viewe/customer/menu.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(__dirname, 'viewe/customer/cart.html')));
app.get('/status', (req, res) => res.sendFile(path.join(__dirname, 'viewe/customer/status.html')));
app.get('/history', (req, res) => res.sendFile(path.join(__dirname, 'viewe/customer/history.html')));
app.get('/customer/payment', (req, res) => res.sendFile(path.join(__dirname, 'viewe/customer/payment.html')));
app.get('/customer/review', (req, res) => res.sendFile(path.join(__dirname, 'viewe/customer/review.html')));

app.post('/customer/table', (req, res) => {
    const { table_id } = req.body;
    const sql = "INSERT INTO customer_session (table_id, status, login_time) VALUES (?, 'active', NOW())";
    con.query(sql, [table_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ customerId: result.insertId });
    });
});

app.get('/customer/menu', (req, res) => {
    const sql = "SELECT * FROM menu_item WHERE status = 'available'";
    con.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/customer/order', (req, res) => {
    const customerId = req.body.customer_id || req.body.session_id; 
    const items = req.body.items;

    if (!items || items.length === 0) return res.status(400).json({ error: "ไม่มีอาหารในตะกร้า" });
    if (!customerId) return res.status(400).json({ error: "ไม่พบข้อมูลโต๊ะ กรุณากลับไปหน้าแรกเพื่อเข้าโต๊ะใหม่ครับ" });

    const sqlOrder = "INSERT INTO order_table (customer_id, status) VALUES (?, 'pending')";
    con.query(sqlOrder, [customerId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message }); 
        
        const orderId = result.insertId; 
        const itemValues = items.map(item => [
            orderId, item.menu_id || item.id, item.qty || item.quantity || 1, item.detail || '-', '', 0, customerId 
        ]);
        
        const sqlItems = "INSERT INTO order_item (order_id, menu_id, quantity, detail, extra, extra_price, customer_id) VALUES ?";
        con.query(sqlItems, [itemValues], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.status(200).json({ order_id: orderId, status: "pending" });
        });
    });
});

app.get('/customer/status/:customerId', (req, res) => {
    const sql = `SELECT ot.status as order_status, mi.name, oi.detail, oi.quantity 
                 FROM order_table ot JOIN order_item oi ON ot.order_id = oi.order_id 
                 JOIN menu_item mi ON oi.menu_id = mi.menu_id 
                 WHERE ot.customer_id = ? ORDER BY ot.order_id DESC`;
    con.query(sql, [req.params.customerId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/customer/payment', (req, res) => {
    const { order_id, amount, customer_id } = req.body;
    if (!order_id || !customer_id) return res.status(400).json({ error: "Missing order_id or customer_id" });

    const sqlPayment = "INSERT INTO payment (order_id, amount, payment_date) VALUES (?, ?, NOW())";
    con.query(sqlPayment, [order_id, amount], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        const sqlUpdateStatus = "UPDATE customer_session SET status = 'pending_payment' WHERE customer_id = ?";
        con.query(sqlUpdateStatus, [customer_id], (errUpdate) => {
            if (errUpdate) return res.status(500).json({ error: errUpdate.message });
            res.status(200).json({ message: 'Payment Recorded', payment_id: result.insertId });
        });
    });
});

app.post('/customer/review', (req, res) => {
    const { order_id, rating, comment } = req.body;
    const sql = "INSERT INTO review (order_id, rating, comment) VALUES (?, ?, ?)";
    con.query(sql, [order_id, rating, comment], (err) => {
        if (err) return res.status(500).json(err);
        res.status(200).send('Review Success');
    });
});

app.get('/customer/history/:customerId', (req, res) => {
    const sql = `SELECT ot.order_id, ot.order_time, SUM(oi.quantity * (mi.price + oi.extra_price)) as total_price
                 FROM order_table ot JOIN order_item oi ON ot.order_id = oi.order_id
                 JOIN menu_item mi ON oi.menu_id = mi.menu_id
                 WHERE ot.customer_id = ? GROUP BY ot.order_id`;
    con.query(sql, [req.params.customerId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// #####################################################################################
// 👨‍🍳 (COOK) - ระบบห้องครัว
// #####################################################################################

app.get("/cook/login", (req, res) => {
    res.sendFile(path.join(__dirname, "viewe/Cook/Cook.html"));
});

app.post("/cook/register", async (req, res) => {
    const { cook_id, password } = req.body;
    if (!cook_id || !password) return res.status(400).json({ message: "Missing data" });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        con.query("SELECT * FROM cook WHERE cook_id = ?", [cook_id], (err, results) => {
            if (err) return res.status(500).json({ message: err.message });
            
            if (results.length === 0) {
                return res.status(400).json({ message: "ไม่พบ Cook ID นี้ กรุณาติดต่อ Admin" });
            }
            if (results[0].password !== '') {
                return res.status(400).json({ message: "Cook ID นี้ถูกลงทะเบียนไปแล้ว" });
            }

            const updateSql = "UPDATE cook SET password = ?, status = 'active' WHERE cook_id = ?";
            con.query(updateSql, [hashedPassword, cook_id], (err2, result) => {
                if (err2) return res.status(500).json({ message: err2.message });
                res.status(200).json({ message: "registered" });
            });
        });
    } catch (error) { res.status(500).json({ message: "Server error" }); }
});

app.post("/cook/login", (req, res) => {
    const { cook_id, password } = req.body;
    const sql = "SELECT * FROM cook WHERE cook_id = ?";
    
    con.query(sql, [cook_id], async (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        
        if (result.length > 0) {
            if(result[0].status === 'inactive' || result[0].status === 'disable') {
                return res.status(403).json({ message: "รหัสนี้ถูกระงับการใช้งาน กรุณาติดต่อ Admin" });
            }

            const isMatch = await bcrypt.compare(password, result[0].password);
            if (isMatch) {
                const token = jwt.sign({ cook_id: cook_id }, JWT_SECRET, { expiresIn: '1d' });
                res.status(200).json({ token: token });
            } else { res.status(401).json({ message: "Invalid credentials" }); }
        } else { res.status(401).json({ message: "Invalid credentials" }); }
    });
});

app.get("/cook/orders", (req, res) => {
    const sql = `
        SELECT o.order_id, cs.table_id AS table_no, o.status, o.order_time, m.name AS menu_name, oi.quantity, oi.detail AS note 
        FROM order_table o 
        LEFT JOIN customer_session cs ON o.customer_id = cs.customer_id
        LEFT JOIN order_item oi ON o.order_id = oi.order_id 
        LEFT JOIN menu_item m ON oi.menu_id = m.menu_id
        WHERE o.status IN ('pending', 'cooking') 
        ORDER BY o.order_time ASC
    `;
    con.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        const ordersMap = {};
        results.forEach(row => {
            const oid = row.order_id;
            if (!ordersMap[oid]) {
                ordersMap[oid] = { order_id: oid, table_no: row.table_no || "?", status: row.status, order_time: row.order_time, items: [] };
            }
            if (row.menu_name) {
                let noteText = `x${row.quantity}${row.note ? ` (${row.note})` : ''}`;
                ordersMap[oid].items.push({ name: row.menu_name, note: noteText });
            }
        });
        res.status(200).json(Object.values(ordersMap));
    });
});

app.put("/cook/order/:id", (req, res) => {
    const order_id = req.params.id;
    const { status, cook_id } = req.body;
    if (!status) return res.status(400).json({ message: "Missing status" });
    let sql = cook_id ? "UPDATE order_table SET status = ?, cook_id = ? WHERE order_id = ?" : "UPDATE order_table SET status = ? WHERE order_id = ?";
    let params = cook_id ? [status, cook_id, order_id] : [status, order_id];
    con.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(200).json({ message: "updated" });
    });
});

app.get("/cook/dashboard", (req, res) => {
    const countSql = `SELECT SUM(oi.quantity) as served_count FROM order_item oi JOIN order_table o ON o.order_id = oi.order_id WHERE o.status = 'served' AND DATE(o.order_time) = CURDATE()`;
    const topMenuSql = `SELECT m.name as menu_name, SUM(oi.quantity) as cnt FROM order_item oi JOIN order_table o ON o.order_id = oi.order_id JOIN menu_item m ON oi.menu_id = m.menu_id WHERE o.status = 'served' AND DATE(o.order_time) = CURDATE() GROUP BY m.name ORDER BY cnt DESC LIMIT 3`;

    con.query(countSql, (err1, countRes) => {
        if (err1) return res.status(500).json({ message: "Count Error: " + err1.message });
        con.query(topMenuSql, (err2, topRes) => {
            if (err2) return res.status(500).json({ message: "TopMenu Error: " + err2.message });
            res.status(200).json({ served_count: countRes[0]?.served_count || 0, top_menus: topRes });
        });
    });
});

app.get("/api/get_reviews.php", (req, res) => {
    const summarySql = `SELECT IFNULL(AVG(rating), 0) as average, COUNT(*) as total FROM review`;
    const reviewsSql = `SELECT r.rating, r.comment, r.review_time as createdAt, o.customer_id as tableNo FROM review r LEFT JOIN order_table o ON r.order_id = o.order_id ORDER BY r.review_time DESC`;

    con.query(summarySql, (err1, summaryRes) => {
        if (err1) return res.status(500).json({ success: false, message: err1.message });
        con.query(reviewsSql, (err2, reviewsRes) => {
            if (err2) return res.status(500).json({ success: false, message: err2.message });
            res.json({ success: true, summary: { average: parseFloat(summaryRes[0].average).toFixed(1), total: summaryRes[0].total }, reviews: reviewsRes });
        });
    });
});

// ==========================================
// สั่งรันเซิร์ฟเวอร์
// ==========================================
app.listen(3000, () => {
    console.log('✅ Server is running at http://localhost:3000');
});