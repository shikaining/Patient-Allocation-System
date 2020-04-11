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
var indicationRecords;

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
        "UPDATE public.request SET allocatedStatus = $1, studId = $2 WHERE pid = $3";
      pool.query(
        resolveRequest,
        ["Resolved", studId, patientId],
        (err, data) => {
          console.log(err);
          if (err === undefined) {
          } else {
            req.flash("error", "An error has occurred! Please try again");
          }
          //res.redirect('/allocatePatients');
        }
      );
      //update patient table liststatus to 'unlisted' and curedStatus to 'cured'
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
            });

            req.flash("info", "Patient Resolved");
            res.redirect("/resolveRequests");
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
