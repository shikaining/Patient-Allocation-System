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

  retrievePassword_query = "SELECT password FROM public.student WHERE student.email = '" + email +"'";
  pool.query(retrievePassword_query, (err,hashedPassword)=>{
    if(err){
      req.flash('error', 'Invalid username or password');
      res.redirect('/login')
    } else {
      verifyPassword = CryptoJS.AES.encrypt(password, 'IS4302').toString();
        if(verifyPassword = hashedPassword.rows[0].password){
          var sql_query = "SELECT * FROM public.student WHERE public.student.email ='" + email + "'";

          pool.query(sql_query, (err, student) => {
            // console.log(student);
            if (student.rowCount === 1) {
              req.session.username = email;
              res.redirect('/viewAllPatients');
            }
            else {
              req.flash('error', 'Invalid username or password');

              res.redirect('/login');
            }

          });
        } else {
          console.log("Wrong Password");
          req.flash('error', 'Invalid username or password');
          res.redirect('/login')
        }
    }
  })
});

router.get('/', function (req, res, next) {
  res.render('login', { title: 'Login' });
});

module.exports = router;
