const contract = require('truffle-contract');

const metacoin_artifact = require('../build/contracts/MetaCoin.json');
var MetaCoin = contract(metacoin_artifact);
const patient_artifact = require('../build/contracts/Patient.json');
var Patient = contract(patient_artifact);

//methods here calls contracts' methods
module.exports = {
  //this method retrieves users' accounts
  start: function (callback) {
    var self = this;

    // Bootstrap the MetaCoin abstraction for Use.
    MetaCoin.setProvider(self.web3.currentProvider);

    // Get the initial account balance so it can be displayed.
    // returns current user's accounts
    self.web3.eth.getAccounts(function (err, accs) {
      if (err != null) {
        console.log("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        console.log("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }
      self.accounts = accs;
      self.account = self.accounts[2];

      callback(self.accounts);
    });
  },
  refreshBalance: function (account, callback) {
    var self = this;

    // Bootstrap the MetaCoin abstraction for Use.
    MetaCoin.setProvider(self.web3.currentProvider);

    var meta;
    //deploys contract metacoin
    MetaCoin.deployed().then(function (instance) {
      meta = instance;
      //calls getBalance method in metacoin
      //chose account
      return meta.getBalance.call(account, { from: account });
    }).then(function (value) {
      //executed after it has finished
      callback(value.valueOf());
    }).catch(function (e) {
      console.log(e);
      //executed after catching error
      callback("Error 404");
    });
  },
  sendCoin: function (amount, sender, receiver, callback) {
    var self = this;

    // Bootstrap the MetaCoin abstraction for Use.
    MetaCoin.setProvider(self.web3.currentProvider);

    var meta;
    //deploy metacoin
    MetaCoin.deployed().then(function (instance) {
      meta = instance;
      //call send coin, must give receiver and amount and define sender acct
      return meta.sendCoin(receiver, amount, { from: sender });
    }).then(function () {
      //call's current file's refresh balance method
      //returns the 'answer'
      self.refreshBalance(sender, function (answer) {
        callback(answer);
      });
    }).catch(function (e) {
      console.log(e);
      callback("ERROR 404");
    });
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
    //deploy Patient
    Patient.deployed().then(function (instance) {
      patientInstance = instance;
      //call send coin, must give receiver and amount and define sender acct
      console.log("ListPatient End")
      return patientInstance.listPatient(patientId, { from: sender });
    });
  },
  unlistPatient: function (patientId, sender) {
    var self = this;
    Patient.setProvider(self.web3.currentProvider);
    var patientInstance;
    //deploy Patient
    Patient.deployed().then(function (instance) {
      patientInstance = instance;
      //call send coin, must give receiver and amount and define sender acct
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
  createPatient: function (patientName, patientContact, indications, sender) {
    var self = this;
    Patient.setProvider(self.web3.currentProvider);
    var patientInstance;
    //deploy Patient
    Patient.deployed().then(function (instance) {
      patientInstance = instance;
      return patientInstance.createPatient(patientName, patientContact, indications, { from: sender });
    });
  }


}
