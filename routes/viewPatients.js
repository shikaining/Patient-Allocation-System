var express = require('express');
var router = express.Router();

const truffle_connect = require("../connection/app");
const { Pool } = require('pg')

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'api',
    password: 'password',
    port: 5432,
})

var staff;
var addr;

/* GET home page. */
router.get('/', async function (req, res, next) {
    var username = req.session.username;

    console.log(username);

    if (username === undefined) {
        res.redirect('/staffLogin');
    } else {
        //retrieve all patients from db
        var retreiveAllPatientInfo = "SELECT * FROM public.patient";
        pool.query(retreiveAllPatientInfo, (err, data) => {
            console.log("Patient" + data.rowCount);
            res.render('viewPatients', { title: 'View Patients', user: username, data: data.rows });
        });
        //retrieve current staff object
        var sql_query = "SELECT * FROM public.staff WHERE public.staff.email = $1";
        let me = this;
        await pool.query(sql_query, [username], (err, data) => {
            staff = data.rows[0];
            me.addr = staff.address;
        });

        //retrieving patient info to check
        // truffle_connect.getPatient(1, this.addr, (answer) => {
        //     let patientInfo = answer;
        //     //response = [account_balance, all_accounts]
        //     console.log("*****************************");
        //     console.log(patientInfo);
        //     console.log("*****************************");
        // });

    }
});

// POST
router.post('/', function (req, res, next) {
    // Retrieve Information
    var username = req.session.username;
    var patientId = req.body.patientId;

    var listStatus = req.body.listStatus;
    var allocatedStatus = req.body.allocationStatus;
    console.log("Patient ID" + patientId);
    console.log("List Status " + listStatus);
    if (listStatus === 'Not Listed') {
        try {
            //Update into Ethereum
            truffle_connect.listPatient(
                patientId,
                staff.address
            );
            //update postgreSQL Database
            var listPatient = "UPDATE public.patient SET liststatus = $1 WHERE pid = $2";
            pool.query(listPatient, ['Listed', patientId], (err, data) => {
                console.log(err);
                req.flash('info', 'Patient Listed');
                res.redirect('/viewPatients');
            });
        } catch (error) {
            console.log("ERROR at ListPatient in ViewPatients: " + error);
            return;
        }
    } else if (listStatus === 'Listed' && allocatedStatus === 'Not Allocated') {
        try {
            //Update into Ethereum            
            truffle_connect.unlistPatient(
                patientId,
                staff.address
            );
            //update postgreSQL Database
            var unlistPatient = "UPDATE public.patient SET listStatus = $1 WHERE pid = $2";
            pool.query(unlistPatient, ['Not Listed', patientId], (err, data) => {
                console.log(err);
                req.flash('info', 'Patient Unlisted');
                res.redirect('/viewPatients');
            });
        } catch (error) {
            console.log("ERROR at UnlistPatient in ViewPatients: " + error);
            return;
        }
    } else {
        req.flash('error', 'An error has occurred! Please try again');
        res.redirect('/viewPatients');
    }
    //tested getTotalPatients & getPatientInfo

});

module.exports = router;
