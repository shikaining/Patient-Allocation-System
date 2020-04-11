var express = require("express");
var router = express.Router();

const truffle_connect = require("../connection/app");
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "api",
  password: "password",
  port: 5432,
});
var displayedRequests = [];
var ownAddr;
var studId;

/* GET home page. */
router.get("/", function (req, res, next) {
  var username = req.session.username;
  console.log(username);
  this.displayedRequests = [];

  if (username === undefined) {
    res.redirect("/login");
  } else {
    let me = this;
    var sql_query =
      "SELECT * FROM public.student WHERE public.student.email ='" +
      username +
      "'";
    pool.query(sql_query, (err, user) => {
      // console.log(user);
      me.studId = user.rows[0].studid;
      me.ownAddr = user.rows[0].address;

      var retreiveAllRequestInfo =
        "SELECT r.rid, r.pid, p.liststatus, p.indications, p.allocatedstatus as patient_status, r.allocatedstatus as student_status FROM public.request r LEFT JOIN public.patient p ON r.pId = p.pId WHERE r.studId = $1 ORDER BY r.allocatedstatus ASC, r.rid DESC";
      pool.query(retreiveAllRequestInfo, [me.studId], (err, data) => {
        // console.log("rowCount" + data.rowCount);
        var i;
        for (i = 0; i < data.rowCount; i++) {
          //studentId, patientId, indications, request status
          let requestId = data.rows[i].rid;
          let indications = data.rows[i].indications;
          let student_request_status = data.rows[i].student_status;
          let patient_request_status = data.rows[i].patient_status;
          let isWithdrawn = false;
          if (student_request_status === "Withdrawn") {
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
              pid = "None";
            }
            me.displayedRequests.push({
              rid: requestId,
              studid: me.studId,
              pid: patientId,
              indications: indications,
              allocatedstatus: student_request_status,
              patientstatus: patient_request_status,
              isWithdrawn: isWithdrawn,
              listStatus: listStatus,
            });

            console.log(me.displayedRequests);
          });
          // setTimeout(function () {

          // }, 1000);
        } //ends for loop
        setTimeout(function () {
          res.render("viewRequests", {
            title: "View Requests",
            user: username,
            data: me.displayedRequests,
          });
        }, 1000);
      });
    });
  }
});

// POST
router.post("/", function (req, res, next) {
  try {
    var requestId = req.body.requestId;

    var withdrawReq_query =
      "UPDATE public.request SET allocatedStatus = $1 WHERE rid = $2";
    pool.query(withdrawReq_query, ["Withdrawn", requestId], (err, data) => {
    //   console.log(err);
      if (err === undefined) {
        patientQuery = "SELECT pid from public.request WHERE rid = $1";
        pool.query(patientQuery, [requestId], (err, data) => {
          var patientId = data.rows[0].pid;
          console.log("Patient Id :" + patientId);
          truffle_connect
            .withdrawRequest(requestId, this.ownAddr)
            .then((next) => {
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
                  console.log(
                    "highestScoreStudent.rows[0] -> " +
                      highestScoreStudent.rows[0]
                  );
                  if (highestScoreStudent.rows[0] == null) {
                    var updateRequest =
                      "UPDATE public.patient SET leadingStudentId = 0, leadingStudentName = 'No Request Yet' WHERE pId = $1";
                    pool.query(updateRequest, [patientId], (err, result) => {
                      if (err) {
                        //should NOT happen
                        console.log("Error in updating highest score");
                        console.log(err);
                        return;
                      }
                      req.flash("info", "Request withdrawn");
                      res.redirect("/viewRequests");
                    });
                  } else {
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
                        req.flash("info", "Request withdrawn");
                        res.redirect("/viewRequests");
                      }
                    );
                  }
                }
              );
            })
            .catch((error) => {
              console.log(error);
              req.flash("error", "An error has occurred! Please try again");
              res.redirect("/viewRequests");
            });
        });
      } else {
        req.flash("error", "An error has occurred! Please try again");
        res.redirect("/viewRequests");
      }
    });
  } catch (error) {
    console.log("ERROR at withdrawReq: " + error);
    return;
  }
});

module.exports = router;
