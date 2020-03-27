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
        //retrieve current staff object
        var sql_query = "SELECT * FROM public.staff WHERE public.staff.email = $1";

        pool.query(sql_query, [username], (err, data) => {
            staff = data.rows[0];
        });
    }
});

// POST
router.post('/', function (req, res, next) {
    //retrieve information
    var patientId = req.body.patientId;
    var studId = req.body.studentId;

    console.log("Patient ID" + patientId);
    console.log("Student ID" + studId);
    try {
        //Update into Ethereum
        truffle_connect.allocatePatient(
            patientId,
            studentAddr,
            staff.address
        );
        //update postgreSQL Database
        //update allocatedStatus of patient
        var allocatePatient = "UPDATE public.patient SET allocatedStatus = $1, studId = $2 WHERE pid = $3";
        pool.query(allocatePatient, ['Allocated', studId, patientId], (err, data) => {
            console.log(err);
            if (err === undefined) {
                req.flash('info', 'Patient Allocated');
            } else {
                req.flash('error', 'An error has occurred! Please try again');
            }

            //res.redirect('/allocatePatients');
        });
        //update allocatedStatus of request
        var updateRequest_query =
            "UPDATE public.request SET allocatedStatus = $1, WHERE pid = $2 AND studId = $3";
        pool.query(
            updateRequest_query,
            ['Allocated', patientId, studId],
            (err, data) => {
                console.log(err);
                if (err === undefined) {
                    req.flash('info', 'Patient Allocated');
                } else {
                    req.flash('error', 'An error has occurred! Please try again');
                }

                res.redirect('/allocatePatients');
            });
    } catch (error) {
        console.log("ERROR at allocatePatient: " + error);
        return;
    }

});

module.exports = router;
