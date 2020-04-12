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

var staff;
var staffAddr;
var username;
var name;
var newExpectedCount;
var indicationQuota;

/* GET home page. */
router.get("/", async function (req, res, next) {
  this.username = req.session.username;

  username = req.session.username;
  console.log(this.username);

  if (this.username === undefined) {
    res.redirect("/staffLogin");
  } else {
    var sql_query1 = "SELECT * FROM public.staff WHERE public.staff.email = $1";
    pool.query(sql_query1, [username], (err, data) => {
      name = data.rows[0].name;
      console.log("name " + name);
    });

    var sql_query = "SELECT * FROM public.staff WHERE public.staff.email = $1";
    pool.query(sql_query, ["staff1@gmail.com"], (err, data) => {
      var staffAddr = data.rows[0].address;
      truffle_connect.getPatient(1, staffAddr, (answer) => {
        console.log(answer);
      });
    });

    //retrieve all patients to be allocated
    var retreiveAllRequests_query =
      "SELECT * FROM public.patient WHERE public.patient.allocatedStatus = $1 AND public.patient.listStatus = $2";
    await pool.query(
      retreiveAllRequests_query,
      ["Not Allocated", "Listed"],
      (err, data) => {
        res.render("allocatePatients", {
          title: "Allocate Patients",
          user: name,
          data: data.rows,
        });
      }
    );
  }
});

// POST
router.post("/", async function (req, res, next) {
  //retrieve information frmo frontend
  var patientId = req.body.patientId;
  var studId = req.body.studentId;
  var requestId;

  console.log("Patient ID" + patientId);
  console.log("Student ID" + studId);

  //retrieve student object
  var retrieveStudentInfo_query =
    "SELECT * FROM public.student WHERE public.student.studid = $1";

  let me = this;
    //Update into Ethereum
    //retrieve current staff object
    var sql_query = "SELECT * FROM public.staff WHERE public.staff.email = $1";
    pool.query(sql_query, [me.username], (err, data) => {
      me.staff = data.rows[0];
      me.staffAddr = data.rows[0].address;
      var requesId_query =
        "SELECT * FROM public.request WHERE public.request.pid = $1" +
        " AND public.request.studid = $2 AND request.allocatedstatus = 'Pending'";
      pool.query(requesId_query, [patientId, studId], (err, data) => {
        requestId = data.rows[0].rid;
        truffle_connect
          .allocatePatient(requestId, patientId, me.staffAddr)
          .then((pass) => {
            //update postgreSQL Database

            //1-update allocatedStatus of patient
            var allocatePatient =
              "UPDATE public.patient SET allocatedStatus = $1, studId = $2 WHERE pid = $3";
            pool.query(
              allocatePatient,
              ["Allocated", studId, patientId],
              (err, data) => {
                console.log("1-update allocatedStatus of patient - Start");
                if (err === undefined) {
                  //2-update allocatedStatus of request (successful one)
                  var successfulRequest_query =
                    "UPDATE public.request SET allocatedStatus = $1 WHERE rid = $2";
                  console.log(requestId);
                  pool.query(
                    successfulRequest_query,
                    ["Allocated", requestId],
                    (err, data) => {
                      console.log(
                        "2-update allocatedStatus of request (successful one) - Start"
                      );
                      if (err === undefined) {
                        //3-update allocatedStatus of request (unsuccessful ones)
                        var failedRequest_query =
                          "UPDATE public.request SET allocatedStatus = $1 WHERE pid = $2 AND studId != $3";
                        pool.query(
                          failedRequest_query,
                          ["Not Allocated", patientId, studId],
                          (err, data) => {
                            console.log(
                              "3-update allocatedStatus of request (unsuccessful ones) - Start"
                            );
                            if (err === undefined) {

                              //Update expectedCount and recalculate all the top scores.
                              //Retrieve indication quota to graduate.
                              indicationQuota_query =
                                "SELECT * FROM public.indicationquota";

                              pool.query(indicationQuota_query, (err, data) => {
                                indicationQuota = data.rows[0].indicationarray;

                                var student_request_infoQuery =
                                  "SELECT r.indications, r.score,s.expectedcount, r.seniorityScore, r.fcfsScore, r.rid,s.studid FROM request r LEFT JOIN student s on r.studid = s.studid WHERE r.rid = $1";
                                pool.query(
                                  student_request_infoQuery,
                                  [requestId],
                                  async (err, data) => {
                                    //Calculate new expected indication count for studen
                                    newExpectedIndicationCount = await calculate_add_NewExpectedIndicationCount(
                                      data.rows[0].expectedcount.slice(),
                                      data.rows[0].indications
                                    );

                                    //updated their expected indication COUNT
                                    var updateExepectedCount_query =
                                      "UPDATE public.student SET expectedCount = $1 WHERE studid = $2";
                                    pool.query(
                                      updateExepectedCount_query,
                                      [newExpectedIndicationCount, studId],
                                      (err, data) => {
                                        //Updating all pending request of current student, updating the SCORE.
                                        var retrievePendingRequest_query =
                                          "SELECT * FROM public.request WHERE allocatedstatus = 'Pending' and studid = $1";
                                        pool.query(
                                          retrievePendingRequest_query,
                                          [studId],
                                          async (err, requestData) => {
                                            await updateExpectedIndicationCount(
                                              requestData,
                                              newExpectedIndicationCount,
                                              indicationQuota
                                            ).then((pass) => {
                                              req.flash(
                                                "info",
                                                "Patient sucessfully allocated to Student."
                                              );
                                            });
                                          }
                                        );
                                      }
                                    );
                                  }
                                );
                              });
                            } else {
                              req.flash(
                                "error",
                                "An error has occurred! Please try again"
                              );
                            }
                            console.log(
                              "3-update allocatedStatus of request (unsuccessful ones) - End"
                            );

                            res.redirect("/allocatePatients");
                          }
                        );
                      } else {
                        req.flash(
                          "error",
                          "An error has occurred! Please try again"
                        );
                      }
                      console.log(
                        "2-update allocatedStatus of request (successful one) - End"
                      );
                      //res.redirect('/allocatePatients');
                    }
                  );
                } else {
                  req.flash("error", "An error has occurred! Please try again");
                }
                console.log("1-update allocatedStatus of patient - END");
                //res.redirect('/allocatePatients');
              }
            );
          })
          .catch((error) => {
            console.log("Caught error within AllocatePatient.js");
            req.flash("error", "Failed to Allocate Patient due to - " + error);
            return;
          });
      });
    });
});

function updateExpectedIndicationCount(
    requestData,
    functionExpectedCount,
    functionIndicationQuota
  ) {
      return new Promise(async (res, rej) => {
          if(requestData.rows.length > 0){
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
          console.log("Indications of request : " + requestData.rows[i].indications);
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
          ).then(pass => {
            if (i == requestData.rows.length - 1) {
              console.log("Ended allocation");
              res('Pass');
              return;
            }
          }).catch(error => {
            console.log('Error within updateExpectedIndicationCount');
            rej(error);
            return;
          });
          
        }
          } else {
              res('No pending request for current transfer Student.');
              return;
          }
      })
      
    
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
        //Retrieving highest scoring student
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
                console.log("6 - End of Updating 1 Patient.");
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

function calculate_add_NewExpectedIndicationCount(
  oldExpectedIndication,
  patientIndications
) {
  return new Promise((res, rej) => {
    oldExpectedIndication = oldExpectedIndication.slice();
    myNewExpectedCount = oldExpectedIndication.slice();

    console.log("Inside ADDITION method of expected Indication");
    console.log(myNewExpectedCount);
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

module.exports = router;
