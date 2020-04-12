var express = require("express");
var router = express.Router();
const moment = require("moment");

const db = require("../connection/queries");
const truffle_connect = require("../connection/app");
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "api",
  password: "password",
  port: 5432,
});

var staffAddr;
var name;
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
  "Removable Prosthodontics",
];
/* GET home page. */
router.get("/", async function (req, res, next) {
  var username = req.session.username;
  console.log(username);
  this.patientIds = [];
  this.unallocatedPatients = [];

  if (username === undefined) {
    res.redirect("/login");
  } else {
    var sql_query =
      "SELECT * FROM public.student WHERE public.student.email = $1";
    pool.query(sql_query, [username], (err, data) => {
      name = data.rows[0].name;
      studentIndication = data.rows[0].indicationcount;
    });

    var indicationQuota_query = "select * from public.indicationquota";

    pool.query(indicationQuota_query, (err, data) => {
      indicationRecords = data.rows[0].indicationarray;
    });

    let me = this;
    //retrieve all listed and unallocated patients from db
    var retreiveAllPatientInfo =
      "SELECT * FROM public.patient WHERE public.patient.listStatus = $1" +
      " AND public.patient.allocatedStatus != $2 ORDER BY allocatedstatus desc, patient.pid desc";
    pool.query(retreiveAllPatientInfo, ["Listed", "Allocated"], (err, data) => {
      //push required patientIds into patientIds array
      for (var i = 0; i < data.rowCount; i++) {
        me.patientIds.push({
          patientId: data.rows[i].pid,
        });
      }

      //retrieve staff1's address to call contract
      var sql_query =
        "SELECT * FROM public.staff WHERE public.staff.email = $1";
      pool.query(sql_query, ["staff1@gmail.com"], async function (
        err,
        results
      ) {
        me.staffAddr = results.rows[0].address;

        //retrieve patients from contract
        var i;
        for (i = 0; i < me.patientIds.length; i++) {
          let id = this.patientIds[i].patientId;
          let indications = data.rows[i].indications;
          let leadingStudentId =
            data.rows[i].leadingstudentid == 0
              ? "None"
              : data.rows[i].leadingstudentid;
          let leadingStudentName = data.rows[i].leadingstudentname;
          let patientTimestamp = moment(data.rows[i].listedtimestamp).format(
            "DD MMM YYYY, HH:mm"
          );
          //check if already requested so we don't display request button
          let alreadyRequested = false;
          rawStudent = await db.select(
            "public.student",
            "*",
            `public.student.email='` + username + `'`
          );

          var stuId = rawStudent.rows[0].studid;
          console.log(stuId);
          var checkRequested_query =
            "SELECT * FROM public.request WHERE public.request.pid = $1 " +
            "AND public.request.studid = $2 AND public.request.allocatedStatus != $3";
          pool.query(checkRequested_query, [id, stuId, "Withdrawn"], function (
            err,
            results
          ) {
            if (results.rowCount > 0) {
              alreadyRequested = true;
            }

            truffle_connect.getPatient(id, this.staffAddr, (answer) => {
              me.unallocatedPatients.push({
                patientId: id,
                indications: indications,
                patientTimestamp: patientTimestamp,
                leadingStudentId: leadingStudentId,
                leadingStudentName: leadingStudentName,
                alreadyRequested: alreadyRequested,
              });
            });
          });
        }

        setTimeout(function () {
          res.render("viewAllUnallocatedPatients", {
            title: "View All Unallocated Patients",
            user: name,
            indicationsArray: indicationsArray,
            indicationRecords: indicationRecords,
            studentRecords: studentIndication,
            data: me.unallocatedPatients,
          });
        }, 1000);
      });
    });
  }
});

// POST
router.post("/", async function (req, res, next) {
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
  var solidityIndications = [];

  indications = indications.split(",");
  console.log(indications);
  numRequest_query =
    "SELECT COUNT(*) as count FROM request WHERE studid = $1 and allocatedstatus = 'Pending' OR allocatedstatus = 'Allocated'";

  // Limiting students 2 only sending 5 requests / confirmed allocation. So that they cannot hog every other patient and give other students a chance.
  pool.query(numRequest_query, [stuId], (err, data) => {
    if (data.rows[0].count >= 5) {
      console.log("Student has made 5 request in total.");
      req.flash(
        "error",
        "You have currently 5 pending / allocated request. Please remove 1 before proceeding with a new request."
      );
      res.redirect("/viewRequests");
    } else {
      // Calculate the score of this request
      // Only update DB and Ethereum after calculating score below.
      //
      //update postgreSQL database
      var getRequestInfo =
        "SELECT * FROM public.request WHERE public.request.studId = $1 AND public.request.pId = $2 AND public.request.allocatedStatus != $3";
      pool.query(
        getRequestInfo,
        [stuId, patientId, "Withdrawn"],
        (err, data) => {
          console.log("data for get request" + data.rowCount);
          if (data.rowCount !== 0) {
            //Request is already present by this student, for this patient.
            req.flash("error", "You have already made a request");
            res.redirect("/viewAllUnallocatedPatients");
          } else {
            //Request not present by this student, for this patient.
            //Proceed to create NEW Request
            console.log("Else");
            console.log(req.body.patientId);
            var queryPatient_IndQuota =
              "select * from public.patient natural join public.indicationquota where patient.pid=$1";
            pool.query(
              queryPatient_IndQuota,
              [req.body.patientId],
              async (err, data) => {
                if (err) {
                  req.flash("error", "Failed to retrieve patient info");
                  console.log("Error in query");
                  console.log(err);
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

                  console.log(rawStudent.rows[0].indicationcount);
                  indications.forEach((indication) => {
                    console.log(indication);
                    switch (indication) {
                      //Add to student score, but if student number of cases done is MORE than the quota, take it as 0 points
                      //Don't deduct points. Therefore students aren't at a disadvantage if lets say
                      //a patient has indication A, B, C but student need fulfil B, C but already max out A.
                      //This set of students also require this patient too but maybe not as well suited for them.
                      case "CD Exam Case":
                        console.log("CD Exam Case");
                        quota = data.rows[0].indicationarray[0];
                        maxQuota += quota;
                        studentScore += Math.max(
                          quota -
                            parseInt(rawStudent.rows[0].indicationcount[0]),
                          0
                        );
                        solidityIndications.push(0);
                        break;
                      case "Dental Public Health":
                        console.log("Dental Public Health");
                        quota = data.rows[0].indicationarray[1];
                        maxQuota += quota;
                        studentScore += Math.max(
                          quota -
                            parseInt(rawStudent.rows[0].indicationcount[1]),
                          0
                        );
                        solidityIndications.push(1);
                        break;
                      case "Endodontics":
                        console.log("Endodontics");
                        quota = data.rows[0].indicationarray[2];
                        maxQuota += quota;
                        studentScore += Math.max(
                          quota -
                            parseInt(rawStudent.rows[0].indicationcount[2]),
                          0
                        );
                        solidityIndications.push(2);
                        break;
                      case "Fixed Prosthodontics":
                        console.log("Fixed Prosthodontics");
                        quota = data.rows[0].indicationarray[3];
                        maxQuota += quota;
                        studentScore += Math.max(
                          quota -
                            parseInt(rawStudent.rows[0].indicationcount[3]),
                          0
                        );
                        solidityIndications.push(3);
                        break;
                      case "Operative Dentistry":
                        quota = data.rows[0].indicationarray[4];
                        maxQuota += quota;
                        studentScore += Math.max(
                          quota -
                            parseInt(rawStudent.rows[0].indicationcount[4]),
                          0
                        );
                        solidityIndications.push(4);
                        break;
                      case "Oral Surgery":
                        quota = data.rows[0].indicationarray[5];
                        maxQuota += quota;
                        studentScore += Math.max(
                          quota -
                            parseInt(rawStudent.rows[0].indicationcount[5]),
                          0
                        );
                        solidityIndications.push(5);
                        break;
                      case "Orthodontics":
                        quota = data.rows[0].indicationarray[6];
                        maxQuota += quota;
                        studentScore += Math.max(
                          quota -
                            parseInt(rawStudent.rows[0].indicationcount[6]),
                          0
                        );
                        solidityIndications.push(6);
                        break;
                      case "Pedodontics":
                        quota = data.rows[0].indicationarray[7];
                        maxQuota += quota;
                        studentScore += Math.max(
                          quota -
                            parseInt(rawStudent.rows[0].indicationcount[7]),
                          0
                        );
                        solidityIndications.push(7);
                        break;
                      case "Periodontics":
                        quota = data.rows[0].indicationarray[8];
                        maxQuota += quota;
                        studentScore += Math.max(
                          quota -
                            parseInt(rawStudent.rows[0].indicationcount[8]),
                          0
                        );
                        solidityIndications.push(8);
                        break;
                      case "Removable Prosthodontics":
                        quota = data.rows[0].indicationarray[9];
                        maxQuota += quota;
                        studentScore += Math.max(
                          quota -
                            parseInt(rawStudent.rows[0].indicationcount[9]),
                          0
                        );
                        solidityIndications.push(9);
                        break;
                    }
                  });
                  //Weightage of 0.3
                  studentScore = (studentScore / maxQuota) * 0.3;
                  console.log(
                    "Student Score for Cases Leftover before Grad: " +
                      studentScore
                  );

                  //Calculate score by SENIORITY, Weightage 0.5
                  //Calculate using Patient's listed date. A fixed date. MINUS Student Enrolled Year
                  // Can't use the date 'today' incase someone sends a request
                  //on 31st Dec will have lower points than someone sending on 1st Jan.

                  //Assuming no students will graduate later than 6years later OR
                  // No Patient listed more than 6 years without allocating.
                  var randomConstantNumber = 6;

                  var tempScore =
                    parseInt(moment(data.rows[0].listedtimestamp).year()) -
                    parseInt(rawStudent.rows[0].enrolyear);
                  console.log("Seniority Score : " + tempScore);
                  studentScore += (tempScore / randomConstantNumber) * 0.5;

                  //Calculate score by FCFS, Weightage 0.2
                  //using the difference of the request and timestamp patient was listed
                  //divided by a constant -> 2years in milliseconds. Therefore assuming longest a patient is left in register for students to request is 2years.
                  constantTime = 63113904000;
                  requestTimeStamp = new Date();
                  tempScore =
                    1 -
                    (parseInt(moment(requestTimeStamp).valueOf()) -
                      parseInt(
                        moment(data.rows[0].listedtimestamp).valueOf()
                      )) /
                      constantTime;
                  console.log("FCFS Score : " + tempScore);
                  studentScore += tempScore * 0.2;

                  //conver studentScore into an integer
                  studentScore = Math.round(studentScore * Math.pow(10, 12));
                  console.log(studentScore);

                  //Insert into Ethereum smart contract + local DB
                  let requestId = await truffle_connect
                    .createRequest(
                      studentScore,
                      solidityIndications,
                      rawStudent.rows[0].address,
                      stuId,
                      patientId,
                      "Pending",
                      dbIndication,
                      requestTimeStamp
                    )
                    .catch((error) => {
                      console.log("CAUGHT Error within Create Request: ");
                      req.flash(
                        "Error",
                        "Request failed to be created due to - " + error
                      );
                      res.redirect("/viewRequests");
                      return;
                    });
                  ////Just a method to check that Ethereum did store the request.
                  ////Uncomment below if you want the check to happen.
                  // let verifyScore = await truffle_connect.getRequest(requestId,rawStudent.rows[0].address)
                  // if(verifyScore == studentScore){
                  //     console.log("Request created in Ethereum, score match")
                  // } else {
                  //     console.log("Request was not created in Ethereum")
                  // }

                  //After creating Request, update the HIGHEST score for patient and current Student so that it can be displayed.
                  var highestScore_query =
                    "select request.studId, student.name from public.request natural join public.student where pId = $1 and allocatedstatus != 'Withdrawn' ORDER BY score DESC LIMIT 1;";
                  pool.query(
                    highestScore_query,
                    [patientId],
                    (err, highestScoreStudent) => {
                      if (err) {
                        //should NOT happen
                        console.log("Error in updating highest score");
                        console.log(err);
                        return;
                      }
                      var updateRequest =
                        "UPDATE public.patient SET leadingStudentId = $1, leadingStudentName = $2 WHERE pId = $3";
                      pool.query(
                        updateRequest,
                        [
                          highestScoreStudent.rows[0].studid,
                          highestScoreStudent.rows[0].name,
                          patientId,
                        ],
                        (err, result) => {
                          if (err) {
                            //should NOT happen
                            console.log("Error in updating highest score");
                            console.log(err);
                            return;
                          }
                          req.flash(
                            "info",
                            "Request Created Successfully with Id : " +
                              requestId +
                              "."
                          );
                          res.redirect("/viewRequests");
                        }
                      );
                    }
                  );
                }
              }
            );
          }
        }
      );
    }
  });
});

module.exports = router;
