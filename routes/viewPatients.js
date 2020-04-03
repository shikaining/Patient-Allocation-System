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
var addr;
var patients = [];
var patientIds = [];

/* GET home page. */
router.get('/', async function (req, res, next) {
    this.patients = [];
    this.patientIds = [];
    var username = req.session.username;
    console.log(username);

    if (username === undefined) {
        res.redirect('/staffLogin');
    } else {
        let me = this;
        //retrieve all patients from db
        var retreiveAllPatientInfo =
            "SELECT * FROM public.patient";
        await pool.query(retreiveAllPatientInfo, (err, data) => {

            //push listed patientIds into patientIds array
            for (var i = 0; i < data.rowCount; i++) {
                me.patientIds.push({
                    patientId: data.rows[i].pid
                });
            }

            //retrieve current staff address
            var sql_query = "SELECT * FROM public.staff WHERE public.staff.email = $1";

            pool.query(sql_query, [username], (err, results) => {
                staff = results.rows[0];
                me.addr = staff.address;
                //retrieve all patients from contract
                var i;
                for (i = 0; i < me.patientIds.length; i++) {
                    let id = this.patientIds[i].patientId;
                    let indications = data.rows[i].indications;
                    let listingStatus = data.rows[i].liststatus;
                    let allocationStatus = data.rows[i].allocatedstatus;
                    truffle_connect.getPatient(id, this.addr, (answer) => {

                        //add studentId attr 
                        let requiredId = 'None';
                        var retrieveStudentId_query = "SELECT * FROM public.student WHERE public.student.address = '";
                        retrieveStudentId_query = retrieveStudentId_query + answer[3] + "' ";
                        pool.query(retrieveStudentId_query, (err, results) => {
                            if (results.rowCount > 0) {
                                requiredId = results.rows[0].studid;
                            }
                            me.patients.push({
                                patientId: id,
                                patientName: answer[0],
                                patientContact: answer[1],
                                indications: indications,
                                listingStatus: listingStatus,
                                allocationStatus: allocationStatus,
                                studid: requiredId
                            });
                        });

                    });
                }

                setTimeout(function () {
                    res.render('viewPatients', { title: 'View Patients', user: username, data: me.patients });

                }, 1000);

            });
        });
    }
    //end of else 
});

// POST
router.post('/', function (req, res, next) {
    // Retrieve Information
    var username = req.session.username;
    var patientId = req.body.patientId;

    var listStatus = req.body.listStatus;
    var allocatedStatus = req.body.allocationStatus;
    console.log("Patient ID" + patientId);
    console.log("List Status " + listStatus);
    if (listStatus === 'Not Listed') {
        try {
            //Update into Ethereum
            truffle_connect.listPatient(
                patientId,
                staff.address
            );
            //update postgreSQL Database
            var listPatient = "UPDATE public.patient SET liststatus = $1 WHERE pid = $2";
            pool.query(listPatient, ['Listed', patientId], (err, data) => {
                console.log(err);
                req.flash('info', 'Patient Listed');
                res.redirect('/viewPatients');
            });
        } catch (error) {
            console.log("ERROR at ListPatient in ViewPatients: " + error);
            return;
        }
    } else if (listStatus === 'Listed' && allocatedStatus === 'Not Allocated') {
        try {
            //Update into Ethereum
            truffle_connect.unlistPatient(
                patientId,
                staff.address
            );
            //update postgreSQL Database
            var unlistPatient = "UPDATE public.patient SET listStatus = $1 WHERE pid = $2";
            pool.query(unlistPatient, ['Not Listed', patientId], (err, data) => {
                console.log(err);
                req.flash('info', 'Patient Unlisted');
                res.redirect('/viewPatients');
            });
        } catch (error) {
            console.log("ERROR at UnlistPatient in ViewPatients: " + error);
            return;
        }
    } else {
        req.flash('error', 'An error has occurred! Please try again');
        res.redirect('/viewPatients');
    }
    //tested getTotalPatients & getPatientInfo

});

module.exports = router;
