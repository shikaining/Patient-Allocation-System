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

/* GET home page. */
router.get('/', function (req, res, next) {
    var username = req.session.username;

    console.log(username);

    if (username === undefined) {
        res.redirect('/staffLogin');
    } else {
        //retrieve all patients
        var retreiveAllPatientInfo =
            "SELECT * FROM public.patient WHERE public.patient.listStatus = $1 AND public.patient.allocatedStatus = $2";
        pool.query(retreiveAllPatientInfo, ['Listed', 'Pending'], (err, data) => {
            console.log("Patient" + data.rowCount);
            res.render('allocatePatients', { title: 'Allocate Patients', user: username, data: data.rows });
        });
    }
});

// POST
router.post('/', function (req, res, next) {
    //retrieve information
    var username = req.session.username;
    var patientId = req.body.patientId;
    var studId = req.body.studentId;

    console.log("Patient ID" + patientId);

    //Update into Ethereum
    //
    //update postgreSQL Database
    var allocatePatient = "UPDATE public.patient SET allocatedStatus = $1, studId = $2 WHERE pid = $3";
    pool.query(allocatePatient, ['Allocated', studId, patientId], (err, data) => {
        console.log(err);
        if (err === undefined) {
            req.flash('info', 'Patient Allocated');
        } else {
            req.flash('error', 'An error has occurred! Please try again');
        }

        res.redirect('/allocatePatients');
    });

});

module.exports = router;
