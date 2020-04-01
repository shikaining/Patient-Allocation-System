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
var staffAddr;
var studentAddr;

/* GET home page. */
router.get('/', async function (req, res, next) {
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
        await pool.query(retreiveAllRequests_query,
            ['Pending'],
            (err, data) => {
                res.render('allocatePatients', { title: 'Allocate Patients', user: username, data: data.rows });
            });
        //retrieve current staff object
        let me = this;
        var sql_query = "SELECT * FROM public.staff WHERE public.staff.email = $1";

        await pool.query(sql_query, [username], (err, data) => {
            me.staff = data.rows[0];
            me.staffAddr = data.rows[0].address;

        });

    }
});

// POST
router.post('/', async function (req, res, next) {
    //retrieve information
    var patientId = req.body.patientId;
    var studId = req.body.studentId;

    console.log("Patient ID" + patientId);
    console.log("Student ID" + studId);

    //retrieve student object
    var retrieveStudentInfo_query =
        "SELECT * FROM public.student WHERE public.student.studid = $1";

    let me = this;
    await pool.query(retrieveStudentInfo_query, [studId],
        (err, data) => {
            me.student = data.rows[0];
            me.studentAddr = data.rows[0].address;
           
        }
    );


    try {
      
        //Update into Ethereum
        let me = this;
        await pool.query(retrieveStudentInfo_query, [studId],
            (err, data) => {
                me.student = data.rows[0];
                me.studentAddr = data.rows[0].address;
                
                truffle_connect.allocatePatient(
                    patientId,
                    me.studentAddr,
                    me.staffAddr
                );
                truffle_connect.getPatient(patientId, this.staffAddr, (answer) => {
                    me.patientInfo = answer;

                });
            }
        );


        //update postgreSQL Database

        //1-update allocatedStatus of patient
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
        //2-update allocatedStatus of request (successful one)
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

                //res.redirect('/allocatePatients');
            });
        //3-update allocatedStatus of request (unsuccessful ones)
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
