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
var staffAddr;
var username;
var name;

/* GET home page. */
router.get('/', async function (req, res, next) {
    username = req.session.username;

    console.log(username);

    if (username === undefined) {
        res.redirect('/staffLogin');
    } else {

        var sql_query = "SELECT * FROM public.staff WHERE public.staff.email = $1";
        pool.query(sql_query, [username], (err, data) => {
          name = data.rows[0].name;
        });


        var sql_query = "SELECT * FROM public.staff WHERE public.staff.email = $1";
        pool.query(sql_query, ['staff1@gmail.com'], (err, data) => {
            var staffAddr = data.rows[0].address;
            truffle_connect.getPatient(1, staffAddr, (answer) => {
                console.log(answer);
            });
        });


        //retrieve all patients to be allocated
        var retreiveAllRequests_query =
            "SELECT * FROM public.patient WHERE public.patient.allocatedStatus = $1 AND public.patient.listStatus = $2";
        await pool.query(retreiveAllRequests_query,
            ['Not Allocated', 'Listed'],
            (err, data) => {
                res.render('allocatePatients', { title: 'Allocate Patients', user: name, data: data.rows });
            });
    }
});

// POST
router.post('/', async function (req, res, next) {
    //retrieve information frmo frontend
    var patientId = req.body.patientId;
    var studId = req.body.studentId;
    var requestId;

    console.log("Patient ID" + patientId);
    console.log("Student ID" + studId);

    //retrieve student object
    var retrieveStudentInfo_query =
        "SELECT * FROM public.student WHERE public.student.studid = $1";

    let me = this;
    try {

        //Update into Ethereum
        //retrieve current staff object
        var sql_query = "SELECT * FROM public.staff WHERE public.staff.email = $1";
        pool.query(sql_query, [me.username], (err, data) => {
            me.staff = data.rows[0];
            me.staffAddr = data.rows[0].address;
            var requesId_query =
                "SELECT * FROM public.request WHERE public.request.pid = $1"
                + " AND public.request.studid = $2 AND request.allocatedstatus = 'Pending'";
            pool.query(requesId_query, [patientId, studId], (err, data) => {
                requestId = data.rows[0].rid;
                truffle_connect.allocatePatient(
                    requestId,
                    patientId,
                    me.staffAddr
                ).then(pass => {
                    //update postgreSQL Database

                    //1-update allocatedStatus of patient
                    var allocatePatient = "UPDATE public.patient SET allocatedStatus = $1, studId = $2 WHERE pid = $3";
                    pool.query(allocatePatient, ['Allocated', studId, patientId], (err, data) => {
                        console.log("1-update allocatedStatus of patient - Start")
                        if (err === undefined) {
                            //2-update allocatedStatus of request (successful one)
                            var successfulRequest_query =
                                "UPDATE public.request SET allocatedStatus = $1 WHERE rid = $2";
                            console.log(requestId);
                            pool.query(
                                successfulRequest_query,
                                ['Allocated', requestId],
                                (err, data) => {
                                    console.log("2-update allocatedStatus of request (successful one) - Start")
                                    if (err === undefined) {
                                        //3-update allocatedStatus of request (unsuccessful ones)
                                        var failedRequest_query =
                                            "UPDATE public.request SET allocatedStatus = $1 WHERE pid = $2 AND studId != $3";
                                        pool.query(
                                            failedRequest_query,
                                            ['Not Allocated', patientId, studId],
                                            (err, data) => {
                                                console.log("3-update allocatedStatus of request (unsuccessful ones) - Start")
                                                if (err === undefined) {
                                                    // req.flash('info', 'Request Updated');
                                                    req.flash('info', 'Patient Allocated')
                                                } else {
                                                    req.flash('error', 'An error has occurred! Please try again');
                                                }
                                            console.log("3-update allocatedStatus of request (unsuccessful ones) - End")

                                            res.redirect('/allocatePatients');
                                        });
                                    } else {
                                        req.flash('error', 'An error has occurred! Please try again');
                                    }
                                    console.log("2-update allocatedStatus of request (successful one) - End")
                                    //res.redirect('/allocatePatients');
                            });
                        } else {
                            req.flash('error', 'An error has occurred! Please try again');
                        }
                        console.log("1-update allocatedStatus of patient - END")
                        //res.redirect('/allocatePatients');
                    });
                }).catch(error => {
                    console.log("Caught error within AllocatePatient.js")
                    req.flash('error', 'Failed to Allocate Patient due to - ' + error)
                    return;
                });
            });
        });

        //AlL this commented down below has been shifted up

        // truffle_connect.getPatient(patientId, this.staffAddr, (answer) => {
        //     console.log(answer);
        // });

        //update postgreSQL Database

        // //1-update allocatedStatus of patient
        // var allocatePatient = "UPDATE public.patient SET allocatedStatus = $1, studId = $2 WHERE pid = $3";
        // pool.query(allocatePatient, ['Allocated', studId, patientId], (err, data) => {
        //     console.log("1-update allocatedStatus of patient - Start")
        //     if (err === undefined) {
        //         req.flash('info', 'Patient Allocated');
        //     } else {
        //         req.flash('error', 'An error has occurred! Please try again');
        //     }
        //     console.log("1-update allocatedStatus of patient - END")
        //     //res.redirect('/allocatePatients');
        // });
        // //2-update allocatedStatus of request (successful one)
        // var successfulRequest_query =
        //     "UPDATE public.request SET allocatedStatus = $1 WHERE rid = $2";
        // console.log(requestId);
        // pool.query(
        //     successfulRequest_query,
        //     ['Allocated', requestId],
        //     (err, data) => {
        //         console.log("2-update allocatedStatus of request (successful one) - Start")
        //         if (err === undefined) {
        //             // req.flash('info', 'Request Updated');
        //         } else {
        //             req.flash('error', 'An error has occurred! Please try again');
        //         }
        //         console.log("2-update allocatedStatus of request (successful one) - End")
        //         //res.redirect('/allocatePatients');
        //     });
        // //3-update allocatedStatus of request (unsuccessful ones)
        // var failedRequest_query =
        //     "UPDATE public.request SET allocatedStatus = $1 WHERE pid = $2 AND studId != $3";
        // pool.query(
        //     failedRequest_query,
        //     ['Not Allocated', patientId, studId],
        //     (err, data) => {
        //         console.log("3-update allocatedStatus of request (unsuccessful ones) - Start")
        //         if (err === undefined) {
        //             req.flash('info', 'Request Updated');
        //         } else {
        //             req.flash('error', 'An error has occurred! Please try again');
        //         }
        //         console.log("3-update allocatedStatus of request (unsuccessful ones) - End")

        //         res.redirect('/allocatePatients');
        //     });



    } catch (error) {
        console.log("ERROR at allocatePatient: " + error);
        return;
    }

});

module.exports = router;
