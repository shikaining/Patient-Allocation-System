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
var name;

var indicationsArray = [
    "CD Exam Case",
    "Dental Public Health",
    "Endodontics",
    "Fixed Prosthodontics",
    "Operative Dentistry",
    "Oral Surgery",
    "Orthodontics",
    "Pedodontics",
    "Periodontics",
    "Removable Prosthodontics"
];

/* GET home page. */
router.get('/', async function (req, res, next) {
    this.patientIds = [];
    this.listedPatients = [];
    var username = req.session.username;
    console.log(username);

    if (username === undefined) {
        res.redirect('/login');
    } else {

        var sql_query = "SELECT * FROM public.student WHERE public.student.email = $1";
        pool.query(sql_query, [username], (err, data) => {
            name = data.rows[0].name;
            studentIndication = data.rows[0].indicationcount;
        });


        var indicationQuota_query = "select * from public.indicationquota";

        pool.query(indicationQuota_query, (err, data) => {
            indicationRecords = data.rows[0].indicationarray;
        });


        let me = this;
        //retrieve all listed patients from db
        var retreiveAllPatientInfo =
        "SELECT * FROM public.patient WHERE public.patient.listStatus = $1 OR public.patient.resolvedStatus = $2";
        pool.query(retreiveAllPatientInfo, ['Listed', 'Resolved'], (err, data) => {

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
                        retrieveStudentId_query = retrieveStudentId_query + answer[1] + "' ";
                        pool.query(retrieveStudentId_query, (err, results) => {
                            if (results.rowCount > 0) {
                                requiredId = results.rows[0].studid;
                            }
                            me.listedPatients.push({
                                patientId: id,
                                indications: indications,
                                resolvedStatus: answer[2],
                                studid: requiredId,
                                leadingStudentId: leadingStudentId,
                                leadingStudentName: leadingStudentName
                            });
                        });

                    });
                }

                setTimeout(function () {
                    res.render('viewAllPatients', { title: 'View All Patients', user: name, indicationsArray: indicationsArray,
                    indicationRecords: indicationRecords,studentRecords : studentIndication,data: me.listedPatients });

                }, 1000);

            });
        });
    }
    //end of else
});

module.exports = router;
