var express = require('express');
var router = express.Router();

const { Pool } = require('pg')

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'api',
    password: 'password',
    port: 5432,
})

/* GET home page. */
router.get('/', function (req, res, next) {
    var username = req.session.username;
    console.log(username);

    if (username === undefined) {
        res.redirect('/login');
    } else {
        var sql_query = "SELECT * FROM public.student WHERE public.student.email ='" + username + "'";
        pool.query(sql_query, (err, user) => {
            console.log(user);
            var studId = user.rows[0].studid;
            console.log("student id" + studId);
            var retreiveAllRequestInfo = "SELECT * FROM public.request WHERE public.request.studId = $1";
            pool.query(retreiveAllRequestInfo, [studId], (err, data) => {
                console.log("rowCount" + data.rowCount);
                res.render('viewRequests', { title: 'View Requests', user: username, data: data.rows });
            });
        });
    }
});

// POST
router.post('/', function (req, res, next) {

});

module.exports = router;
