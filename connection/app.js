const contract = require('truffle-contract');
const patient_artifact = require('../build/contracts/Patient.json');
var Patient = contract(patient_artifact);
var db = require('./queries')

module.exports = {
  loadAddress: function () {
    var self = this;
    // var listOfAccounts = await self.web3.eth.getAccounts()

    self.web3.eth.getAccounts(function (err, accs) {
      // console.log(accs)
      console.log("Initialising DB Address")
      db.init(accs)
    })

    // })

  },
  /*
  CALLS PATIENT CONTRACT
  */
  allocatePatient: function (patientId, studentAddr, sender) {
    var self = this;
    Patient.setProvider(self.web3.currentProvider);
    var patientInstance;
    //deploy Patient
    Patient.deployed().then(function (instance) {
      patientInstance = instance;
      //call send coin, must give receiver and amount and define sender acct
      return patientInstance.allocatePatient(patientId, studentAddr, { from: sender });
    });
  },
  getTotalPatients: function (callback) {
    var self = this;

    // Bootstrap the MetaCoin abstraction for Use.
    Patient.setProvider(self.web3.currentProvider);
    var patientInstance;
    Patient.deployed().then(function (instance) {
      patientInstance = instance;
      return patientInstance.getTotalPatients();
    }).then(function (value) {
      callback(value.valueOf());
    }).catch(function (e) {
      console.log(e);
      callback("ERROR 404");
    });
  },
  getOwner: function (callback) {
    var self = this;
    Patient.setProvider(self.web3.currentProvider);
    var patientInstance;
    Patient.deployed().then(function (instance) {
      patientInstance = instance;
      return patientInstance.getOwner.call(); //BigNumber Error thrown inside, not sure why, but it returns address fine.
    }).then(function (value) {
      callback(value.valueOf());
    }).catch(function (e) {
      console.log("GetOWner Error: " + e);
      callback("ERROR 404");
    });
  },
  listPatient: function (patientId, sender) {
    console.log("ListPatient Start")
    var self = this;
    Patient.setProvider(self.web3.currentProvider);
    var patientInstance;
    Patient.deployed().then(function (instance) {
      patientInstance = instance;
      console.log("ListPatient End")
      return patientInstance.listPatient(patientId, { from: sender });
    });
  },
  unlistPatient: function (patientId, sender) {
    console.log("UnlistPatient Start")
    var self = this;
    Patient.setProvider(self.web3.currentProvider);
    var patientInstance;
    Patient.deployed().then(function (instance) {
      patientInstance = instance; console.log("UnlistPatient End")
      return patientInstance.unlistPatient(patientId, { from: sender });
    });
  },
  studentTransfer: function (patientId, studentAddr, sender) {
    var self = this;
    Patient.setProvider(self.web3.currentProvider);
    var patientInstance;
    //deploy Patient
    Patient.deployed().then(function (instance) {
      patientInstance = instance;
      //call send coin, must give receiver and amount and define sender acct
      return patientInstance.studentTransfer(patientId, studentAddr, { from: sender });
    });
  },
  getPatient: function (patientId, sender, callback) {
    var self = this;
    Patient.setProvider(self.web3.currentProvider);
    var patientInstance;
    Patient.deployed().then(function (instance) {
      patientInstance = instance;
      return patientInstance.getPatient(patientId, { from: sender });
    }).then(function (value) {
      callback(value.valueOf());
    }).catch(function (e) {
      console.log(e);
      callback("ERROR 404");
    });
  },
  createPatient: async function (patientName, patientContact, indications, sender) {
    var self = this;
    Patient.setProvider(self.web3.currentProvider);
    var patientInstance;
    console.log("#1")
    Patient.deployed().then(function (instance) {
      patientInstance = instance;
      console.log("#2")
      return patientInstance.createPatient(patientName, patientContact, indications, { from: sender, gas: '5000000' });
    });
  }


}
