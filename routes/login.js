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

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL
// });

router.post('/', function (req, res, next) {

  var email = req.body.email;
  var password = req.body.password;
  console.log(email);
  console.log(password);

  var sql_query = "SELECT * FROM public.student WHERE public.student.email ='" + email + "' and public.student.password ='" + password + "'";

  pool.query(sql_query, (err, user) => {
    // console.log(user);
    if (user.rowCount === 1) {
      req.session.username = email;
      console.log(req.session.username);
      console.log("asdasdasd" + user.rows[0].uid);
      res.redirect('/viewAllPatients');
    }
    else {
      req.flash('error', 'Invalid username or password');

      res.redirect('/login');
    }

  });
});

router.get('/', function (req, res, next) {
  res.render('login', { title: 'Login' });
});

module.exports = router;
