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







// #####################################################################################
// (COOK)
// #####################################################################################








// #####################################################################################
// (ADMIN)
// #####################################################################################


