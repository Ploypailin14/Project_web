const express = require('express');
const app = express();
const con = require('./db')
const path = require('path');
const argon2 = require('argon2');

app.use(express.json());

// hashing password
app.post('/password/:raw', function(req, res) {
    const raw = req.params.raw;
    console.log(raw);
    const hash = argon2.hash(raw);
    res.status(200).send(hash);
});


// login
app.post('/login', function(req, res) {
    // const username = req.body.username;
    // const password = req.body.password;
    const {username, password} = req.body;  

    // connect to DB and verify username and password
    const sql = "SELECT id,role FROM user WHERE username=? AND password=?";
    con.query(sql, [username, password], function(err, results) {
        if(err) {
            return res.status(500).send('Server error');
        }
        if(results.length != 1) {
            return res.status(401).send('Wrong username');
        }
        //verify the password
        const same = argon2.verify(results[0].password, password);
        if(!same) {
            return res.status(401).send('Wrong password');
        }
        //res.status(200).send('Login OK');
        if(results[0].role == 'admin') {
            return res.status(200).send('Login OK, admin');
        }
        res.status(200).send('Login OK');
        
        /// if(err) {
        //     res.status(500).send('Server error');
        // } else {
        //     if(results.length != 1) {
        //         // 1. no match
        //         res.status(401).send('Login failed');
        //     } else {
        //         // 2. get a row
        //         res.status(200).send('Login success');
        //     }
        // }
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


