var express = require("express");
var router = express.Router();
const db = require("../connection/queries");
const truffle_connect = require("../connection/app");

const { Pool } = require("pg");
/* --- V7: Using Dot Env ---
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '********',
  port: 5432,
})
*/
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "api",
  password: "password",
  port: 5432
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
  "Removable Prosthodontics"
]; 

var staff;

/* GET home page. */
router.get("/", function(req, res, next) {
  //Check for session
  var username = req.session.username;

  // console.log(username);

  if (username === undefined) {
    res.redirect("/login");
  } else {
    var sql_query = "SELECT * FROM public.staff WHERE public.staff.email = $1";

    pool.query(sql_query, [username], (err, data) => {
      staff = data.rows[0];
    });
  }

  res.render("createPatient", { title: "Create a Patient", user: username });
});

// POST
router.post("/", async function(req, res, next) {
  console.log("Create Patient *POST* method");
  var username = req.session.username;

  rawStaff = await db.select(
    "public.staff",
    "stfId",
    `public.staff.email='` + username + `'`
  );
  // console.log(rawStaff.rows[0])
  // console.log(rawStaff.rows[0].stfId);
  var stfId = rawStaff.rows[0].stfid;

  // Retrieve Information
  var patientName = req.body.patientName;
  var patientNRIC = req.body.patientNRIC;
  var patientContact = req.body.patientContact;
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
  var listStatus = "Not Listed";
  var allocatedStatus = "Not Allocated";
  var curedStatus = "Not Cured";

  try {
    //Update into Ethereum
    // console.log(staff.address);
    // console.log(patientName);
    // console.log(patientContact);
    // console.log(solidityIndication);
    var sql_query =
      "INSERT INTO public.patient(pId, stfId, name, nric, contactNo, listStatus, allocatedStatus, curedStatus, indications) values($1,$2,$3,$4,$5,$6,$7,$8,$9)";

    var patientId = await truffle_connect.createPatient(
      sql_query,
      stfId,
      patientName,
      patientNRIC,
      patientContact,
      listStatus,
      allocatedStatus,
      curedStatus,
      dbIndication,
      solidityIndication,
      staff.address
    );

    req.flash("info", "Patient Created");
    res.redirect("/createPatient");
  } catch (error) {
    console.log("ERROR: " + error);
    req.flash("info", "Patient Failed to be Created");
    res.redirect("/createPatient");
  }
});

module.exports = router;
