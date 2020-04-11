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
            
            var retreiveAllRequestInfo = "SELECT r.rid, r.pid, p.liststatus, p.indications, p.allocatedstatus as patient_status, r.allocatedstatus as student_status FROM public.request r LEFT JOIN public.patient p ON r.pId = p.pId WHERE r.studId = $1 ORDER BY r.allocatedstatus";
            pool.query(retreiveAllRequestInfo, [me.studId], (err, data) => {
                // console.log("rowCount" + data.rowCount);
                var i;
                for (i = 0; i < data.rowCount; i++) {
                    //studentId, patientId, indications, request status
                    let requestId = data.rows[i].rid;
                    let indications = data.rows[i].indications;
                    let student_request_status = data.rows[i].student_status;
                    let patient_request_status = data.rows[i].patient_status
                    let isWithdrawn = false;
                    if (student_request_status === 'Withdrawn'){
                        isWithdrawn = true;
                    }
                    let listStatus = data.rows[i].liststatus;
                    console.log(listStatus);
                    let patientId = data.rows[i].pid;
                    truffle_connect.getRequest(requestId, me.ownAddr, (answer) => {
                        let pid = answer[2];
                        console.log("allocated patient id is: ");
                        console.log(pid);
                        if (pid === undefined) {
                            pid = 'None';
                        }
                        me.displayedRequests.push({
                            rid: requestId,
                            studid: me.studId,
                            pid: patientId,
                            indications: indications,
                            allocatedstatus: student_request_status,
                            patientstatus: patient_request_status,
                            isWithdrawn : isWithdrawn,
                            listStatus : listStatus
                        });

                        console.log(me.displayedRequests);

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
    try {
        var requestId = req.body.requestId;

        var withdrawReq_query = "UPDATE public.request SET allocatedStatus = $1 WHERE rid = $2";
        pool.query(withdrawReq_query, ['Withdrawn', requestId], (err, data) => {
            console.log(err);
            if (err === undefined) {
                truffle_connect.withdrawRequest(
                    requestId,
                    this.ownAddr
                );

                req.flash('info', 'Request withdrawn');
                res.redirect('/viewRequests');
            } else {
                req.flash('error', 'An error has occurred! Please try again');
                res.redirect('/viewRequests');
            }
        });
    } catch (error) {
        console.log("ERROR at withdrawReq: " + error);
        return;
    }

});

module.exports = router;
