
var express = require('express');
var router = express.Router();
const moment = require('moment');

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
                    let patientTimestamp = moment(data.rows[i].listedtimestamp).format('do MMM YYYY, HH:mm');
                    truffle_connect.getPatient(id, this.staffAddr, (answer) => {

                        me.unallocatedPatients.push({
                            patientId: id,
                            indications: indications,
                            patientTimestamp : patientTimestamp

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
        "*",
        `public.student.email='` + username + `'`
    );
    
    var stuId = rawStudent.rows[0].studid;
    var indications = req.body.indications;
    let dbIndication = "{";
    dbIndication += indications;
    dbIndication += "}";
    
    indications = indications.split(",")
    console.log(indications)

    try {
        //update into ethereum -- waiting for contract 
        // Only update after calculating score below.
        //
        //update postgreSQL database
        var getRequestInfo = "SELECT * FROM public.request WHERE public.request.studId = $1 AND public.request.pId = $2";
        pool.query(getRequestInfo, [stuId, patientId], (err, data) => {
            console.log("data for get request" + data.rowCount);
            if (data.rowCount !== 0) {
                //Request is already present by this student, for this patient.
                req.flash("error", "You have already made a request");
                res.redirect("/viewAllUnallocatedPatients");
            } else {
                //Request not present by this student, for this patient.
                //Proceed to create NEW Request
                console.log("Else")
                console.log(req.body.patientId)
                var queryPatient_IndQuota = "select * from public.patient natural join public.indicationquota where patient.pid=$1";
                pool.query(queryPatient_IndQuota, [req.body.patientId], (err, data) => {
                    if (err) {
                        req.flash("error", "Failed to retrieve patient info");
                        console.log("Error in query")
                        console.log(err)
                    } else {
                        // 3 Components to calculate, Each component will have a constant comparing factor / score between all students.
                        // Following that, the [weightage] and the type of components are 
                        // 1. [0.3] Number of lacking cases before graduation. The more lacking cases, the higher score student gets.
                        // 2. [0.5] Seniority of student
                        // 3. [0.2] First-Come-First-Serve (FCFS) of students.

                        //Calculate score for matching LACKING cases, Weightage 0.3
                        //To find out how far student is lacking from 'passing' minimum quota
                        //Max Quota is used so that every student is compared equally for this patient
                        studentScore = 0;
                        var quota;
                        var maxQuota = 0;
                        
                        console.log(rawStudent.rows[0].indicationcount)
                        indications.forEach(indication => {
                            console.log(indication);
                            switch(indication){
                                    //Add to student score, but if student number of cases done is MORE than the quota, take it as 0 points
                                    //Don't deduct points. Therefore students aren't at a disadvantage if lets say 
                                    //a patient has indication A, B, C but student need fulfil B, C but already max out A. 
                                    //This set of students also require this patient too but maybe not as well suited for them.
                                case "CD Exam Case":
                                    console.log("CD Exam Case")
                                    quota = data.rows[0].indicationarray[0]
                                    maxQuota += quota;
                                    studentScore +=  Math.max(quota - parseInt(rawStudent.rows[0].indicationcount[0]),0);
                                    break;
                                case "Dental Public Health":
                                    console.log("Dental Public Health")
                                    quota = data.rows[0].indicationarray[1]
                                    maxQuota += quota;
                                    studentScore += Math.max(quota - parseInt(rawStudent.rows[0].indicationcount[1]),0);
                                    break;
                                case "Endodontics":
                                    console.log("Endodontics")
                                    quota = data.rows[0].indicationarray[2]
                                    maxQuota += quota;
                                    studentScore += Math.max(quota - parseInt(rawStudent.rows[0].indicationcount[2]),0);
                                    break;
                                case "Fixed Prosthodontics":
                                    console.log("Fixed Prosthodontics")
                                    quota = data.rows[0].indicationarray[3]
                                    maxQuota += quota;
                                    studentScore += Math.max(quota - parseInt(rawStudent.rows[0].indicationcount[3]),0);
                                    break;
                                case "Operative Dentistry":
                                    quota = data.rows[0].indicationarray[4]
                                    maxQuota += quota;
                                    studentScore += Math.max(quota - parseInt(rawStudent.rows[0].indicationcount[4]),0);
                                    break;
                                case "Oral Surgery":
                                    quota = data.rows[0].indicationarray[5]
                                    maxQuota += quota;
                                    studentScore += Math.max(quota - parseInt(rawStudent.rows[0].indicationcount[5]),0);
                                    break;
                                case "Orthodontics":
                                    quota = data.rows[0].indicationarray[6]
                                    maxQuota += quota;
                                    studentScore += Math.max(quota - parseInt(rawStudent.rows[0].indicationcount[6]),0);
                                    break;
                                case "Pedodontics":
                                    quota = data.rows[0].indicationarray[7]
                                    maxQuota += quota;
                                    studentScore += Math.max(quota - parseInt(rawStudent.rows[0].indicationcount[7]),0);
                                    break;
                                case "Periodontics":
                                    quota = data.rows[0].indicationarray[8]
                                    maxQuota += quota;
                                    studentScore += Math.max(quota - parseInt(rawStudent.rows[0].indicationcount[8]),0);
                                    break;
                                case "Removable Prosthodontics":
                                    quota = data.rows[0].indicationarray[9]
                                    maxQuota += quota;
                                    studentScore += Math.max(quota - parseInt(rawStudent.rows[0].indicationcount[9]),0);
                                    break;
                            }
                        });
                        //Weightage of 0.3
                        studentScore = (studentScore / maxQuota) * 0.3;
                        console.log("Student Score for Cases Leftover before Grad: " + studentScore);

                        //Calculate score by SENIORITY, Weightage 0.5
                        //Calculate using Patient's listed date. A fixed date. MINUS Student Enrolled Year
                        // Can't use the date 'today' incase someone sends a request 
                        //on 31st Dec will have lower points than someone sending on 1st Jan.
                        
                        //Assuming no students will graduate later than 6years later OR
                        // No Patient listed more than 6 years without allocating.
                        var randomConstantNumber = 6; 

                        var tempScore = parseInt(moment(data.rows[0].listedtimestamp).year()) - parseInt(rawStudent.rows[0].enrolyear);
                        console.log("Seniority Score : " + tempScore)
                        studentScore += (tempScore / randomConstantNumber)*0.5

                        //Calculate score by FCFS, Weightage 0.2
                        //using the difference of the request and timestamp patient was listed
                        //divided by a constant -> 2years in milliseconds. Therefore assuming longest a patient is left in register for students to request is 2years.
                        constantTime = 63113904000;
                        requestTimeStamp = new Date();
                        tempScore = 1 - ((parseInt(moment(requestTimeStamp).valueOf()) - parseInt(moment(data.rows[0].listedtimestamp).valueOf())) / constantTime);
                        console.log("FCFS Score : " + tempScore)
                        studentScore += tempScore * 0.2

                        //conver studentScore into an integer
                        studentScore = Math.round(studentScore * Math.pow(10,12));
                        console.log(studentScore)

                        //Insert into DB
                        var insertRequestQuery = "INSERT INTO public.request(studId, pId, allocatedStatus, indications, score, requestTimestamp) values($1,$2,$3,$4,$5,$6)";
                        pool.query(insertRequestQuery, [stuId, patientId, "Pending", dbIndication, studentScore, requestTimeStamp], (err, data) => {
                            if(err){
                                req.flash("Error", "Failed to create request");
                                console.log("Error in Insert Request Query");
                                console.log(err);
                            } else {
                                req.flash("info", "Request Created Successfully");
                                res.redirect('/viewRequests');
                            }
                        })
                    }
                })
            }
        });

    } catch (error) {
        console.log("ERROR at RequestPatient: " + error);
        return;
    }

});

module.exports = router;
