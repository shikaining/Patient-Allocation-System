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
var listedPatients = [];
var patientIds = [];

/* GET home page. */
router.get('/', async function (req, res, next) {
    this.patientIds = [];
    this.listedPatients = [];
    var username = req.session.username;
    console.log(username);

    if (username === undefined) {
        res.redirect('/login');
    } else {
        let me = this;
        //retrieve all listed patients from db
        var retreiveAllPatientInfo =
            "SELECT * FROM public.patient WHERE public.patient.listStatus = $1 OR public.patient.curedStatus = $2";
        await pool.query(retreiveAllPatientInfo, ['Listed', 'Cured'], (err, data) => {

            //push listed patientIds into patientIds array
            for (var i = 0; i < data.rowCount; i++) {
                me.patientIds.push({
                    patientId: data.rows[i].pid
                });
            }
            //can retrieve patientIds here!

            //retrieve staff1's address to call contract
            var sql_query = "SELECT * FROM public.staff WHERE public.staff.email = $1";
            pool.query(sql_query, ['staff1@gmail.com'], function (err, results) {
                me.staffAddr = results.rows[0].address;

                //retrieve patient pool from contract
                var i;
                for (i = 0; i < me.patientIds.length; i++) {
                    let id = this.patientIds[i].patientId;
                    let indications = data.rows[i].indications;
                    let leadingStudentId = (data.rows[i].leadingstudentid == 0) ? 'None' : data.rows[i].leadingstudentid;
                    let leadingStudentName = data.rows[i].leadingstudentname
                    truffle_connect.getPatient(id, this.staffAddr, (answer) => {
                        //add studentId attr 
                        let requiredId = 'None';
                        var retrieveStudentId_query = "SELECT * FROM public.student WHERE public.student.address = '";
                        retrieveStudentId_query = retrieveStudentId_query + answer[3] + "' ";
                        pool.query(retrieveStudentId_query, (err, results) => {
                            if (results.rowCount > 0) {
                                requiredId = results.rows[0].studid;
                            }
                            me.listedPatients.push({
                                patientId: id,
                                indications: indications,
                                cured: answer[4],
                                studid: requiredId,
                                leadingStudentId: leadingStudentId,
                                leadingStudentName: leadingStudentName
                            });
                        });

                    });
                }

                setTimeout(function () {
                    res.render('viewAllPatients', { title: 'View All Patients', user: username, data: me.listedPatients });

                }, 1000);

            });
        });
    }
    //end of else 
});

module.exports = router;
