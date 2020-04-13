var express = require("express");
var router = express.Router();
const db = require("../connection/queries");
const truffle_connect = require("../connection/app");
var CryptoJS = require('crypto-js');

const { Pool } = require("pg");
/* --- V7: Using Dot Env ---
const pool = new Pool({
user: 'postgres',
host: 'localhost',
database: 'postgres',
password: '********',
port: 5432,
})
*/
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "api",
    password: "password",
    port: 5432
});

var indicationsArray = new Array(10);

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('registerStudentAccount', { title: 'Register for Student Account' });
});


router.post('/', function (req, res, next) {

    indicationsArray[0] = req.body.cDExamCase;
    indicationsArray[1] = req.body.dentalPublicHealth;
    indicationsArray[2] = req.body.endodontics;
    indicationsArray[3] = req.body.fixedProsthodontics;
    indicationsArray[4] = req.body.operativeDentistry;
    indicationsArray[5] = req.body.oralSurgery;
    indicationsArray[6] = req.body.orthodontics;
    indicationsArray[7] = req.body.pedodontics;
    indicationsArray[8] = req.body.periodontics;
    indicationsArray[9] = req.body.removableProsthodontics;

    console.log("indication array" + indicationsArray);

    var name = req.body.studentName;
    var nric = req.body.studentNRIC;
    var contactNo = req.body.studentContact;
    var enrolYear = req.body.studentYear;
    var address = req.body.studentAddress.toLowerCase();
    var email = req.body.studentEmail;
    var password = req.body.password;
    nric = CryptoJS.AES.encrypt(nric, 'IS4302').toString();
    password = CryptoJS.AES.encrypt(password, 'IS4302').toString();
    console.log(password)
        var sql_query = "INSERT into Student(name, nric, contactNo, email, password, address, enrolYear, indicationCount, expectedCount) values($1,$2,$3,$4,$5,$6,$7,$8,$9)";

        pool.query(sql_query, [name, nric, contactNo, email, password, address, enrolYear, indicationsArray,indicationsArray], (err, data) => {
            if (err === undefined) {
                req.flash('info', 'Account successfully created');
                res.redirect('/registerStudentAccount');
            } else {
                req.flash('error', 'An error has occurred! Please try again');
                console.log(err);
                res.redirect('/registerStudentAccount');
            }

        });

    


});



module.exports = router;
