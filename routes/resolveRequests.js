var express = require('express');
var router = express.Router();

const db = require("../connection/queries");
const truffle_connect = require("../connection/app");
const { Pool } = require('pg')

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'api',
    password: 'password',
    port: 5432,
})

var student;
var studentAddr;
var transferStudentAddr;
var patientInfo;
var staffAddr;

/* GET home page. */
router.get('/', async function (req, res, next) {
    var username = req.session.username;

    console.log(username);

    if (username === undefined) {
        res.redirect('/login');
    } else {

        //retrieve current student object
        let me = this;
        var sql_query =
            "SELECT * FROM public.student WHERE public.student.email = $1";
        await pool.query(sql_query, [username], (err, data) => {
            me.student = data.rows[0];
            me.studentAddr = data.rows[0].address;

            //retrieve all listed patients from db
            var retreiveAllocatedRequest =
                "SELECT * FROM public.request WHERE public.request.allocatedStatus = $1 AND public.request.studId = $2";
            pool.query(retreiveAllocatedRequest, ['Allocated', this.student.studid], (err, data) => {
                res.render('resolveRequests', { title: 'Operative Dentistry Course Record', user: username, data: data.rows });
            });
        });


    }
});

// POST
router.post('/', async function (req, res, next) {

    var transferStudentId = req.body.transferStudentId;
    var patientId;
    var studId;

    if (transferStudentId === undefined) {
        studId = req.body.studentId;
        patientId = req.body.patientId;
    } else {
        studId = req.body.trfstudentId;
        patientId = req.body.transferPatientId;
    }

    if (transferStudentId === undefined) {
        //resolve patients
        //update request table allocated status to 'Resolved'
        var resolveRequest = "UPDATE public.request SET allocatedStatus = $1, studId = $2 WHERE pid = $3";
        pool.query(resolveRequest, ['Resolved', studId, patientId], (err, data) => {
            console.log(err);
            if (err === undefined) {
            } else {
                req.flash('error', 'An error has occurred! Please try again');
            }
            //res.redirect('/allocatePatients');
        });
        //update patient table liststatus to 'unlisted' and curedStatus to 'cured'
        var successfulRequest_query =
            "UPDATE public.patient SET allocatedStatus = $1, listStatus = $2, curedStatus = $3 WHERE pid = $4 AND studId = $5";
        pool.query(
            successfulRequest_query,
            ['Allocated', 'Unlisted', 'Cured', patientId, studId],
            (err, data) => {
                console.log(err);
                if (err === undefined) {
                    req.flash('info', 'Patient Resolved');
                    res.redirect('/resolveRequests');
                } else {
                    req.flash('error', 'An error has occurred! Please try again');
                }
            });
        truffle_connect.resolvePatient(
            patientId,
            this.studentAddr
        );
    } else {
        //transfer patient
        //retrieve TRANSFER student object
        var retrieveStudentInfo_query =
            "SELECT * FROM public.student WHERE public.student.studid = $1";

        let me = this;
        await pool.query(retrieveStudentInfo_query, [transferStudentId],
            (err, data) => {
                me.transferStudentAddr = data.rows[0].address;

            }
        );

        console.log()

        try {

            //update student Id on request table
            var transferRequest = "UPDATE public.request SET studId = $1 WHERE pid = $2";
            pool.query(transferRequest, [transferStudentId, patientId], (err, data) => {
                console.log(err);
                if (err === undefined) {
                } else {
                    req.flash('error', 'An error has occurred! Please try again');
                }
            });

            //update student Id on patient table
            var transferPatient = "UPDATE public.patient SET studId = $1 WHERE pid = $2";
            pool.query(transferPatient, [transferStudentId, patientId], (err, data) => {
                console.log(err);
                if (err === undefined) {
                    req.flash('info', 'Patient Transferred');
                    res.redirect('/resolveRequests');
                } else {
                    req.flash('error', 'An error has occurred! Please try again');
                }
            });

            truffle_connect.studentTransfer(
                patientId,
                this.transferStudentAddr,
                this.studentAddr
            );
        }//end try
        catch (error) {
            console.log("ERROR at transPatient: " + error);
            return;
        }

    }
});

module.exports = router;
