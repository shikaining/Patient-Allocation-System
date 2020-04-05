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
    })
};
