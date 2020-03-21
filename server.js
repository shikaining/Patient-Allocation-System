const express = require('express');
const app = express();
const port = 3000 || process.env.PORT;
const Web3 = require('web3');
const truffle_connect = require('./connection/app.js');
const bodyParser = require('body-parser');
const db = require('./connection/queries');
var path = require('path');
var session = require('express-session');

app.get('/users', db.getUsers)
app.get('/users/:id', db.getUserById)
app.post('/users', db.createUser)
app.put('/users/:id', db.updateUser)
app.delete('/users/:id', db.deleteUser)


//Public pages
var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');


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



app.get('/getAccounts', (req, res) => {
  console.log("**** GET /getAccounts ****");
  //calls app.js's start method
  //the 'answer' here refers to the response from the start method
  truffle_connect.start(function (answer) {
    res.send(answer);
  })
});

app.post('/getBalance', (req, res) => {
  console.log("**** GET /getBalance ****");
  console.log(req.body);
  //req has account embedded
  //use this to specify the balance for the param in app.js
  let currentAcount = req.body.account;
  //calls refreshBalance in app.js
  truffle_connect.refreshBalance(currentAcount, (answer) => {
    let account_balance = answer;
    // call the start method of app.js
    truffle_connect.start(function (answer) {
      // get list of all accounts and send it along with the response
      let all_accounts = answer;
      //returning array of ans in response
      response = [account_balance, all_accounts]
      res.send(response);
    });
  });
});

app.post('/sendCoin', (req, res) => {
  console.log("**** GET /sendCoin ****");
  console.log(req.body);

  //embedded information from req
  let amount = req.body.amount;
  let sender = req.body.sender;
  let receiver = req.body.receiver;

  //send all the required info to app.js's send coin method
  //the response from app.js is balance
  //this is sent to another file's method that calls current method
  truffle_connect.sendCoin(amount, sender, receiver, (balance) => {
    res.send(balance);
  });
});
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

  truffle_connect.allocatePatient(patientId, studentAddr, sender => {
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
    res.send(answer);
  })
});

app.post('/listPatient', (req, res) => {
  console.log("**** /listPatient ****");
  console.log(req.body);

  let patientId = req.body.patientId;
  let sender = req.body.sender;

  truffle_connect.listPatient(patientId, sender => {
    //res.send(balance);
  });
});

app.post('/unlistPatient', (req, res) => {
  console.log("**** /unlistPatient ****");
  console.log(req.body);

  let patientId = req.body.patientId;
  let sender = req.body.sender;

  truffle_connect.unlistPatient(patientId, sender => {
    //res.send(balance);
  });
});

app.post('/studentTransfer', (req, res) => {
  console.log("**** /studentTransfer ****");
  console.log(req.body);

  let patientId = req.body.patientId;
  let studentAddr = req.body.studentAddr;
  let sender = req.body.sender;

  truffle_connect.studentTransfer(patientId, studentAddr, sender => {
    //res.send(balance);
  });
});

app.get('/getPatient', (req, res) => {
  console.log("**** GET /getPatient ****");
  console.log(req.body);
  let patientId = req.body.patientId;
  let sender = req.body.sender;

  truffle_connect.getPatient(patientId, sender, (answer) => {
    let patientName = answer[0];
    let patientContact = answer[1];
    let indications = answer[2];
    let patientOwner = answer[3];
    let resolved = answer[4];
    response = [patientName, patientContact,indications, patientOwner, resolved]
    res.send(response);
  })
});

app.post('/createPatient', (req, res) => {
  console.log("**** /createPatient ****");
  console.log(req.body);

  let patientName = req.body.patientName;
  let patientContact = req.body.patientContact;
  let indications = req.body.indications;
  let sender = req.body.sender;

  truffle_connect.createPatient(patientName, patientContact, indications, sender => {
    //res.send(balance);
  });
});

app.listen(port, () => {

  // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
  truffle_connect.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));

  console.log("Express Listening at http://localhost:" + port);

});
