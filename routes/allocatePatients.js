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
var student;

/* GET home page. */
router.get('/', function (req, res, next) {
    var username = req.session.username;

    console.log(username);

    if (username === undefined) {
        res.redirect('/staffLogin');
    } else {
        //retrieve all patients
        // var retreiveAllPatientInfo =
        //     "SELECT * FROM public.patient WHERE public.patient.listStatus = $1 AND public.patient.allocatedStatus = $2";
        // pool.query(retreiveAllPatientInfo, ['Listed', 'Pending'], (err, data) => {
        //     console.log("Patient" + data.rowCount);
        //     res.render('allocatePatients', { title: 'Allocate Patients', user: username, data: data.rows });
        // });

        //retrieve all request
        var retreiveAllRequests_query =
            "SELECT * FROM public.request WHERE public.request.allocatedStatus = $1";
        pool.query(retreiveAllRequests_query,
            ['Pending'],
            (err, data) => {
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

    //retrieve student object
    var retrieveStudentInfo_query =
        "SELECT * FROM public.student WHERE public.student.studid = $1";

    pool.query(retrieveStudentInfo_query, [studId], 
        (err, data) => {
        student = data.rows[0];
        console.log(student + "************");
    });

    try {
        //Update into Ethereum
        truffle_connect.allocatePatient(
            patientId,
            student.address,
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
        var successfulRequest_query =
            "UPDATE public.request SET allocatedStatus = $1 WHERE pid = $2 AND studId = $3";
        pool.query(
            successfulRequest_query,
            ['Allocated', patientId, studId],
            (err, data) => {
                console.log(err);
                if (err === undefined) {
                    // req.flash('info', 'Request Updated');
                } else {
                    req.flash('error', 'An error has occurred! Please try again');
                }

                res.redirect('/allocatePatients');
            });
        //update allocatedStatus of request 
        //or update to 'Rejected' if 'Not allocated' is unclear
        var failedRequest_query =
            "UPDATE public.request SET allocatedStatus = $1 WHERE pid = $2 AND studId != $3";
        pool.query(
            failedRequest_query,
            ['Not Allocated', patientId, studId],
            (err, data) => {
                console.log(err);
                if (err === undefined) {
                    req.flash('info', 'Request Updated');
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
