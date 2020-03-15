const Patient = artifacts.require("Patient");

module.exports = function(deployer, network, accounts) {
	const owner = accounts[0];
	const powerUsers = [accounts[1], accounts[2]];
	let patientInstance;
	
	return deployer
    .then(() => {
        return deployer.deploy(Patient, powerUsers, {from: owner});
    }).then((inst) => {
        patientInstance = inst;
    })
};
