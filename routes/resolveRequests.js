var express = require("express");
var router = express.Router();

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

var student;
var studentAddr;
var transferStudentAddr;
var patientInfo;
var staffAddr;
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
router.get("/", async function (req, res, next) {
  var username = req.session.username;

  console.log(username);

  if (username === undefined) {
    res.redirect("/login");
  } else {
    var studentIndication;
    var indicationRecords;

    //retrieve current student object
    let me = this;
    var sql_query =
      "SELECT * FROM public.student WHERE public.student.email = $1";
    pool.query(sql_query, [username], (err, data) => {
      me.student = data.rows[0];
      me.studentAddr = data.rows[0].address;
      name = data.rows[0].name;
      studentIndication = data.rows[0].indicationcount;

      var indicationQuota_query = "select * from public.indicationquota";

      pool.query(indicationQuota_query, (err, data) => {
        indicationRecords = data.rows[0].indicationarray;
        console.log("Student Indication : " + studentIndication);
        console.log("indicationRecords : " + indicationRecords);

        var retreiveAllocatedRequest =
          "SELECT * FROM public.request WHERE public.request.allocatedStatus = $1 AND public.request.studId = $2";
        pool.query(
          retreiveAllocatedRequest,
          ["Allocated", this.student.studid],
          (err, data) => {
            res.render("resolveRequests", {
              title: "Operative Dentistry Course Record",
              user: name,
              indicationsArray: indicationsArray,
              indicationRecords: indicationRecords,
              studentRecords : studentIndication,
              data: data.rows,
            });
          }
        );
      });
    });
  }
});

// POST
router.post("/", async function (req, res, next) {
  var transferStudentId = req.body.transferStudentId;
  var patientId;
  var studId;

  if (transferStudentId === undefined) {
    studId = req.body.studentId;
    patientId = req.body.patientId;
  } else {
    studId = req.body.trfstudentId;
    patientId = req.body.transferPatientId;
  }

  if (transferStudentId === undefined) {
    try {
      //resolve patients
      //update request table allocated status to 'Resolved'
      var resolveRequest =
        "UPDATE public.request SET allocatedStatus = $1 WHERE pid = $2";
      pool.query(
        resolveRequest,
        ["Resolved", patientId],
        (err, data) => {
          console.log(err);
          if (err === undefined) {
          } else {
            req.flash("error", "An error has occurred! Please try again");
          }
          //res.redirect('/allocatePatients');
        }
      );
      //update patient table liststatus to 'unlisted' and curedStatus / resolutionStatus to 'cured'
      var successfulRequest_query =
        "UPDATE public.patient SET allocatedStatus = $1, listStatus = $2, curedStatus = $3 WHERE pid = $4 AND studId = $5";
      pool.query(
        successfulRequest_query,
        ["Allocated", "Unlisted", "Cured", patientId, studId],
        (err, data) => {
          console.log(err);
          if (err === undefined) {
            truffle_connect.resolvePatient(patientId, this.studentAddr);

            var sql_query =
              "SELECT * FROM public.staff WHERE public.staff.email = $1";
            pool.query(sql_query, ["staff1@gmail.com"], (err, data) => {
              var staffAddr = data.rows[0].address;
              truffle_connect.getPatient(patientId, staffAddr, (answer) => {
                console.log(answer);
              });
              console.log("Student Indication = " + studentIndication)
              newStudentIndication = studentIndication
              var patient_query = "SELECT * from patient where pid = $1"
              pool.query(patient_query, [patientId], (err,data) => {
                patientIndication = data.rows[0].indications;
                patientIndication.forEach(indication => {
                  switch (indication) {
                    //Finding the indication that matches this patient and then adding it to the student's completed count.
                    case "CD Exam Case":
                        console.log("CD Exam Case")
                        newStudentIndication[0] = newStudentIndication[0] + 1;
                        break;
                    case "Dental Public Health":
                        console.log("Dental Public Health")
                        newStudentIndication[1] = newStudentIndication[1] + 1;
                        break;
                    case "Endodontics":
                        console.log("Endodontics")
                        newStudentIndication[2] = newStudentIndication[2] + 1;
                        break;
                    case "Fixed Prosthodontics":
                        console.log("Fixed Prosthodontics")
                        newStudentIndication[3] = newStudentIndication[3] + 1;
                        break;
                    case "Operative Dentistry":
                        newStudentIndication[4] = newStudentIndication[4] + 1;
                        break;
                    case "Oral Surgery":
                        newStudentIndication[5] = newStudentIndication[5] + 1;
                        break;
                    case "Orthodontics":
                        newStudentIndication[6] = newStudentIndication[6] + 1;
                        break;
                    case "Pedodontics":
                        newStudentIndication[7] = newStudentIndication[7] + 1;
                        break;
                    case "Periodontics":
                        newStudentIndication[8] = newStudentIndication[8] + 1;
                        break;
                    case "Removable Prosthodontics":
                        newStudentIndication[9] = newStudentIndication[9] + 1;
                        break;
                }                  
                });
                console.log("Patient Indications : " + patientIndication)
                console.log("New Student Indication : " + newStudentIndication)
                updateStudent_query = "UPDATE public.student SET indicationCount = $1 WHERE studid = $2"
                pool.query(updateStudent_query, [newStudentIndication, studId], (err,data) => {
                  req.flash("info", "Patient Resolved");
              res.redirect("/resolveRequests");
                })
              })

              // student_query = "SELECT * from public.student WHERE studid = $1"
              // pool.query(student_query,[studId], (err,data) => {
              //   var studentIndication = data.rows[0].indicationcount;
              //   indicationQuota_query = "Select * from public.indicationquota";
              //   pool.query(indicationQuota_query,(err,data) => {
              //     indicationQuota = data.rows[0].indicationarray
              //   })
              // })

              console.log()
            });

          } else {
            req.flash("error", "An error has occurred! Please try again");
          }
        }
      );
    } catch (error) {
      console.log("ERROR at resolvePatient: " + error);
      return;
    }
  } else {
    //transfer patient
    //retrieve TRANSFER student object
    var retrieveStudentInfo_query =
      "SELECT * FROM public.student WHERE public.student.studid = $1";

    let me = this;
    await pool.query(
      retrieveStudentInfo_query,
      [transferStudentId],
      (err, data) => {
        me.transferStudentAddr = data.rows[0].address;
        console.log(me.transferStudentAddr);
        console.log(this.transferStudentAddr);

        truffle_connect.studentTransfer(
          patientId,
          me.transferStudentAddr,
          this.studentAddr
        );
      }
    );

    console.log();

    try {
      //update student Id on request table
      var transferRequest =
        "UPDATE public.request SET allocatedStatus = $1 WHERE pid = $2 AND studId = $3";
      pool.query(
        transferRequest,
        ["Transferred", patientId, studId],
        (err, data) => {
          console.log(err);
          if (err === undefined) {
          } else {
            req.flash("error", "An error has occurred! Please try again");
          }
        }
      );

      var transferRequest =
        "UPDATE public.request SET allocatedStatus = $1 WHERE pid = $2 AND studId = $3";
      pool.query(
        transferRequest,
        ["Allocated", patientId, transferStudentId],
        (err, data) => {
          console.log(err);
          if (err === undefined) {
          } else {
            req.flash("error", "An error has occurred! Please try again");
          }
        }
      );

      //update student Id on patient table
      var transferPatient =
        "UPDATE public.patient SET studId = $1 WHERE pid = $2";
      pool.query(
        transferPatient,
        [transferStudentId, patientId],
        (err, data) => {
          console.log(err);
          if (err === undefined) {
            req.flash("info", "Patient Transferred");
            res.redirect("/resolveRequests");
          } else {
            req.flash("error", "An error has occurred! Please try again");
          }
        }
      );

      var sql_query =
        "SELECT * FROM public.staff WHERE public.staff.email = $1";
      pool.query(sql_query, ["staff1@gmail.com"], (err, data) => {
        var staffAddr = data.rows[0].address;
        truffle_connect.getPatient(patientId, staffAddr, (answer) => {
          console.log(answer);
        });
      });
    } catch (error) {
      //end try
      console.log("ERROR at transPatient: " + error);
      return;
    }
  }
});

module.exports = router;
