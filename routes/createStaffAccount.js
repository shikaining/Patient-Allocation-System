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


var staff;
var verification;
var currAddr;
var name;

router.get('/', async function (req, res, next) {
    var username = req.session.username;

    console.log(username);

    if (username === undefined) {
        res.redirect('/staffLogin');
    } else {
        //retrieve current staff object
        let me = this;
        var sql_query = "SELECT * FROM public.staff WHERE public.staff.email = $1";

        await pool.query(sql_query, [username], (err, data) => {
            name = data.rows[0].name;
            verification = data.rows[0].verification;
            me.currAddr = data.rows[0].address;
            res.render('createStaffAccount', { title: 'Create Staff Account', user: name, data: data.rows });
        });
    }
});


router.post('/', function (req, res, next) {

    var name = req.body.staffName;
    var nric = req.body.staffNRIC;
    var contactNo = req.body.staffContact;
    var address = req.body.staffAddress.toLowerCase();
    var email = req.body.staffEmail;
    var password = req.body.password;
    var accountType = req.body.accountType;
    var staffVerification = req.body.verification;
    console.log("post verification " + verification);
    console.log("post staffVerification" + staffVerification);
    nric = CryptoJS.AES.encrypt(nric, 'IS4302').toString();
    password = CryptoJS.AES.encrypt(password, 'IS4302').toString();
        if (verification === staffVerification) {
            console.log("here");
            if (verification !== 'systemadmin') {
                req.flash('error', 'An error has occurred. You do not have permission to create a staff account');
                res.redirect('/createStaffAccount');
            } else if (staffVerification === 'systemadmin') {
                try {
                    var sql_query = "INSERT into Staff(name, nric, contactNo, email, password, address, verification) values($1,$2,$3,$4,$5,$6,$7)";
                    pool.query(sql_query, [name, nric, contactNo, email, password, address, accountType], (err, data) => {
                        if (err === undefined) {
                            if (accountType === 'staff') {
                                truffle_connect.createAdminUserInPatient(
                                    address,
                                    this.currAddr
                                );
                                truffle_connect.createAdminUserInReq(
                                    address,
                                    this.currAddr
                                );
                            }
                            else if (accountType === 'poweruser') {
                                truffle_connect.createPowerUserInPatient(
                                    address,
                                    this.currAddr
                                );
                                truffle_connect.createPowerUserInReq(
                                    address,
                                    this.currAddr
                                );
    
                            }
    
                            req.flash('info', 'Account successfully created');
                            res.redirect('/createStaffAccount');
                        } else {
                            req.flash('error', 'An error has occurred! Please try again');
                            console.log(err);
                            res.redirect('/createStaffAccount');
                        }
    
                    });
    
                } catch (error) {
                    console.log("ERROR at create: " + error);
                    return;
                }
    
            }
        } else {
            req.flash('error', 'An error has occurred. You do not have the correct verification to create a staff account');
            res.redirect('/createStaffAccount');
        }
});

module.exports = router;
