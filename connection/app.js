const contract = require("truffle-contract");
const patient_artifact = require("../build/contracts/Patient.json");
var Patient = contract(patient_artifact);
var db = require("./queries");

const Pool = require("pg").Pool;
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "api",
  password: "password",
  port: 5432
});

module.exports = {
  loadAddress: function () {
    var self = this;
    // var listOfAccounts = await self.web3.eth.getAccounts()

    self.web3.eth.getAccounts(function (err, accs) {
      // console.log(accs)
      console.log("Initialising DB Address");
      db.init(accs);
    });

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
      return patientInstance.allocatePatient(patientId, studentAddr, {
        from: sender,
        gas: "5000000"
      });
    });
  },
  getTotalPatients: function (callback) {
    var self = this;
    Patient.setProvider(self.web3.currentProvider);
    var patientInstance;
    Patient.deployed()
      .then(function (instance) {
        patientInstance = instance;
        return patientInstance.getTotalPatients();
      })
      .then(function (value) {
        callback(value.valueOf());
      })
      .catch(function (e) {
        console.log(e);
        callback("ERROR 404");
      });
  },
  getOwner: function (callback) {
    var self = this;
    Patient.setProvider(self.web3.currentProvider);
    var patientInstance;
    Patient.deployed()
      .then(function (instance) {
        patientInstance = instance;
        return patientInstance.getOwner.call(); //BigNumber Error thrown inside, not sure why, but it returns address fine.
      })
      .then(function (value) {
        callback(value.valueOf());
      })
      .catch(function (e) {
        console.log("GetOWner Error: " + e);
        callback("ERROR 404");
      });
  },
  listPatient: function (patientId, sender) {
    console.log("ListPatient Start");
    var self = this;
    Patient.setProvider(self.web3.currentProvider);
    var patientInstance;
    Patient.deployed().then(function (instance) {
      patientInstance = instance;
      console.log("ListPatient End");
      return patientInstance.listPatient(patientId, { from: sender });
    });
  },
  unlistPatient: function (patientId, sender) {
    console.log("UnlistPatient Start");
    var self = this;
    Patient.setProvider(self.web3.currentProvider);
    var patientInstance;
    Patient.deployed().then(function (instance) {
      patientInstance = instance;
      console.log("UnlistPatient End");
      return patientInstance.unlistPatient(patientId, { from: sender });
    });
  },
  studentTransfer: function (patientId, studentAddr, sender) {
    var self = this;
    Patient.setProvider(self.web3.currentProvider);
    var patientInstance;
    Patient.deployed().then(function (instance) {
      patientInstance = instance;
      return patientInstance.studentTransfer(patientId, studentAddr, {
        from: sender
      });
    });
  },
  getPatient: function (patientId, sender, callback) {
    var self = this;
    Patient.setProvider(self.web3.currentProvider);
    var patientInstance;
    Patient.deployed()
      .then(function (instance) {
        patientInstance = instance;
        return patientInstance.getPatient(patientId, { from: sender });
      })
      .then(function (value) {
        callback(value.valueOf());
      })
      .catch(function (e) {
        console.log(e);
        callback("ERROR 404");
      });
  },
  createPatient: async function (
    sql_query,
    stfId,
    patientName,
    patientNRIC,
    patientContact,
    listStatus,
    allocatedStatus,
    curedStatus,
    dbIndication,
    solidityIndication,
    sender
  ) {
    return new Promise((res, rej) => {
      var self = this;
      Patient.setProvider(self.web3.currentProvider);
      var patientInstance;
      Patient.deployed().then(function (instance) {
        try {
          patientInstance = instance;
          patientInstance.createPatient
            .call(patientName, patientContact, solidityIndication, {
              from: sender,
              gas: "5000000"
            })
            .then(patientID => {
              var pId = parseInt(patientID);
              console.log("PatientId : " + pId)

              pool.query(
                sql_query,
                [
                  pId,
                  stfId,
                  patientName,
                  patientNRIC,
                  patientContact,
                  listStatus,
                  allocatedStatus,
                  curedStatus,
                  dbIndication
                ],
                (err, data) => {
                  if (err) {
                    console.log("Error in query");
                    console.log(err);
                    rej(err);
                    return;
                  } else {
                    patientInstance
                      .createPatient(patientName, patientContact, solidityIndication, { from: sender, gas: "5000000" })
                      .then(result => {
                        res(patientID);
                        return;
                      });
                  }
                }
              );
            });
        } catch (error) {
          rej(error);
          return;
        }
      });
    });
  }


};
