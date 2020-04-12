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
var name;
var addr;
var patients = [];
var patientIds = [];
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
    this.patients = [];
    this.patientIds = [];
    this.patientListTimes = [];
    var username = req.session.username;
    console.log(username);

    if (username === undefined) {
        res.redirect('/staffLogin');
    } else {


        var sql_query = "SELECT * FROM public.staff WHERE public.staff.email = $1";
        pool.query(sql_query, [username], (err, data) => {
          name = data.rows[0].name;
        });

        let me = this;
        //retrieve all patients from db
        var retreiveAllPatientInfo =
            "select * from public.patient ORDER BY liststatus asc, pId desc";
        await pool.query(retreiveAllPatientInfo, (err, data) => {

            //push listed patientIds into patientIds array
            for (var i = 0; i < data.rowCount; i++) {
                me.patientIds.push({
                    patientId: data.rows[i].pid
                });
                me.patientListTimes.push({
                    patientListTime: data.rows[i].listedtimestamp
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
                    let patientListTime = this.patientListTimes[i].patientListTime
                    let indications = data.rows[i].indications;
                    let listingStatus = data.rows[i].liststatus;
                    let allocationStatus = data.rows[i].allocatedstatus;
                    let name = data.rows[i].name;
                    let contact = data.rows[i].contactno;
                    truffle_connect.getPatient(id, this.addr, (answer) => {
                        console.log(answer[3])

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
                                patientName: name,
                                patientContact: contact,
                                indications: indications,
                                listingStatus: listingStatus,
                                allocationStatus: allocationStatus,
                                listedtimestamp: patientListTime,
                                studid: requiredId
                            });
                        });

                    });
                }

                setTimeout(function () {
                    res.render('viewPatients', { title: 'View Patients', user: name, data: me.patients });

                }, 1000);

            });
        });
    }
    //end of else
});

// POST
router.post('/', async function (req, res, next) {
    // Retrieve Information
    var username = req.session.username;
    var patientId = req.body.patientId;
    var listStatus = req.body.listStatus;
    var allocatedStatus = req.body.allocationStatus;
    var patientName = req.body.patientName;
    var patientContact = req.body.patientContact;
    var patientIdToEdit = req.body.patientIdToEdit;

    console.log("Patient ID" + patientId);
    console.log("List Status " + listStatus);
    if (listStatus === 'Not Listed') {
        console.log("Listing...")
        //Update into Ethereum
        await truffle_connect.listPatient(
            patientId,
            staff.address
        ).then(() => {
            //update postgreSQL Database
            //Includes timestamp when it was LISTED to assist in First Come First Serve points calculation when student makes request.
            var listedTimestamp = new Date();
            console.log("TimeStamp : " + listedTimestamp);
            var retrievePatient_query = "select * from public.patient where pid = $1";
            pool.query(retrievePatient_query, [patientId], (err, data) => {
                if (err) {
                    console.log(err)
                    req.flash('info', 'Patient Fail to be Listed');
                    res.redirect('/viewPatients');
                }
                console.log("Timestamp: " + data.rows[0].listedtimestamp)
                if (data.rows[0].listedtimestamp == null) {
                    //Patient has never been listed before, so have to update Timestamp
                    var listPatient_query = "UPDATE public.patient SET liststatus = $1, listedTimestamp = $2 WHERE pid = $3";
                    pool.query(listPatient_query, ['Listed', listedTimestamp, patientId], async (err, data) => {
                        if (err) {
                            console.log(err)
                            /* Error on Database side, so need to unlist again the patient or else mismatch between
                            Database and Contract */
                            await truffle_connect.unlistPatient(
                                patientId,
                                staff.address
                            )
                            console.log("ERROR at ListPatient in ViewPatients FOR PostgreSQL");
                            req.flash('info', 'Patient Fail to be Listed');
                            res.redirect('/viewPatients');
                            return;
                        } else {
                            req.flash('info', 'Patient Listed');
                            res.redirect('/viewPatients');
                        }
                    });

                } else {
                    //patient has been listed before, so we will keep the old listed Timestamp
                    //since there might be cases where other students already submitted request.
                    console.log("REEEE-listing")
                    var listOldPatient_query = "UPDATE public.patient SET liststatus = $1 WHERE pid = $2";
                    pool.query(listOldPatient_query, ['Listed', patientId], (err, data) => {
                        if (err) {
                            console.log(err)
                            req.flash('info', 'Patient Fail to be Listed');
                            res.redirect('/viewPatients');
                        } else {
                            req.flash('info', 'Patient Listed');
                            res.redirect('/viewPatients');
                        }

                    })
                }
            })

        }).catch(error => {
            //Error when listing patient on Contract side.
            console.log("ERROR at ListPatient in ViewPatients FOR *Contract*: ");
            req.flash('error', 'Patient Fail to be Listed due to - ' + error);
            res.redirect('/viewPatients');
            return;
        });
    } else if (listStatus === 'Listed' && allocatedStatus === 'Not Allocated') {
        console.log("Unlisting...")
        //Update into Ethereum
        await truffle_connect.unlistPatient(
            patientId,
            staff.address
        ).then(() => {
            //update postgreSQL Database
            var unlistPatient = "UPDATE public.patient SET liststatus = $1 WHERE pid = $2";
            pool.query(unlistPatient, ['Not Listed', patientId], async (err, data) => {
                if (err) {
                    console.log(err);
                    /* Error on Database side, so need to relist the patient or else mismatch between
                    Database and Contract */
                    await truffle_connect.listPatient(
                        patientId,
                        staff.address
                    )
                    console.log("ERROR at UnlistPatient in ViewPatients FOR PostgreSQL");
                    req.flash('info', 'Patient Fail to be Unlisted');
                    res.redirect('/viewPatients');
                    return;
                } else {
                    req.flash('info', 'Patient Unlisted');
                    res.redirect('/viewPatients');
                }
            })
        }).catch(error => {
            //Error when Unlisting patient on Contract side.
            console.log("ERROR at UnlistPatient in ViewPatients FOR *Contract*: ");
            req.flash('error', 'Patient Fail to be Unlisted due to - ' + error);
            res.redirect('/viewPatients');
            return;
        });
    } else if (patientIdToEdit !== undefined) {
        //editing patient paticulars.
        let rawIndications = req.body.indications;
        let solidityIndication = [];
        let dbIndication = "{";
        for (i = 0; i <= rawIndications.length - 1; i++) {
            if (i > 0) {
                dbIndication += ",";
            }
            dbIndication += '"' + indicationsArray[parseInt(rawIndications[i])] + '"';
            solidityIndication.push(parseInt(rawIndications[i]));
        }
        dbIndication += "}";

        //update patient db
        console.log(dbIndication);
        console.log(patientName);

        try {
            var owner;
            var resolution;

            var retrievePatient_query = "select * from public.patient where pid = $1";
            pool.query(retrievePatient_query, [patientIdToEdit], (err, data) => {
                owner = data.rows[0].studid;
                console.log(owner);

                resolution = data.rows[0].curedstatus;
                console.log(resolution);
                if (resolution === 'Not Cured') {
                    resolution = false;
                }
                else {
                    resolution = true;
                }
                if (owner !== null) {
                    var retrieveStudent_query = "select * from public.patient where studid = $1";
                    pool.query(retrieveStudent_query, [owner], (err, data) => {
                        owner = data.rows[0].address;

                        var editPatient = "UPDATE public.patient SET name = $1, contactNo = $2, indications = $3 WHERE pid = $4";
                        pool.query(editPatient, [patientName, patientContact, dbIndication, patientIdToEdit], async (err, data) => {
                            console.log(err);
                            if (err === undefined) {
                                truffle_connect.updatePatient(
                                    patientIdToEdit,
                                    patientName,
                                    patientContact,
                                    solidityIndication,
                                    owner,
                                    resolution,
                                    staff.address
                                ).then(pass => {
                                    req.flash('info', 'Patient details updated');
                                    res.redirect('/viewPatients');
                                }).catch(error => {
                                    req.flash('error', 'An error has occurred! Please try again. Error due to - ' + error);
                                    res.redirect('/viewPatients')
                                })

                            } else {
                                req.flash('error', 'An error has occurred! Please try again');
                                console.log(err);
                                res.redirect('/viewPatients');
                            }
                            //res.redirect('/allocatePatients');
                        });
                    });
                }
                else {
                    truffle_connect.getPatient(patientIdToEdit, staff.address, (answer) => {
                        owner = answer[3];
                    });
                    var editPatient = "UPDATE public.patient SET name = $1, contactNo = $2, indications = $3 WHERE pid = $4";
                    pool.query(editPatient, [patientName, patientContact, dbIndication, patientIdToEdit], async (err, data) => {
                        console.log(err);
                        if (err === undefined) {
                            truffle_connect.updatePatient(
                                patientIdToEdit,
                                solidityIndication,
                                owner,
                                resolution,
                                staff.address
                            ).then(pass => {
                                req.flash('info', 'Patient details updated');
                                res.redirect('/viewPatients');
                            }).catch(error => {
                                req.flash('error', 'An error has occurred! Please try again. Error due to - ' + error);
                                res.redirect('/viewPatients')
                            })

                        } else {
                            req.flash('error', 'An error has occurred! Please try again');
                            console.log(err);
                            res.redirect('/viewPatients');
                        }
                        //res.redirect('/allocatePatients');
                    });
                }
            });

        } catch (error) {
            console.log("ERROR at updatePatient: " + error);
            return;
        }
    } else {
        req.flash('error', 'An error has occurred! Please try again');
        res.redirect('/viewPatients');
    }
});

module.exports = router;
