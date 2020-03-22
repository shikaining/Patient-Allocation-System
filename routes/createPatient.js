var express = require('express');
var router = express.Router();

const { Pool } = require('pg')
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
  user: 'postgres',
  host: 'localhost',
  database: 'api',
  password: 'password',
  port: 5432,
})


/* GET home page. */
router.get('/', function (req, res, next) {
  //Check for session
  var username = req.session.username;

  console.log(username);

  if (username === undefined) {
    res.redirect('/login');
  } else {
    var sql_query = "SELECT * FROM public.staff WHERE public.staff.email = $1";

    pool.query(sql_query,[username], (err, data) => {
      // console.log("aaaaa" + data);
      // console.log("bbbbb" + data.rows[0].stfId);
    });
  }

  res.render('createPatient', { title: 'Create a Patient', user: username });
});

// POST
router.post('/', function (req, res, next) {
  var username = req.session.username;

  pool.query("SELECT stfId FROM public.staff WHERE public.staff.email = $1", [username], (err, staff) => {
    console.log("staffId " + staff.rows[0].stfid);
    console.log("rowcount" + staff.rowCount);
    console.log("staff" + staff.rows[0]);
    var stfId = staff.rows[0].stfid;


    // Retrieve Information
    var patientName = req.body.patientName;
    var patientNRIC = req.body.patientNRIC;
    var patientContact = req.body.patientContact;
    var indications = req.body.indications + '';
    console.log("indications " + stfId + " " + indications.split(','));


    // split string result by ',' char
    var indicationsArr = indications.split(',');

    var sql_query = "INSERT INTO public.patient(stfId, name, nric, contactNo, listStatus, allocatedStatus, curedStatus, indications) values($1,$2,$3,$4,$5,$6,$7,$8)";

    pool.query(sql_query, [stfId, patientName, patientNRIC, patientContact, 'Not Listed', 'Not Allocated', 'Not Cured',indicationsArr], (err, data) => {
      console.log("cvcvcv" + err);
      req.flash('info', 'Patient Created');
      res.redirect('/createPatient')
    });
   });

});

module.exports = router;
