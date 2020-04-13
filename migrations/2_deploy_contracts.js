const Patient = artifacts.require("Patient");
const Request = artifacts.require("Request");

module.exports = function(deployer, network, accounts) {
	const owner = accounts[0];
	
	const powerUsers = [accounts[1], accounts[2]];
	const adminUsers = [accounts[3], accounts[4]];
	
	let patientInstance;
	let requestInstance;
	
	return deployer
    .then(() => {
        return deployer.deploy(Patient, powerUsers, adminUsers, 
							   {from: owner});
    }).then((inst) => {
        patientInstance = inst;
        return deployer.deploy(Request, powerUsers, adminUsers, 
							   inst.address, {from: owner});
    }).then((inst) => {
        requestInstance = inst;
		return patientInstance.setRequestAddress(requestInstance.address,
												 {from: owner});
    }).then(() => {
		// Initializing Sequence for Application Demonstration
        patientInstance.createPatient([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], {from: accounts[1]});
		patientInstance.createPatient([1, 2, 3, 4, 5, 6, 7], {from: accounts[1]});
		patientInstance.createPatient([2, 3, 5, 6, 9], {from: accounts[1]});
		patientInstance.createPatient([3, 4, 5], {from: accounts[1]});
		patientInstance.createPatient([4], {from: accounts[1]});
		patientInstance.createPatient([0], {from: accounts[1]});
		patientInstance.createPatient([0], {from: accounts[1]});
		patientInstance.createPatient([0], {from: accounts[1]});
		patientInstance.createPatient([0], {from: accounts[1]});
		patientInstance.createPatient([0], {from: accounts[1]});
		patientInstance.listPatient(1, {from: accounts[1]});
		patientInstance.listPatient(2, {from: accounts[1]});
		patientInstance.listPatient(3, {from: accounts[1]});
		patientInstance.listPatient(4, {from: accounts[1]});
		patientInstance.listPatient(5, {from: accounts[1]});
		patientInstance.listPatient(6, {from: accounts[1]});
		patientInstance.listPatient(7, {from: accounts[1]});
		patientInstance.listPatient(8, {from: accounts[1]});
		patientInstance.listPatient(9, {from: accounts[1]});
		patientInstance.listPatient(10, {from: accounts[1]});
		requestInstance.createRequest(99, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], {from: accounts[5]});
		requestInstance.createRequest(99, [1, 2, 3, 4, 5, 6, 7], {from: accounts[5]});
		requestInstance.createRequest(99, [2, 3, 5, 6, 9], {from: accounts[5]});
		requestInstance.createRequest(99, [3, 4, 5], {from: accounts[5]});
		requestInstance.createRequest(99, [4], {from: accounts[5]});
		requestInstance.processRequest(1, 1, {from: accounts[1]});
		requestInstance.processRequest(2, 2, {from: accounts[1]});
		requestInstance.processRequest(3, 3, {from: accounts[1]});
		requestInstance.processRequest(4, 4, {from: accounts[1]});
		requestInstance.processRequest(5, 5, {from: accounts[1]});
		patientInstance.resolvePatient(1, {from: accounts[5]});
		patientInstance.resolvePatient(2, {from: accounts[5]});
		patientInstance.resolvePatient(3, {from: accounts[5]});
		patientInstance.resolvePatient(4, {from: accounts[5]});
		patientInstance.resolvePatient(5, {from: accounts[5]});
    })
};
