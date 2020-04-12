const express = require('express');
const app = express();
const port = 3000 || process.env.PORT;
const Web3 = require('web3');
const truffle_connect = require('./connection/app.js');
const bodyParser = require('body-parser');
const db = require('./connection/queries');
var path = require('path');
var session = require('express-session');

//Public pages
var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');
var staffLoginRouter = require('./routes/staffLogin');
var registerStudentAccountRouter = require('./routes/registerStudentAccount');

//Staff pages
var createPatientRouter = require('./routes/createPatient');
var viewPatientRouter = require('./routes/viewPatients');
var allocatePatientRouter = require('./routes/allocatePatients');
var createStaffAccountRouter = require('./routes/createStaffAccount');

//Student pages
var viewAllUnallocatedPatientsRouter = require('./routes/viewAllUnallocatedPatients');
var viewAllPatientsRouter = require('./routes/viewAllPatients');
var viewRequestRouter = require('./routes/viewRequests');
var resolveRequestsRouter = require('./routes/resolveRequests');

var indicationsArray = ["CDExamCase",
"DentalPublicHealth",
"Endodontics",
"FixedProsthodontics",
"OperativeDentistry",
"OralSurgery",
"Orthodontics",
"Pedodontics",
"Periodontics",
"RemovableProsthodontics"]

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//session
app.use(session({
  secret: '...',
  resave: true,
  saveUninitialized: true,
  maxAge: 1000 * 60 * 60		// 1 hour
}));

//messages
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});


//calls the files in public static
//app.use('/', express.static('public_static'));

//app.use(express.static(path.join(__dirname, 'public_static')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static(path.join(__dirname, 'public_static')));

//View pages
app.use('/home', indexRouter);
app.use('/login', loginRouter);
app.use('/staffLogin', staffLoginRouter);
app.use('/registerStudentAccount', registerStudentAccountRouter);

app.use('/createStaffAccount', createStaffAccountRouter);
app.use('/createPatient', createPatientRouter);
app.use('/viewPatients', viewPatientRouter);
app.use('/allocatePatients', allocatePatientRouter);

app.use('/viewAllUnallocatedPatients', viewAllUnallocatedPatientsRouter);
app.use('/viewRequests', viewRequestRouter);
app.use('/viewAllPatients', viewAllPatientsRouter);
app.use('/resolveRequests', resolveRequestsRouter);

/*
PATIENT CONTRACT
*/
app.post('/allocatePatient', (req, res) => {
  console.log("**** /allocatePatient ****");
  console.log(req.body);

  //embedded information from req
  let patientId = req.body.patientId;
  let studentAddr = req.body.studentAddr;
  let sender = req.body.sender;

  truffle_connect.allocatePatient(patientId, studentAddr, sender, () => {
    //res.send(balance);
  });
});

app.get('/getTotalPatients', (req, res) => {
  console.log("**** GET /getTotalPatients ****");

  truffle_connect.getTotalPatients(function (answer) {
    res.send(answer);
  })
});

app.get('/getOwner', (req, res) => {
  console.log("**** GET /getOwner ****");

  truffle_connect.getOwner(function (answer) {
    console.log("GetOwner: " + answer);
    res.send(answer);
  })
});

app.post('/listPatient', (req, res) => {
  console.log("**** /listPatient ****");
  console.log(req.body);

  let patientId = req.body.patientId;
  let sender = req.body.sender;

  truffle_connect.listPatient(patientId, sender, () => {

  });
});

app.post('/unlistPatient', (req, res) => {
  console.log("**** /unlistPatient ****");
  console.log(req.body);

  let patientId = req.body.patientId;
  let sender = req.body.sender;

  truffle_connect.unlistPatient(patientId, sender, () => {

  });
});

app.post('/studentTransfer', (req, res) => {
  console.log("**** /studentTransfer ****");
  console.log(req.body);

  let patientId = req.body.patientId;
  let studentAddr = req.body.studentAddr;
  let sender = req.body.sender;

  truffle_connect.studentTransfer(patientId, studentAddr, sender, () => {
    //res.send(balance);
  });
});

app.get('/getPatient', (req, res) => {
  console.log("**** GET /getPatient ****");
  console.log(req.body);
  let patientId = req.body.patientId;
  let sender = req.body.sender;

  truffle_connect.getPatient(patientId, sender, (answer) => {
    let indications = answer[0];
    let patientOwner = answer[1];
    let resolved = answer[2];
    response = [indications, patientOwner, resolved]
    // res.send(response);
  })
});

app.post('/createPatient', (req, res) => {
  console.log("**** /createPatient ****");
  console.log(req.body);

  let indications = req.body.indications.split(",").filter(x => x.trim().length && !isNaN(x)).map(Number); // To be used for Solidity Contract
  let dbIndication = "{"; // To be use as insert statement to DB.
  for(indication in indications){
    dbIndication += indicationsArray[indication]
  }
  dbIndication += "}"

  //Testing dummy data, must change eventually
  let staffId = 1
  let patientNRIC = 1234

  // db.insert('Patient',
  //   'stfId, name, nric, contactNo, listStatus, allocatedStatus, curedStatus, indications',
  //   staffId + "," + patientName + "," + patientNRIC + "," + patientContact + "," + "Not Listed"+ ","
  //   + "Not Allocated" + "," + "Not Cured" + "," + dbIndication)
  // console.log("Indications passed to contract: " + indications);
  let sender = req.body.sender;

  truffle_connect.createPatient(indications, sender, () => {
    //res.send(balance);
    //insert into DB.
  });
});

app.listen(port, () => {

  // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
  truffle_connect.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
  truffle_connect.loadAddress();
  console.log("Express Listening at http://localhost:" + port);

});
