var express = require('express');
var router = express.Router();

const db = require("../connection/queries");
const truffle_connect = require("../connection/app");
const { Pool } = require('pg')

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'api',
    password: 'password',
    port: 5432,
})

var student;
/* GET home page. */
router.get('/', function (req, res, next) {
    var username = req.session.username;

    console.log(username);

    if (username === undefined) {
        res.redirect('/login');
    } else {
        //retrieve all listed patients from db
        var retreiveAllPatientInfo =
        "SELECT * FROM public.patient WHERE public.patient.listStatus = $1 OR public.patient.curedStatus = $2";
        pool.query(retreiveAllPatientInfo, ['Listed', 'Cured'], (err, data) => {
            console.log("Patient" + data.rowCount);
            res.render('viewAllPatients', { title: 'View All Patients', user: username, data: data.rows });
        });
        //retrieve current student object
        var sql_query =
            "SELECT * FROM public.student WHERE public.student.email = $1";

        pool.query(sql_query, [username], (err, data) => {
            student = data.rows[0];
            console.log(student)
        });
    }
});

// POST
router.post('/', async function (req, res, next) {

});

module.exports = router;
