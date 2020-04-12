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
var studentIndication;
var indicationQuota;
var expectedIndication;
var myNewExpectedCount;

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

  if (username === undefined) {
    res.redirect("/login");
  } else {
    //retrieve current student object
    let me = this;
    var sql_query =
      "SELECT * FROM public.student WHERE public.student.email = $1";
    pool.query(sql_query, [username], (err, data) => {
      me.student = data.rows[0];
      me.studentAddr = data.rows[0].address;
      name = data.rows[0].name;
      studentIndication = data.rows[0].indicationcount;
      expectedIndication = data.rows[0].expectedcount;

      var indicationQuota_query = "select * from public.indicationquota";

      pool.query(indicationQuota_query, (err, data) => {
        indicationQuota = data.rows[0].indicationarray;
        console.log("Student Indication : " + studentIndication);
        console.log("indicationQuota : " + indicationQuota);

        var retreiveAllocatedRequest =
          "SELECT r.studid, r.pid, p.name, p.contactno, r.indications, r.allocatedstatus, r.isTransferred FROM public.request r LEFT JOIN public.patient p ON r.pId = p.pId WHERE r.allocatedStatus = $1 AND r.studId = $2";
        pool.query(
          retreiveAllocatedRequest,
          ["Allocated", this.student.studid],
          (err, data) => {
            res.render("resolveRequests", {
              title: "Operative Dentistry Course Record",
              user: name,
              indicationsArray: indicationsArray,
              indicationRecords: indicationQuota,
              studentRecords: studentIndication,
              data: data.rows,
            });//ends rendering
          });//ends retrieve allocated requests
        });//ends indication quote
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
      pool.query(resolveRequest, ["Resolved", patientId], (err, data) => {
        console.log(err);
        if (err === undefined) {
        } else {
          req.flash("error", "An error has occurred! Please try again");
        }
        //res.redirect('/allocatePatients');
      });
      //update patient table liststatus to 'unlisted' and curedStatus / resolutionStatus to 'cured'
      var successfulRequest_query =
        "UPDATE public.patient SET allocatedStatus = $1, listStatus = $2, resolvedStatus = $3 WHERE pid = $4 AND studId = $5";
      pool.query(
        successfulRequest_query,
        ["Allocated", "Unlisted", "Resolved", patientId, studId],
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
              console.log("Student Indication = " + studentIndication);
              newStudentIndication = studentIndication;
              var patient_query = "SELECT * from patient where pid = $1";
              pool.query(patient_query, [patientId], (err, data) => {
                patientIndication = data.rows[0].indications;
                patientIndication.forEach((indication) => {
                  switch (indication) {
                    //Finding the indication that matches this patient and then adding it to the student's completed count.
                    case "CD Exam Case":
                      console.log("CD Exam Case");
                      newStudentIndication[0] = newStudentIndication[0] + 1;
                      break;
                    case "Dental Public Health":
                      console.log("Dental Public Health");
                      newStudentIndication[1] = newStudentIndication[1] + 1;
                      break;
                    case "Endodontics":
                      console.log("Endodontics");
                      newStudentIndication[2] = newStudentIndication[2] + 1;
                      break;
                    case "Fixed Prosthodontics":
                      console.log("Fixed Prosthodontics");
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
                pool.query(updateStudent_query, [newStudentIndication, studId], (err, data) => {
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

              console.log();
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
    pool.query(retrieveStudentInfo_query, [transferStudentId], (err, data) => {
      me.transferStudentAddr = data.rows[0].address;
      console.log(me.transferStudentAddr);
      console.log(this.transferStudentAddr);
      var transferStudentInfo = data.rows[0];

      truffle_connect
        .studentTransfer(patientId, me.transferStudentAddr, this.studentAddr)
        .then((pass) => {
          //Update currentStudent's expected Indication count since this patient is no longer his to treat.
          patient_query = " SELECT * from patient where pid = $1";
          pool.query(patient_query, [patientId], async (err, data) => {
            if (err) {
              console.log("Retrieve Patient Error");
            } else {
              var patientIndication = data.rows[0].indications;
              myNewExpectedCount = await calculate_subtract_NewExpectedIndicationCount(
                expectedIndication.slice(),
                patientIndication
              );
              console.log(
                "New Expectation for Logged in Student : " + myNewExpectedCount
              );
              //updated logged in Student's expected indication COUNT
              var updateExepectedCount_query =
                "UPDATE public.student SET expectedCount = $1 WHERE studid = $2";
              pool.query(
                updateExepectedCount_query,
                [myNewExpectedCount, studId],
                (err, data) => {
                  //Updating all pending request of current student, updating the SCORE.
                  var retrievePendingRequest_query =
                    "SELECT * FROM public.request WHERE allocatedstatus = 'Pending' and studid = $1";
                  pool.query(
                    retrievePendingRequest_query,
                    [studId],
                    async (err, requestData) => {
                      if (err) {
                        console.log(err);
                        console.log(
                          "Error within retrieve logged in Student's PENDING requests"
                        );
                      } else {
                        if (requestData.rows.length > 0) {
                          await updateExpectedIndicationCount(
                            requestData,
                            myNewExpectedCount,
                            indicationQuota
                          );
                          console.log(
                            "Moving on to  update Transfer Student's score"
                          );
                        } else {
                          console.log(
                            "No Pending Request for current logged in Student. Proceeding to update Transfer Student"
                          );
                        }

                        //Calculate transfer student's NEW expected indication count

                        transferStudentNewExpectedCount = await calculate_add_NewExpectedIndicationCount(
                          transferStudentInfo.expectedcount,
                          patientIndication
                        );
                        console.log(
                          "New Expectation for Transfer Student : " +
                            transferStudentNewExpectedCount
                        );
                        //update transfer Student's expected indication COUNT
                        pool.query(
                          updateExepectedCount_query,
                          [transferStudentNewExpectedCount, transferStudentId],
                          (err, data) => {
                            //Update all pending request of current student, updating the SCORE.
                            pool.query(
                              retrievePendingRequest_query,
                              [transferStudentId],
                              async (err, requestData) => {
                                if (err) {
                                  console.log(
                                    "Error within retrieving Transfer Student's Pending requests"
                                  );
                                  console.log(err);
                                } else {
                                  await updateExpectedIndicationCount(
                                    requestData,
                                    transferStudentNewExpectedCount,
                                    indicationQuota
                                  )
                                    .then((pass) => {
                                      console.log(pass);
                                      //update transfer statuses on request table
                                      var transferRequest =
                                        "UPDATE public.request SET allocatedStatus = $1 WHERE pid = $2 AND studId = $3";
                                      pool.query(
                                        transferRequest,
                                        ["Transferred", patientId, studId],
                                        (err, data) => {
                                          console.log(err);
                                          if (err === undefined) {
                                            var transferRequest =
                                              "UPDATE public.request SET allocatedStatus = $1, isTransferred = TRUE WHERE pid = $2 AND studId = $3";
                                            pool.query(
                                              transferRequest,
                                              [
                                                "Allocated",
                                                patientId,
                                                transferStudentId,
                                              ],
                                              (err, data) => {
                                                console.log(err);
                                                if (err === undefined) {
                                                  var transferPatient =
                                                    "UPDATE public.patient SET studId = $1 WHERE pid = $2";
                                                  pool.query(
                                                    transferPatient,
                                                    [
                                                      transferStudentId,
                                                      patientId,
                                                    ],
                                                    (err, data) => {
                                                      if (err) {
                                                        req.flash(
                                                          "error",
                                                          "An error has occurred! Please try again!"
                                                        );
                                                      } else {
                                                        req.flash(
                                                          "info",
                                                          "Patient Transferred"
                                                        );
                                                        res.redirect(
                                                          "/resolveRequests"
                                                        );
                                                      }
                                                    }
                                                  );
                                                } else {
                                                  req.flash(
                                                    "error",
                                                    "An error has occurred! Please try again"
                                                  );
                                                }
                                              }
                                            );
                                          } else {
                                            req.flash(
                                              "error",
                                              "An error has occurred! Please try again"
                                            );
                                          }
                                        }
                                      );
                                    })
                                    .catch((error) => {
                                      console.log(error);
                                      req.flash(
                                        "Error when resolving request."
                                      );
                                      res.redirect("resolveRequest");
                                    });
                                }
                              }
                            );
                          }
                        );
                      }
                    }
                  );
                }
              );
            }
          });
        })
        .catch((error) => {
          console.log("Transfer Patient contract error.");
          req.flash("error", "Erorr on Transfer Patient within Contract");
          res.redirect("/resolveRequests");
        });
    });
  }
});

function calculate_subtract_NewExpectedIndicationCount(
  oldExpectedIndication,
  patientIndications
) {
  return new Promise((res, rej) => {
    oldExpectedIndication = oldExpectedIndication.slice();
    myNewExpectedCount = oldExpectedIndication.slice();
    console.log("Inside SUBTRACT method of expected Indication");
    console.log("Old Expectation : " + myNewExpectedCount);
    console.log(patientIndications);

    // Calculate the NEW expected count of logged in Student.
    for (let i = 0; i < patientIndications.length; i++) {
      switch (patientIndications[i]) {
        //Finding the indication that matches this patient and then adding it to the student's EXPECTED count.
        // also trying to calculate the new score since expected count has been updated.
        case "CD Exam Case":
          console.log("CD Exam Case");
          myNewExpectedCount[0] = myNewExpectedCount[0] - 1;
          break;
        case "Dental Public Health":
          console.log("Dental Public Health");
          myNewExpectedCount[1] = myNewExpectedCount[1] - 1;
          break;
        case "Endodontics":
          console.log("Endodontics");
          myNewExpectedCount[2] = myNewExpectedCount[2] - 1;
          break;
        case "Fixed Prosthodontics":
          console.log("Fixed Prosthodontics");
          myNewExpectedCount[3] = myNewExpectedCount[3] - 1;
          break;
        case "Operative Dentistry":
          myNewExpectedCount[4] = myNewExpectedCount[4] - 1;
          break;
        case "Oral Surgery":
          myNewExpectedCount[5] = myNewExpectedCount[5] - 1;
          break;
        case "Orthodontics":
          myNewExpectedCount[6] = myNewExpectedCount[6] - 1;
          break;
        case "Pedodontics":
          myNewExpectedCount[7] = myNewExpectedCount[7] - 1;
          break;
        case "Periodontics":
          myNewExpectedCount[8] = myNewExpectedCount[8] - 1;
          break;
        case "Removable Prosthodontics":
          myNewExpectedCount[9] = myNewExpectedCount[9] - 1;
          break;
      }
    }
    res(myNewExpectedCount);
    return;
  });
}

function calculate_add_NewExpectedIndicationCount(
  oldExpectedIndication,
  patientIndications
) {
  return new Promise((res, rej) => {
    oldExpectedIndication = oldExpectedIndication.slice();
    myNewExpectedCount = oldExpectedIndication.slice();

    console.log("Inside ADDITION method of expected Indication");
    console.log("Old Expectation : " + myNewExpectedCount);
    console.log(patientIndications);
    // Calculate the NEW expected count of logged in Student.
    for (let i = 0; i < patientIndications.length; i++) {
      switch (patientIndications[i]) {
        //Finding the indication that matches this patient and then adding it to the student's EXPECTED count.
        // also trying to calculate the new score since expected count has been updated.
        case "CD Exam Case":
          console.log("CD Exam Case");
          myNewExpectedCount[0] = myNewExpectedCount[0] + 1;
          break;
        case "Dental Public Health":
          console.log("Dental Public Health");
          myNewExpectedCount[1] = myNewExpectedCount[1] + 1;
          break;
        case "Endodontics":
          console.log("Endodontics");
          myNewExpectedCount[2] = myNewExpectedCount[2] + 1;
          break;
        case "Fixed Prosthodontics":
          console.log("Fixed Prosthodontics");
          myNewExpectedCount[3] = myNewExpectedCount[3] + 1;
          break;
        case "Operative Dentistry":
          myNewExpectedCount[4] = myNewExpectedCount[4] + 1;
          break;
        case "Oral Surgery":
          myNewExpectedCount[5] = myNewExpectedCount[5] + 1;
          break;
        case "Orthodontics":
          myNewExpectedCount[6] = myNewExpectedCount[6] + 1;
          break;
        case "Pedodontics":
          myNewExpectedCount[7] = myNewExpectedCount[7] + 1;
          break;
        case "Periodontics":
          myNewExpectedCount[8] = myNewExpectedCount[8] + 1;
          break;
        case "Removable Prosthodontics":
          myNewExpectedCount[9] = myNewExpectedCount[9] + 1;
          break;
      }
    }
    res(myNewExpectedCount);
    return;
  });
}

function updateExpectedIndicationCount(
  requestData,
  functionExpectedCount,
  functionIndicationQuota
) {
  return new Promise(async (res, rej) => {
    if (requestData.rows.length > 0) {
      console.log("Number of request of student = " + requestData.rows.length);
      console.log("pId : " + requestData.rows[0].pid);
      // 1. Update score for each request
      // 2. Update current student in lead for Patient.
      for (i = 0; i < requestData.rows.length; i++) {
        console.log("RequestDATA : \n");
        console.log(requestData.rows[i]);
        console.log("pId : " + requestData.rows[i].pid);

        console.log("New Expected Count : " + functionExpectedCount);
        console.log("Indication Quota : " + functionIndicationQuota);
        console.log(
          "Indications of request : " + requestData.rows[i].indications
        );
        var studentScore = 0;
        var quota = 0;
        var maxQuota = 0;
        for (let x = 0; x < requestData.rows[i].indications.length; x++) {
          console.log("Switch #" + x);
          switch (requestData.rows[i].indications[x]) {
            //Finding the indication that matches this patient and then adding it to the student's EXPECTED count.
            // also trying to calculate the new score since expected count has been updated.
            case "CD Exam Case":
              console.log("CD Exam Case");
              quota = functionIndicationQuota[0];
              maxQuota += quota;
              console.log(quota);
              console.log(maxQuota);
              studentScore += Math.max(quota - functionExpectedCount[0], 0);
              console.log(functionExpectedCount[0]);
              console.log(studentScore);
              break;
            case "Dental Public Health":
              console.log("Dental Public Health");
              quota = functionIndicationQuota[1];
              maxQuota += quota;
              console.log(quota);
              console.log(maxQuota);
              studentScore += Math.max(quota - functionExpectedCount[1], 0);
              console.log(functionExpectedCount[1]);
              console.log(studentScore);
              break;
            case "Endodontics":
              console.log("Endodontics");
              quota = functionIndicationQuota[2];
              maxQuota += quota;
              studentScore += Math.max(quota - functionExpectedCount[2], 0);
              break;
            case "Fixed Prosthodontics":
              console.log("Fixed Prosthodontics");
              quota = functionIndicationQuota[3];
              maxQuota += quota;
              studentScore += Math.max(quota - functionExpectedCount[3], 0);
              break;
            case "Operative Dentistry":
              quota = functionIndicationQuota[4];
              maxQuota += quota;
              studentScore += Math.max(quota - functionExpectedCount[4], 0);
              break;
            case "Oral Surgery":
              quota = functionIndicationQuota[5];
              maxQuota += quota;
              studentScore += Math.max(quota - functionExpectedCount[5], 0);
              break;
            case "Orthodontics":
              quota = functionIndicationQuota[6];
              maxQuota += quota;
              studentScore += Math.max(quota - functionExpectedCount[6], 0);
              break;
            case "Pedodontics":
              quota = functionIndicationQuota[7];
              maxQuota += quota;
              studentScore += Math.max(quota - functionExpectedCount[7], 0);
              break;
            case "Periodontics":
              quota = functionIndicationQuota[8];
              maxQuota += quota;
              studentScore += Math.max(quota - functionExpectedCount[8], 0);
              break;
            case "Removable Prosthodontics":
              quota = functionIndicationQuota[9];
              maxQuota += quota;
              studentScore += Math.max(quota - functionExpectedCount[9], 0);
              break;
          }
          console.log();
        }
        console.log("New RAWW Indication Scoring : " + studentScore);
        console.log("Max Quota : " + maxQuota);
        studentScore = (studentScore / maxQuota) * 0.3;
        studentScore = Math.round(studentScore * Math.pow(10, 12));
        console.log("Student Score : " + studentScore);
        console.log("FCFS Score : " + requestData.rows[i].fcfsscore);
        console.log("Seniority Score : " + requestData.rows[i].seniorityscore);
        newScore =
          parseInt(studentScore) +
          parseInt(requestData.rows[i].fcfsscore) +
          parseInt(requestData.rows[i].seniorityscore);
          console.log("Old Score : " + requestData.rows[i].score);
          console.log("New Score : " + newScore);
          console.log("Before updateScore, pId : " + requestData.rows[i].pid);
          await updateScoreAndIndications(
            requestData.rows[i],
            requestData.rows[i].pid,
            newScore
          ).then(async pass => {
              await truffle_connect.updateScore(requestData.rows[i].rid, newScore).then(pass => {
                  if (i == requestData.rows.length - 1) {
                      console.log("Ended allocation");
                      res("Pass");
                      return;
                    }
              }).catch(error => {
                  console.log("Error within contract updateScore");
                  console.log(error);
              })
          })
            .catch((error) => {
              console.log("Error within updateExpectedIndicationCount");
              rej(error);
              return;
            });
        }
      } else {
        res("No pending request for current transfer Student.");
        return;
      }
    });
  }

//Finding the indication that matches this patient and then adding it to the student's EXPECTED count.
// also trying to calculate the new score since expected count has been updated.
async function updateScoreAndIndications(data, patientId1, newScore1) {
  return new Promise((res, rej) => {
    console.log("Start of updating 1 Patient");
    console.log("1 - Patient Id: " + patientId1);
    console.log(newScore1);
    console.log("2 - I am CALLED!!!");
    // console.log(data);
    //Update ethereum of the newScore for this particular request.
    //

    updateRequestScore_query =
      "UPDATE public.request SET score = $1 WHERE rid = $2";
    pool.query(updateRequestScore_query, [newScore1, data.rid], (err, data) => {
      if (err == null) {
        console.log("3 - Updated request score");
        //After updating Request, update the HIGHEST scoring student that is tied to that patient so that it can be displayed.
        var highestScore_query =
          "select request.studId, student.name from public.request natural join public.student where pId = $1 and allocatedstatus != 'Withdrawn' ORDER BY score DESC LIMIT 1;";
        pool.query(
          highestScore_query,
          [patientId1],
          (err, highestScoreStudent) => {
            console.log(
              "4 - Retrieved highest scoring student, to be updated into Patient."
            );
            if (err) {
              console.log(err);
              console.log("Error retrieving highestScore for patient");
            }
            console.log(
              "Retrieved highest scoring student, to be updated into Patient."
            );
            if (err) {
              //should NOT happen
              console.log("Error in updating highest score");
              console.log(err);
              console.log(err);
              rej(err);
              return;
            }
            console.log(
              "5 - Highest scoring student for patient : " +
                highestScoreStudent.rows[0].name
            );
            console.log(highestScoreStudent.rows[0]);
            var updateRequest =
              "UPDATE public.patient SET leadingStudentId = $1, leadingStudentName = $2 WHERE pId = $3";
            pool.query(
              updateRequest,
              [
                highestScoreStudent.rows[0].studid,
                highestScoreStudent.rows[0].name,
                patientId1,
              ],
              (err, result) => {
                if (err) {
                  //should NOT happen
                  console.log("Error in updating highest score");
                  console.log(err);
                  rej(err);
                  return;
                }
                res(result);
                return;
              }
            );
          }
        );
      } else {
        console.log(err);
        console.log("Error updating request's new score.");
      }
    });
  });
}

module.exports = router;
