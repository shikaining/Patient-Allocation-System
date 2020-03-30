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
/* GET home page. */
router.get('/', function (req, res, next) {
    var username = req.session.username;

    console.log(username);

    if (username === undefined) {
        res.redirect('/login');
    } else {

        //retrieve current student object
        var sql_query =
            "SELECT * FROM public.student WHERE public.student.email = $1";
        pool.query(sql_query, [username], (err, data) => {
            student = data.rows[0];
            console.log(student)

            //retrieve all listed patients from db
            var retreiveAllocatedRequest =
            "SELECT * FROM public.request WHERE public.request.allocatedStatus = $1 AND public.request.studId = $2";
            pool.query(retreiveAllocatedRequest, ['Allocated', student.studid], (err, data) => {
                res.render('resolveRequests', { title: 'Resolve Requests', user: username, data: data.rows });
            });
        });


    }
});

// POST
router.post('/', async function (req, res, next) {
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
                req.flash('info', 'Request Resolved');
                res.redirect('/resolveRequests');
            } else {
                req.flash('error', 'An error has occurred! Please try again');
            }

            //res.redirect('/allocatePatients');
        });
});

module.exports = router;
