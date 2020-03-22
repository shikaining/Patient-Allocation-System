var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'api',
    password: 'password',
    port: 5432,
})

/* GET home page. */
router.get('/', function (req, res, next) {
    var username = req.session.username;

    console.log(username);

    if (username === undefined) {
        res.redirect('/login');
    } else {
        var sql_query = "SELECT * FROM public.student WHERE public.student.email ='" + username + "'";
        pool.query(sql_query, (err, user) => {
            console.log(user);
            var studId = user.rows[0].studid;
            console.log("student id" + studId);
            var retreiveAllRequestInfo = "SELECT * FROM public.request WHERE public.request.studId = $1";
            pool.query(retreiveAllRequestInfo, [studId], (err, data) => {
                console.log("rowCount" + data.rowCount);
                res.render('viewRequests', { title: 'View Requests', user: username, data: data.rows });
            });
        });
    }
});

// POST
router.post('/', function (req, res, next) {
    var username = req.session.username;
    var patientId = req.body.patientId;

    var listStatus = req.body.listStatus;
    var allocatedStatus = req.body.allocationStatus;
    console.log("Patient ID" + patientId);
    console.log("List Status " + listStatus);
    if (listStatus === 'Not Listed') {
        var listPatient = "UPDATE public.patient SET liststatus = $1 WHERE pid = $2";
        pool.query(listPatient, ['Listed', patientId], (err, data) => {
            console.log(err);
            req.flash('info', 'Patient Listed');
            res.redirect('/viewPatients');
        });
    } else if (listStatus === 'Listed' && allocatedStatus === 'Not Allocated'){
        var unlistPatient = "UPDATE public.patient SET listStatus = $1 WHERE pid = $2";
        pool.query(unlistPatient, ['Not Listed', patientId], (err, data) => {
            console.log(err);
            req.flash('info', 'Patient Unlisted');
            res.redirect('/viewPatients');
        });
    } else {
        req.flash('error', 'An error has occurred! Please try again');
        res.redirect('/viewPatients');
    }
});

module.exports = router;
