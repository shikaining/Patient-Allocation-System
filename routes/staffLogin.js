var express = require('express');
var CryptoJS = require('crypto-js');
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

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL
// });

router.post('/', function (req, res, next) {

  var email = req.body.email;
  var password = req.body.password;
  retrievePassword_query = "SELECT password FROM public.staff WHERE staff.email = '" + email +"'";
  pool.query(retrievePassword_query, (err,hashedPassword)=>{
    if(err){
      req.flash('error', 'Invalid username or password');
      res.redirect('/staffLogin')
    } else {
      verifyPassword = CryptoJS.AES.encrypt(password, 'IS4302').toString();
        if(verifyPassword = hashedPassword.rows[0].password){
          var sql_query = "SELECT * FROM public.staff WHERE public.staff.email ='" + email + "'";

          pool.query(sql_query, (err, staff) => {
            // console.log(staff);
            if (staff.rowCount === 1) {
              req.session.username = email;
              console.log(req.session.username);
              console.log("staff ID" + staff.rows[0].stfid);
              res.redirect('/createPatient');
            }
            else {
              req.flash('error', 'Invalid username or password');

              res.redirect('/staffLogin');
            }

          });
        } else {
          console.log("Bcrypt caught error");
          req.flash('error', 'Invalid username or password');
          res.redirect('/staffLogin')
        }
    }
  })
  
});

router.get('/', function (req, res, next) {
  res.render('staffLogin', { title: 'Staff Login' });
});

module.exports = router;
