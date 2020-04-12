const contract = require("truffle-contract");
const patient_artifact = require("../build/contracts/Patient.json");
const request_artifact = require("../build/contracts/Request.json");
var Patient = contract(patient_artifact);
var Request = contract(request_artifact)
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
  allocatePatient: function (requestId, patientId, sender) {
    
    return new Promise((res,rej) => {
      var self = this;
      Request.setProvider(self.web3.currentProvider);
      var requestInstance;
      //deploy Patient
      Request.deployed().then(function (instance) {
        requestInstance = instance;

        console.log("**Allocate Patient Contract **")
        console.log("Request id : " + requestId)
        console.log("Patient Id" + patientId)
        console.log("Sender Address : " + sender)
        requestInstance.processRequest(requestId, patientId, {
          from: sender,
          gas: "5000000"
        }).then(result => {
          res(result);
          return;
        }).catch(error => {
          console.log('Contract Error!!')
          console.log(error)
          rej("Error in Contract");
          return;
        });
      });
    })

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
    return new Promise((res, rej) => {
      console.log("ListPatient Start");
      var self = this;
      Patient.setProvider(self.web3.currentProvider);
      var patientInstance;
      Patient.deployed().then(function (instance) {
          patientInstance = instance;
          console.log("ListPatient End");
          patientInstance.listPatient(patientId, { from: sender }).then(result => {
            res(result);
            return;
          }).catch(error => {
            console.log("Contract Error!");
            console.log(error);
            rej("Error in Contract");
            return;
          });
        })
      });
    },
  unlistPatient: function (patientId, sender) {
    return new Promise((res, rej) => {
      console.log("UnlistPatient Start");
      var self = this;
      Patient.setProvider(self.web3.currentProvider);
      var patientInstance;
      Patient.deployed().then(function (instance) {
          patientInstance = instance;
          patientInstance.unlistPatient(patientId, { from: sender }).then(result => {
            res(result);
            return;
          }).catch(error => {
            console.log("Contract Error!");
            console.log(error);
            rej("Error in Contract");
            return;
          });
          console.log("UnlistPatient End");
        });
      });
    },

  studentTransfer: function (patientId, studentAddr, sender) {
    return new Promise((res, rej) => {
      var self = this;
      Patient.setProvider(self.web3.currentProvider);
      var patientInstance;
      Patient.deployed().then(function (instance) {
        patientInstance = instance;
        return patientInstance.studentTransfer(patientId, studentAddr, {
          from: sender,
          gas: "5000000"
        }).then(result => {
          res(result);
          return;
        }).catch(error =>{
          console.log('Contrat Error within Student Transfer');
          console.log(error);
          rej('Contract Error');
          return;
        });
      });
    })
  },
  resolvePatient: function (patientId, sender) {
    var self = this;
    Patient.setProvider(self.web3.currentProvider);
    var patientInstance;
    Patient.deployed().then(function (instance) {
      patientInstance = instance;
      return patientInstance.resolvePatient(patientId, {
        from: sender,
        gas: "5000000"
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
          patientInstance = instance;

          console.log(sender);
          patientInstance.createPatient
            .call(solidityIndication, {
              from: sender,
              gas: "5000000"
            })
            .then(patientID => {
              var pId = parseInt(patientID);
              console.log("PatientId : " + pId);

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
                    rej('Error within Database Query.');
                    return;
                  } else {
                    patientInstance
                      .createPatient(
                        solidityIndication,
                        { from: sender, gas: "5000000" }
                      )
                      .then(result => {
                        res(patientID);
                        return;
                      });
                  }
                }
              );
            })
            .catch(error => {
              console.log("Contract Error!")
              console.log(error);
              rej('Error with Contract.');
              return;
            });
      });
    });
  },

  createRequest: async function (studentScore, solidityIndications, sender, stuId, patientId, allocatedStatus, dbIndication, requestTimeStamp) {
    return new Promise((res, rej) => {
      var self = this;
      Request.setProvider(self.web3.currentProvider);
      var requestInstance;
      Request.deployed().then(instance => {
        requestInstance = instance;
        requestInstance.createRequest.call(studentScore, solidityIndications, { from: sender })
          .then(requestId => {
            var rId = parseInt(requestId);
            console.log("RequestId returned from Contract : " + rId);

            var createRequest_query = "INSERT INTO public.request(rId, studId, pId, allocatedStatus, indications, score, requestTimestamp) values($1,$2,$3,$4,$5,$6,$7)"
            pool.query(createRequest_query, [rId, stuId, patientId, allocatedStatus, dbIndication, studentScore, requestTimeStamp], (err, data) => {
              if (err) {
                console.log("Error in Insert Request Query");
                console.log(err)
                rej("Error within Database Insert Query");
                return;
              } else {
                requestInstance.createRequest(studentScore, solidityIndications, { from: sender, gas: "5000000" })
                  .then(result => {
                    res(patientId);
                    return;
                  })
              }
            })
          }).catch(error => {
            console.log("Contract Error!")
            console.log(error);
            rej("Error in Contract");
            return;
          })
      })
    })
  },
  // getRequest: function(requestId, sender){
  //   return new Promise((res,rej) => {
  //     var self = this;
  //     Request.setProvider(self.web3.currentProvider);
  //     var requestInstance;
  //     Request.deployed().then(instance =>{
  //       try {
  //         requestInstance = instance;
  //         requestInstance.getRequest.call(requestId, {from: sender})
  //         .then(result => {
  //           res(result);
  //           return
  //         })
  //       } catch (error) {
  //         rej(error);
  //         return;
  //       }
  //     })
  //   })
  // }

  getRequest: function (requestId, sender, callback) {
    var self = this;
    Request.setProvider(self.web3.currentProvider);
    var requestInstance;
    Request.deployed()
      .then(function (instance) {
        requestInstance = instance;
        return requestInstance.getRequest(requestId, { from: sender });
      })
      .then(function (value) {
        callback(value.valueOf());
      })
      .catch(function (e) {
        console.log(e);
        callback("ERROR 404");
      });
  },
  withdrawRequest: function (requestId, sender) {
    return new Promise((res, rej) => {
      var self = this;
      Request.setProvider(self.web3.currentProvider);
      var requestInstance;
      Request.deployed().then(function (instance) {
        requestInstance = instance;
        requestInstance.withdrawRequest(requestId, {
          from: sender
        }).then(pass => {
          res(pass)
          return;
        }).catch(error => {
          rej(error);
          return;
        });
      });
    })

  },
  updatePatient: function (
    patientId,
    solidityIndications,
    owner,
    resolution,
    sender) {
      return new Promise((res, rej)=> {
        var self = this;
        Patient.setProvider(self.web3.currentProvider);
        var patientInstance;
        console.log("patientId : " + patientId)
        console.log("patientName : " + patientName)
        console.log("patientContact : " + patientContact)
        console.log("solidityIndications : " + solidityIndications)
        console.log("owner : " + owner)
        console.log("resolution : " + resolution)
        console.log("sender : " + sender)
        
        Patient.deployed().then(function (instance) {
          patientInstance = instance;
          patientInstance.updatePatient(
            patientContact,
            solidityIndications,
            owner,
            resolution, {
            from: sender,
            gas: "5000000"
          }).then(pass => {
            res(pass);
            return
          }).catch(error => {
            console.log('Contract Error within Update Patient');
            console.log(error);
            rej('Contract Error!!');
            return;
          });
        });
      })
    
  },
  createPowerUserInPatient: function (powerUserAddr, sender) {
    var self = this;
    Patient.setProvider(self.web3.currentProvider);
    var patientInstance;
    Patient.deployed().then(function (instance) {
      patientInstance = instance;
      return patientInstance.createPowerUser(powerUserAddr, {
        from: sender
      });
    });
  },
  createPowerUserInReq: function (powerUserAddr, sender) {
    var self = this;
    Request.setProvider(self.web3.currentProvider);
    var requestInstance;
    Request.deployed().then(function (instance) {
      requestInstance = instance;
      return requestInstance.createPowerUser(powerUserAddr, {
        from: sender
      });
    });
  },
  createAdminUserInPatient: function (adminUserAddr, sender) {
    var self = this;
    Patient.setProvider(self.web3.currentProvider);
    var patientInstance;
    Patient.deployed().then(function (instance) {
      patientInstance = instance;
      return patientInstance.createAdminUser(adminUserAddr, {
        from: sender
      });
    });
  },
  createAdminUserInReq: function (adminUserAddr, sender) {
    var self = this;
    Request.setProvider(self.web3.currentProvider);
    var requestInstance;
    Request.deployed().then(function (instance) {
      requestInstance = instance;
      return requestInstance.createAdminUser(adminUserAddr, {
        from: sender
      });
    });
  },
  getPowerUser: function (powerUserAddr, sender) {
    var self = this;
    Request.setProvider(self.web3.currentProvider);
    var requestInstance;
    Request.deployed().then(function (instance) {
      requestInstance = instance;
      return requestInstance.getPowerUser(powerUserAddr, {
        from: sender
      });
    });
  }

};
