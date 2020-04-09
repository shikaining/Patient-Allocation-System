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
var displayedRequests = [];
var ownAddr;
var studId;

/* GET home page. */
router.get('/', function (req, res, next) {
    var username = req.session.username;
    console.log(username);
    this.displayedRequests = [];

    if (username === undefined) {
        res.redirect('/login');
    } else {
        let me = this;
        var sql_query =
            "SELECT * FROM public.student WHERE public.student.email ='" + username + "'";
        pool.query(sql_query, (err, user) => {
            // console.log(user);
            me.studId = user.rows[0].studid;
            me.ownAddr = user.rows[0].address;

            var retreiveAllRequestInfo = "SELECT * FROM public.request WHERE public.request.studId = $1";
            pool.query(retreiveAllRequestInfo, [me.studId], (err, data) => {
                // console.log("rowCount" + data.rowCount);
                var i;
                for (i = 0; i < data.rowCount; i++) {
                    //studentId, patientId, indications, request status
                    let requestId = data.rows[i].rid;
                    let indications = data.rows[i].indications;
                    let status = data.rows[i].allocatedstatus;
                    let patientId = data.rows[i].pid;
                    truffle_connect.getRequest(requestId, me.ownAddr, (answer) => {
                        let pid = answer[2];
                        console.log("allocated patient id is: ");
                        console.log(pid);
                        if (pid === undefined) {
                            pid = 'None';
                        }
                        me.displayedRequests.push({
                            rid : requestId,
                            studid: me.studId,
                            pid: patientId,
                            indications: indications,
                            allocatedstatus: status
                        });

                    });
                    // setTimeout(function () {

                    // }, 1000);
                }//ends for loop
                setTimeout(function () {
                    res.render('viewRequests', { title: 'View Requests', user: username, data: me.displayedRequests });
                }, 1000);
            });
        });
    }
});

// POST
router.post('/', function (req, res, next) {

    var requestId = req.body.requestId;

    var editPatient = "UPDATE public.request SET allocatedStatus = $1 WHERE rid = $2";
    pool.query(editPatient, ['Withdrawn', requestId], async (err, data) => {
        console.log(err);
        if (err === undefined) {
            req.flash('info', 'Request withdrawn');
            res.redirect('/viewRequests');
        } else {
            req.flash('error', 'An error has occurred! Please try again');
            res.redirect('/viewRequests');
        }
    });
});

module.exports = router;
