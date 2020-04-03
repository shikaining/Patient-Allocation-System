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

var staffAddr;
var patientIds = [];
var unallocatedPatients = [];
/* GET home page. */
router.get('/', async function (req, res, next) {
    var username = req.session.username;
    console.log(username);
    this.patientIds = [];
    this.unallocatedPatients = [];

    if (username === undefined) {
        res.redirect('/login');
    } else {
        let me = this;
        //retrieve all listed and unallocated patients from db
        var retreiveAllPatientInfo =
            "SELECT * FROM public.patient WHERE public.patient.listStatus = $1" +
            " AND public.patient.allocatedStatus != $2";
        await pool.query(retreiveAllPatientInfo, ['Listed', 'Allocated'], (err, data) => {

            //push required patientIds into patientIds array
            for (var i = 0; i < data.rowCount; i++) {
                me.patientIds.push({
                    patientId: data.rows[i].pid
                });
            }

            //retrieve staff1's address to call contract
            var sql_query = "SELECT * FROM public.staff WHERE public.staff.email = $1";
            pool.query(sql_query, ['staff1@gmail.com'], function (err, results) {
                me.staffAddr = results.rows[0].address;

                //retrieve patients from contract
                var i;
                for (i = 0; i < me.patientIds.length; i++) {
                    let id = this.patientIds[i].patientId;
                    let indications = data.rows[i].indications;
                    truffle_connect.getPatient(id, this.staffAddr, (answer) => {

                        me.unallocatedPatients.push({
                            patientId: id,
                            indications: indications
                        });


                    });
                }

                setTimeout(function () {
                    res.render('viewAllUnallocatedPatients', { title: 'View All Unallocated Patients', user: username, data: me.unallocatedPatients });

                }, 1000);


            });

        });
    }
});

// POST
router.post('/', async function (req, res, next) {
    //retrieve information
    var username = req.session.username;
    var patientId = req.body.patientId;

    rawStudent = await db.select(
        "public.student",
        "studId",
        `public.student.email='` + username + `'`
    );

    var stuId = rawStudent.rows[0].studid;
    var indications = req.body.indications;
    let dbIndication = "{";
    dbIndication += indications;
    dbIndication += "}";

    try {
        //update into ethereum -- waiting for contract
        //
        //update postgreSQL database
        var getRequestInfo = "SELECT * FROM public.request WHERE public.request.studId = $1 AND public.request.pId = $2";
        pool.query(getRequestInfo, [stuId, patientId], (err, data) => {
            console.log("data for get request" + data.rowCount);
            if (data.rowCount !== 0) {
                req.flash("error", "You have already made a request");
                res.redirect("/viewAllUnallocatedPatients");
            } else {
                //create new request
                var requestPatient_query =
                    "INSERT INTO public.request(studId, pId, allocatedStatus, indications) values($1,$2,$3,$4)";
                pool.query(
                    requestPatient_query,
                    [
                        stuId,
                        patientId,
                        "Pending",
                        dbIndication
                    ],
                    (err, data) => {
                        if (err) {
                            req.flash("error", "Failed to create request");
                            console.log("Error in query")
                            console.log(err)
                        } else {
                            req.flash("info", "Requested Successfully");
                            res.redirect("/viewRequests");
                        }
                        //res.redirect("/viewAllPatients");
                    }
                );
            }
        });

    } catch (error) {
        console.log("ERROR at RequestPatient: " + error);
        return;
    }

});

module.exports = router;
