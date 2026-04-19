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

// // #####################################################################################
// // 👑 (ADMIN) - Back-office Management 
// // #####################################################################################

// 💡 [เพิ่มใหม่] ตั้งค่าการจัดเก็บไฟล์ภาพด้วย Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/image/') // อย่าลืมสร้างโฟลเดอร์ public/image ไว้ในโปรเจกต์ด้วยนะครับ
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

// =================================================================
// Admin Page Routes
// =================================================================
app.get('/admin/page/login', (req, res) => res.sendFile(path.join(__dirname, 'viewe/admin/html/login.html')));
app.get('/admin/page/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'viewe/admin/html/dashboard.html')));
app.get('/admin/page/welcome', (req, res) => res.sendFile(path.join(__dirname, 'viewe/admin/html/welcome.html')));
app.get('/admin/page/menu', (req, res) => res.sendFile(path.join(__dirname, 'viewe/admin/html/menu_management.html')));
app.get('/admin/page/edit-menu', (req, res) => res.sendFile(path.join(__dirname, 'viewe/admin/html/edit_menu.html')));
app.get('/admin/page/review', (req, res) => res.sendFile(path.join(__dirname, 'viewe/admin/html/review.html')));
app.get('/admin/page/tables', (req, res) => res.sendFile(path.join(__dirname, 'viewe/admin/html/table_management.html')));
app.get('/admin/page/sessions', (req, res) => res.sendFile(path.join(__dirname, 'viewe/admin/html/session_management.html')));
app.get('/admin/page/manage-admins', (req, res) => res.sendFile(path.join(__dirname, 'viewe/admin/html/admin_management.html')));
app.get('/admin/page/cook', (req, res) => res.sendFile(path.join(__dirname, 'viewe/admin/html/cook_management.html')));
app.get('/admin/page/order-history', (req, res) => res.sendFile(path.join(__dirname, 'viewe/admin/html/order_history.html')));
app.get('/admin/page/payments', (req, res) => res.sendFile(path.join(__dirname, 'viewe/admin/html/payment_management.html')));

// 1. Create a new Admin
app.post('/admin/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Please provide username and password');

    try {
        const hashPassword = await argon2.hash(password);
        const sql = "INSERT INTO admin (username, password, role) VALUES (?, ?, 'admin')";
        
        con.query(sql, [username, hashPassword], (err, result) => {
            if (err) {
                console.error("Insert DB Error:", err);
                return res.status(500).json({ error: "Failed to create admin. Username might already exist." });
            }
            res.status(201).json({ message: 'Admin created successfully!', username: username });
        });
    } catch (error) {
        console.error("Hashing error:", error);
        res.status(500).send('Error encrypting password');
    }
});

// 2. Admin Login System
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Please provide username and password');

    const sql = "SELECT * FROM admin WHERE username = ?";
    con.query(sql, [username], async (err, results) => {
        if (err) return res.status(500).send('Database error');
        if (results.length === 0) return res.status(401).send('Wrong username');

        try {
            const isMatch = await argon2.verify(results[0].password, password);
            if (!isMatch) return res.status(401).send('Wrong password');

            const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_token_for_test";
            res.status(200).json({ token: mockToken });
        } catch (error) {
            console.error("Verification error:", error);
            res.status(500).send('Internal verification error');
        }
    });
});

// ==========================================
// Cook Management
// ==========================================

// 3. Get all cooks
app.get('/admin/cooks', (req, res) => {
    con.query("SELECT cook_id, status FROM cook", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// 4. Toggle cook status
app.put('/admin/cook/:id', (req, res) => {
    const { status } = req.body; 
    const sql = "UPDATE cook SET status = ? WHERE cook_id = ?";
    con.query(sql, [status, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "Cook status updated successfully!" }); 
    });
});

// 4.1. Add a new cook account
app.post('/admin/cook', (req, res) => {
    const { cook_id } = req.body; 
    if (!cook_id) return res.status(400).json({ error: 'Please provide a cook_id.' });

    const sql = "INSERT INTO cook (cook_id, password, status, role) VALUES (?, '', 'inactive', 'cook')";
    con.query(sql, [cook_id], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "มี Cook ID นี้ในระบบแล้ว ไม่สามารถสร้างซ้ำได้" });
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: "สร้างสิทธิ์ Cook ID สำเร็จ!", cook_id: cook_id });
    });
});

// 4.2. Delete a cook permanently
app.delete('/admin/cook/:id', (req, res) => {
    const sql = "DELETE FROM cook WHERE cook_id = ?";
    con.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "Cook deleted permanently!" });
    });
});

// ==========================================
// Menu Management
// ==========================================

// 4.3 Get Top 3 Menus
app.get('/admin/top-menus', (req, res) => {
    const { startDate, endDate, filter } = req.query;
    let whereClause = ""; 
    let queryParams = [];

    if (filter === 'today') {
        whereClause = "WHERE DATE(ot.order_time) = CURDATE()"; 
    } else if (startDate && endDate) {
        whereClause = "WHERE ot.order_time BETWEEN ? AND ?";
        const startDateTime = `${startDate} 00:00:00`;
        const endDateTime = `${endDate} 23:59:59`;
        queryParams = [startDateTime, endDateTime];
    }

    const sql = `
        SELECT m.menu_id, m.name, m.image, SUM(oi.quantity) as total_sold
        FROM order_item oi
        JOIN menu_item m ON oi.menu_id = m.menu_id
        JOIN order_table ot ON oi.order_id = ot.order_id
        ${whereClause}
        GROUP BY m.menu_id, m.name, m.image
        ORDER BY total_sold DESC
        LIMIT 3
    `;

    con.query(sql, queryParams, (err, results) => {
        if (err) {
            console.error("SQL Error in top-menus:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(results);
    });
});

// 5. Add a new menu item
app.post('/admin/menu', upload.single('imageFile'), (req, res) => {
    const { name, description, category, price, status } = req.body;
    const imagePath = req.file ? `/public/image/${req.file.filename}` : '';
    const defaultStatus = status || 'available'; 
    
    const sql = "INSERT INTO menu_item (name, description, category, price, image, status) VALUES (?, ?, ?, ?, ?, ?)";
    con.query(sql, [name, description, category, price, imagePath, defaultStatus], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Menu item added successfully!", menu_id: result.insertId });
    });
});

// 6. Get a single menu item
app.get('/admin/menu/:id', (req, res) => {
    const sql = "SELECT * FROM menu_item WHERE menu_id = ?";
    con.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: "Menu not found" });
        res.status(200).json(results[0]); 
    });
});

// 7. Update menu item
app.put('/admin/menu/:id', upload.single('imageFile'), (req, res) => {
    const menuId = req.params.id;
    const { name, description, category, price, status } = req.body; 
    
    if (req.file) {
        const imagePath = `/public/image/${req.file.filename}`;
        const sql = "UPDATE menu_item SET name = ?, description = ?, category = ?, price = ?, image = ?, status = ? WHERE menu_id = ?";
        con.query(sql, [name, description, category, price, imagePath, status, menuId], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(200).json({ message: "Menu item updated successfully with new image!" });
        });
    } else {
        const sql = "UPDATE menu_item SET name = ?, description = ?, category = ?, price = ?, status = ? WHERE menu_id = ?";
        con.query(sql, [name, description, category, price, status, menuId], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(200).json({ message: "Menu item updated successfully!" });
        });
    }
});

// 7.1 Toggle Menu Status (ปิด/เปิดการขาย)
app.put('/admin/menu/status/:id', (req, res) => {
    const { status } = req.body;
    const sql = "UPDATE menu_item SET status = ? WHERE menu_id = ?";
    con.query(sql, [status, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "Menu status updated!" });
    });
});

// 10. Get all menu items
app.get('/admin/menu', (req, res) => {
    const sql = "SELECT * FROM menu_item";
    con.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// 10.1 Delete a menu item permanently
app.delete('/admin/menu/:id', (req, res) => {
    const sql = "DELETE FROM menu_item WHERE menu_id = ?";
    con.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "Menu item deleted permanently!" });
    });
});

// ==========================================
// Dashboard & Payments (Cashier System)
// ==========================================

// 8. ดึงรายการโต๊ะที่ "ยังไม่จ่ายเงิน"
app.get('/admin/unpaid-bills', (req, res) => {
    const sql = `
        SELECT 
            cs.customer_id, 
            rt.table_number, 
            cs.status as session_status,
            MAX(ot.order_id) as order_id,
            MAX(ot.custom_total) as custom_total,
            IFNULL(SUM((mi.price + IFNULL(oi.extra_price, 0)) * oi.quantity), 0) as calculated_total
        FROM customer_session cs
        JOIN restaurant_table rt ON cs.table_id = rt.table_id
        LEFT JOIN order_table ot ON cs.customer_id = ot.customer_id
        LEFT JOIN order_item oi ON ot.order_id = oi.order_id
        LEFT JOIN menu_item mi ON oi.menu_id = mi.menu_id
        WHERE cs.status IN ('active', 'pending_payment')
        GROUP BY cs.customer_id, rt.table_number, cs.status
        ORDER BY rt.table_number ASC
    `;
    con.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// 8.1 API สำหรับแอดมินแก้ไขยอดรวม (แก้แล้วลูกค้าเห็นเลย)
app.put('/admin/order/:id/custom-total', (req, res) => {
    const { custom_total } = req.body;
    const sql = "UPDATE order_table SET custom_total = ? WHERE order_id = ?";
    con.query(sql, [custom_total, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "อัปเดตยอดรวมสำเร็จ!" });
    });
});

// 9. Get Dashboard statistics
app.get('/admin/dashboard', (req, res) => {
    const { startDate, endDate, filter } = req.query;
    let whereClausePayment = "";
    let whereClauseReview = "";
    let whereClauseCustomer = "";
    let queryParams = [];

    if (filter === 'today') {
        whereClausePayment = "WHERE DATE(payment_time) = CURDATE()"; 
        whereClauseReview = "WHERE DATE(review_time) = CURDATE()";
        whereClauseCustomer = "WHERE DATE(login_time) = CURDATE()";
    } else if (startDate && endDate) {
        whereClausePayment = "WHERE payment_time BETWEEN ? AND ?";
        whereClauseReview = "WHERE review_time BETWEEN ? AND ?";
        whereClauseCustomer = "WHERE login_time BETWEEN ? AND ?";
        const startDateTime = `${startDate} 00:00:00`;
        const endDateTime = `${endDate} 23:59:59`;
        queryParams = [startDateTime, endDateTime, startDateTime, endDateTime, startDateTime, endDateTime];
    }

    const sql = `
        SELECT 
            (SELECT COUNT(customer_id) FROM customer_session ${whereClauseCustomer}) as customer_count,
            (SELECT SUM(amount) FROM payment ${whereClausePayment}) as total_revenue,
            (SELECT AVG(rating) FROM review ${whereClauseReview}) as avg_rating
    `;
    
    con.query(sql, queryParams, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const customers = results[0].customer_count || 0;
        const revenue = results[0].total_revenue || 0;
        const rating = results[0].avg_rating || 0;
        res.status(200).json({ 
            customer_count: customers,
            total_revenue: parseInt(revenue), 
            avg_rating: parseFloat(rating).toFixed(1) 
        });
    });
});

// ==========================================
// Customer Session & Order Management
// ==========================================

// 11. Get Customer Sessions Details
app.get('/admin/customer-sessions', (req, res) => {
    const sql = `
        SELECT 
            cs.customer_id, cs.login_time, cs.status,
            rt.table_number, -- 💡 ดึงเบอร์โต๊ะจริงๆ มาโชว์
            rt.table_id,
            IFNULL(SUM(p.amount), 0) as total_amount,
            (
                SELECT GROUP_CONCAT(CONCAT(mi.name, ' (x', oi.quantity, ')') SEPARATOR ', ')
                FROM order_table ot
                JOIN order_item oi ON ot.order_id = oi.order_id
                JOIN menu_item mi ON oi.menu_id = mi.menu_id
                WHERE ot.customer_id = cs.customer_id
            ) as ordered_items
        FROM customer_session cs
        LEFT JOIN restaurant_table rt ON cs.table_id = rt.table_id
        LEFT JOIN order_table ot ON cs.customer_id = ot.customer_id
        LEFT JOIN payment p ON ot.order_id = p.order_id
        GROUP BY cs.customer_id
        ORDER BY cs.login_time DESC
    `;

    con.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// 11.1 Edit Customer Session (แอดมินย้ายโต๊ะให้ลูกค้า หรือ ปิดโต๊ะ)
app.put('/admin/customer-session/:id', (req, res) => {
    // รับค่าเบอร์โต๊ะที่แอดมินพิมพ์เข้ามา
    const { table_id: inputTableNumber, status } = req.body; 
    if (!inputTableNumber || !status) return res.status(400).json({ error: "Please provide both table number and status" });

    // 1. ดึงข้อมูลโต๊ะเดิมของลูกค้าออกมาก่อน (ทำเป็นลำดับแรกเพื่อเอาไว้เช็ค)
    const getOldTableSql = "SELECT table_id FROM customer_session WHERE customer_id = ?";
    con.query(getOldTableSql, [req.params.id], (errOld, oldRes) => {
        if (errOld) return res.status(500).json({ error: errOld.message });
        const oldTableId = oldRes.length > 0 ? oldRes[0].table_id : null;

        // 2. ค้นหา ID แถวของจริง และสถานะของโต๊ะเป้าหมาย จากเบอร์โต๊ะที่แอดมินพิมพ์
        const checkTableSql = "SELECT table_id, status FROM restaurant_table WHERE table_number = ?";
        con.query(checkTableSql, [inputTableNumber], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(404).json({ error: "ไม่พบเบอร์โต๊ะนี้ในระบบครับ" });

            const realTableId = results[0].table_id;
            const targetTableStatus = results[0].status; // 💡 ดึงสถานะโต๊ะเป้าหมายมาด้วย

            // 💡 3. เช็คสำคัญ: ถ้าย้ายโต๊ะ (โต๊ะใหม่ไม่ตรงกับโต๊ะเดิม) และโต๊ะเป้าหมาย "ไม่ว่าง" ให้ด่ากลับไป!
            if (oldTableId !== realTableId && targetTableStatus === 'occupied') {
                return res.status(400).json({ error: "ย้ายไม่ได้ครับ โต๊ะเป้าหมายมีลูกค้านั่งอยู่แล้ว (Occupied) 🚫" });
            }

            // 4. อัปเดตข้อมูลเซสชันด้วย ID ของจริง
            const sql = "UPDATE customer_session SET table_id = ?, status = ? WHERE customer_id = ?";
            con.query(sql, [realTableId, status, req.params.id], (err2, result) => {
                if (err2) return res.status(500).json({ error: err2.message });
                if (result.affectedRows === 0) return res.status(404).json({ message: "Customer session not found" });

                // 5. จัดการสถานะโต๊ะ
                let newTableStatus = (status === 'closed') ? 'available' : 'occupied';

                const updateNewTableSql = "UPDATE restaurant_table SET status = ? WHERE table_id = ?";
                con.query(updateNewTableSql, [newTableStatus, realTableId], () => {

                    // 6. ถ้าย้ายโต๊ะ ให้เคลียร์โต๊ะเก่าให้ว่างทันที
                    if (oldTableId && oldTableId !== realTableId) {
                        con.query("UPDATE restaurant_table SET status = 'available' WHERE table_id = ?", [oldTableId]);
                    }

                    res.status(200).json({ message: "อัปเดตข้อมูลลูกค้าและสถานะโต๊ะสำเร็จ!" });
                });
            });
        });
    });
});

// 11.2 Get all Order History
app.get('/admin/orders', (req, res) => {
    const { startDate, endDate } = req.query;
    let whereClause = "";
    let queryParams = [];

    if (startDate && endDate) {
        whereClause = "WHERE ot.order_time BETWEEN ? AND ?";
        const startDateTime = `${startDate} 00:00:00`;
        const endDateTime = `${endDate} 23:59:59`;
        queryParams = [startDateTime, endDateTime];
    }

    const sql = `
        SELECT ot.order_id, ot.customer_id, ot.status, ot.order_time,
            GROUP_CONCAT(CONCAT(mi.name, ' (x', oi.quantity, ')') SEPARATOR ', ') as items
        FROM order_table ot
        JOIN order_item oi ON ot.order_id = oi.order_id
        JOIN menu_item mi ON oi.menu_id = mi.menu_id
        ${whereClause}
        GROUP BY ot.order_id
        ORDER BY ot.order_time DESC
    `;
    
    con.query(sql, queryParams, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// 11.3 Update Order Status
app.put('/admin/order/:id/status', (req, res) => {
    const { status } = req.body; 
    const sql = "UPDATE order_table SET status = ? WHERE order_id = ?";
    con.query(sql, [status, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: `Order ID ${req.params.id} not found.` });
        res.status(200).json({ message: "Order status updated successfully!" });
    });
});

// ==========================================
// Review Management
// ==========================================

// 12. Get all reviews
app.get('/admin/reviews', (req, res) => {
    const sql = "SELECT * FROM review ORDER BY review_time DESC";
    con.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// 13. Toggle hide/show review
app.put('/admin/review/:id/hide', (req, res) => {
    const { is_hidden } = req.body; 
    const sql = "UPDATE review SET is_hidden = ? WHERE review_id = ?";
    con.query(sql, [is_hidden, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: is_hidden ? "Review hidden!" : "Review visible!" });
    });
});

// 14. Delete review permanently
app.delete('/admin/review/:id', (req, res) => {
    const sql = "DELETE FROM review WHERE review_id = ?";
    con.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "Review deleted permanently!" });
    });
});

// ==========================================
// Table Management
// ==========================================

// 15. Get all tables
app.get('/admin/tables', (req, res) => {
    const sql = "SELECT * FROM restaurant_table"; 
    con.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// 16. Add a new table
app.post('/admin/table', (req, res) => {
    const { table_number } = req.body;
    if (!table_number) return res.status(400).json({ error: "Please provide a table_number" });

    const sql = "INSERT INTO restaurant_table (table_number, status) VALUES (?, 'available')"; 
    con.query(sql, [table_number], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "New table added successfully!", table_id: result.insertId });
    });
});

// 16.1 Edit Table
app.put('/admin/table/:id', (req, res) => {
    const { table_number, status } = req.body;
    const sql = "UPDATE restaurant_table SET table_number = ?, status = ? WHERE table_id = ?";
    con.query(sql, [table_number, status, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: `Table ID ${req.params.id} not found.` });
        res.status(200).json({ message: "Table updated successfully!" });
    });
});

// 17. Delete a table
app.delete('/admin/table/:id', (req, res) => {
    const sql = "DELETE FROM restaurant_table WHERE table_id = ?";
    con.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "Table deleted permanently!" });
    });
});

// ==========================================
// Admin Management
// ==========================================

// 18. List all admins
app.get('/admin/list', (req, res) => {
    const sql = "SELECT username, role FROM admin";
    con.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// 19. Delete an admin
app.delete('/admin/:username', (req, res) => {
    const sql = "DELETE FROM admin WHERE username = ?";
    con.query(sql, [req.params.username], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: `Admin ${req.params.username} deleted successfully!` });
    });
});

// 20. Get menu items by category
app.get('/admin/menu/category/:category', (req, res) => {
    const sql = "SELECT * FROM menu_item WHERE category = ?";
    con.query(sql, [req.params.category], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
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

// 💡 อัปเดต: ระบบเข้าโต๊ะ (ค้นหาด้วย table_number ให้ตรงกับป้ายโต๊ะจริง)
app.post('/customer/table', (req, res) => {
    // รับค่าที่ลูกค้าพิมพ์มา (ตัวแปรหน้าเว็บส่งมาชื่อ table_id แต่จริงๆ มันคือเบอร์โต๊ะ)
    const { table_id: inputTableNumber } = req.body; 
    if (!inputTableNumber) return res.status(400).json({ error: "กรุณาเลือกโต๊ะครับ" });

    // 1. ค้นหาจากช่อง table_number แทน
    const checkTableSql = "SELECT table_id, status FROM restaurant_table WHERE table_number = ?";
    con.query(checkTableSql, [inputTableNumber], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // ถ้าไม่มีเบอร์โต๊ะนี้ในระบบ
        if (results.length === 0) return res.status(404).json({ error: "ไม่พบเบอร์โต๊ะนี้ในระบบครับ" });

        // 💡 ดึง ID ลำดับแถวของจริงมาใช้
        const realTableId = results[0].table_id;
        const tableStatus = results[0].status;
        
        // 2. ถ้าโต๊ะไม่ว่างให้เตะกลับ
        if (tableStatus !== 'available') {
            return res.status(400).json({ error: "โต๊ะนี้มีลูกค้านั่งอยู่แล้ว กรุณาเลือกโต๊ะอื่นครับ ❌" });
        }

        // 3. เอา realTableId ไปสร้าง Session ใหม่
        const insertSessionSql = "INSERT INTO customer_session (table_id, status, login_time) VALUES (?, 'active', NOW())";
        con.query(insertSessionSql, [realTableId], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const customerId = result.insertId;

            // 4. อัปเดตสถานะในตารางโต๊ะให้กลายเป็น occupied
            const updateTableSql = "UPDATE restaurant_table SET status = 'occupied' WHERE table_id = ?";
            con.query(updateTableSql, [realTableId], (err2) => {
                if (err2) console.error("Failed to update table status:", err2);
                
                res.status(201).json({ customerId: customerId });
            });
        });
    });
});

app.get('/customer/menu', (req, res) => {
    const sql = "SELECT * FROM menu_item WHERE status = 'available'";
    con.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 💡 อัปเดต: ระบบบันทึกออเดอร์ (ดึงค่า extra และ extra_price ไปบันทึกด้วย)
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
            orderId, 
            item.menu_id || item.id, 
            item.qty || item.quantity || 1, 
            item.detail || '-', 
            item.extra || '',           // <-- บันทึกข้อความสั่งพิเศษ (ถ้ามี)
            item.extra_price || 0,      // <-- บันทึกราคาพิเศษที่บวกเพิ่ม (ถ้ามี)
            customerId 
        ]);
        
        const sqlItems = "INSERT INTO order_item (order_id, menu_id, quantity, detail, extra, extra_price, customer_id) VALUES ?";
        con.query(sqlItems, [itemValues], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.status(200).json({ order_id: orderId, status: "pending" });
        });
    });
});

app.get('/customer/status/:customerId', (req, res) => {
    // 💡 ดึง custom_total มาด้วย
    const sql = `SELECT ot.status as order_status, ot.custom_total, mi.name, mi.price, oi.detail, oi.quantity, oi.extra, IFNULL(oi.extra_price, 0) as extra_price 
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
        
        const sqlUpdateStatus = "UPDATE customer_session SET status = 'closed' WHERE customer_id = ?";
        con.query(sqlUpdateStatus, [customer_id], (errUpdate) => {
            if (errUpdate) return res.status(500).json({ error: errUpdate.message });
            
            const sqlGetTable = "SELECT table_id FROM customer_session WHERE customer_id = ?";
            con.query(sqlGetTable, [customer_id], (errTable, tableRes) => {
                if (!errTable && tableRes.length > 0) {
                    const tableId = tableRes[0].table_id;
                    const sqlFreeTable = "UPDATE restaurant_table SET status = 'available' WHERE table_id = ?";
                    con.query(sqlFreeTable, [tableId], () => {
                        res.status(200).json({ message: 'Payment Recorded and Table Freed', payment_id: result.insertId });
                    });
                } else {
                    res.status(200).json({ message: 'Payment Recorded', payment_id: result.insertId });
                }
            });
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
    // 💡 1. เพิ่มการดึง custom_total, extra, extra_price มาจากฐานข้อมูล
    const sql = `
        SELECT 
            ot.order_id, 
            ot.order_time, 
            ot.status,
            ot.custom_total,
            mi.name as menu_name,
            oi.quantity,
            oi.extra,
            IFNULL(oi.extra_price, 0) as extra_price,
            (oi.quantity * (mi.price + IFNULL(oi.extra_price, 0))) as item_price
        FROM order_table ot 
        JOIN order_item oi ON ot.order_id = oi.order_id
        JOIN menu_item mi ON oi.menu_id = mi.menu_id
        WHERE ot.customer_id = ? 
        ORDER BY ot.order_time DESC
    `;
    
    con.query(sql, [req.params.customerId], (err, results) => {
        if (err) {
            console.error("History Error:", err);
            return res.status(500).json({ error: "Database error" });
        }

        const ordersMap = {};
        results.forEach(row => {
            if (!ordersMap[row.order_id]) {
                ordersMap[row.order_id] = {
                    order_id: row.order_id,
                    order_time: row.order_time,
                    status: row.status,
                    custom_total: row.custom_total, // 💡 เก็บยอดที่แอดมินแก้ไว้
                    calculated_total: 0,
                    items: []
                };
            }
            ordersMap[row.order_id].calculated_total += Number(row.item_price || 0);
            
            // 💡 เติมข้อความ (+15฿) ต่อท้ายชื่อเมนูในประวัติให้ด้วย
            let extraStr = '';
            if (row.extra && row.extra.trim() !== '') {
                extraStr = ` (+${row.extra_price}฿)`;
            }

            ordersMap[row.order_id].items.push({
                name: row.menu_name + extraStr,
                qty: row.quantity
            });
        });

        // 💡 2. ตัดสินใจว่าจะใช้ยอดไหนส่งไปให้หน้าเว็บ
        const finalResults = Object.values(ordersMap).map(order => {
            // ถ้าแอดมินแก้ตัวเลข (custom_total ไม่ใช่ null) ให้ใช้ยอดนั้น ถ้าไม่ได้แก้ให้ใช้ยอดคำนวณปกติ
            order.total_price = order.custom_total !== null ? order.custom_total : order.calculated_total;
            return order;
        });

       // 💡 API ตรวจสอบสถานะเซสชันลูกค้า (เช็คการปิดโต๊ะ + ดึงเบอร์โต๊ะล่าสุดแบบ Real-time)
app.get('/customer/check-session/:id', (req, res) => {
    const sql = `
        SELECT cs.status, rt.table_number 
        FROM customer_session cs 
        LEFT JOIN restaurant_table rt ON cs.table_id = rt.table_id 
        WHERE cs.customer_id = ?
    `;
    con.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // ถ้าไม่พบลูกค้าในระบบ หรือสถานะเป็น closed ให้ส่งบอกหน้าเว็บ
        if (results.length === 0) return res.json({ status: 'not_found' });
        
        res.json({ 
            status: results[0].status,
            table_number: results[0].table_number // 💡 ส่งเบอร์โต๊ะล่าสุดกลับไปด้วย
        });
    });
});

        res.json(finalResults);
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

            // 💡 แก้ไข: บันทึกแค่รหัสผ่านเท่านั้น ไม่ไปยุ่งกับสถานะ (ปล่อยให้เป็น inactive ตามเดิม)
            const updateSql = "UPDATE cook SET password = ? WHERE cook_id = ?";
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

// 💡 อัปเดต: ดึงออเดอร์เข้าครัว (คัดกรองเฉพาะโต๊ะที่ยังไม่ถูกปิดเท่านั้น!)
app.get("/cook/orders", (req, res) => {
    const sql = `
        SELECT 
            o.order_id, 
            rt.table_number AS table_no, 
            o.status, 
            o.order_time, 
            m.name AS menu_name, 
            oi.quantity, 
            oi.detail AS note,
            oi.extra 
        FROM order_table o 
        LEFT JOIN customer_session cs ON o.customer_id = cs.customer_id
        LEFT JOIN restaurant_table rt ON cs.table_id = rt.table_id
        LEFT JOIN order_item oi ON o.order_id = oi.order_id 
        LEFT JOIN menu_item m ON oi.menu_id = m.menu_id
        WHERE o.status IN ('pending', 'cooking') 
        AND cs.status != 'closed' -- 💡 พระเอกอยู่ตรงนี้: กรองเอาเฉพาะลูกค้าที่เซสชันยังไม่ถูกปิด
        ORDER BY o.order_time ASC
    `;
    con.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const ordersMap = {};
        results.forEach(row => {
            const oid = row.order_id;
            if (!ordersMap[oid]) {
                ordersMap[oid] = { order_id: oid, table_no: row.table_no || "?", status: row.status, order_time: row.order_time, items: [] };
            }
            if (row.menu_name) {
                // นำคำสั่งพิเศษมารวมกับ Note เพื่อให้พ่อครัวเห็นชัดๆ
                let extraText = (row.extra && row.extra !== '') ? `[พิเศษ: ${row.extra}] ` : '';
                let baseNote = (row.note && row.note !== '-') ? `(${row.note})` : '';
                let finalNote = `${extraText}${baseNote}`.trim();
                
                ordersMap[oid].items.push({ 
                    name: row.menu_name, 
                    qty: row.quantity,
                    note: finalNote 
                });
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

// 💡 แก้ไข API ดึงรีวิว เพื่อให้โชว์ "เลขโต๊ะ (table_id)" แทนรหัสคิว
app.get("/api/get_reviews.php", (req, res) => {
    const summarySql = `SELECT IFNULL(AVG(rating), 0) as average, COUNT(*) as total FROM review`;
    
    // JOIN กับ customer_session เพื่อเอา cs.table_id มาแทน o.customer_id
    const reviewsSql = `
        SELECT 
            r.rating, 
            r.comment, 
            r.review_time as createdAt, 
            cs.table_id as tableNo 
        FROM review r 
        LEFT JOIN order_table o ON r.order_id = o.order_id 
        LEFT JOIN customer_session cs ON o.customer_id = cs.customer_id
        ORDER BY r.review_time DESC
    `;

    con.query(summarySql, (err1, summaryRes) => {
        if (err1) return res.status(500).json({ success: false, message: err1.message });
        con.query(reviewsSql, (err2, reviewsRes) => {
            if (err2) return res.status(500).json({ success: false, message: err2.message });
            res.json({ 
                success: true, 
                summary: { 
                    average: parseFloat(summaryRes[0].average).toFixed(1), 
                    total: summaryRes[0].total 
                }, 
                reviews: reviewsRes 
            });
        });
    });
});

// ==========================================
// สั่งรันเซิร์ฟเวอร์
// ==========================================
app.listen(3000, () => {
    console.log('✅ Server is running at http://localhost:3000');
});