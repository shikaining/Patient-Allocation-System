const Patient = artifacts.require("Patient");

module.exports = function(deployer, network, accounts) {
	const owner = accounts[0];
	const powerUsers = [accounts[1], accounts[2]];
	const adminUsers = [accounts[3], accounts[4]];
	let patientInstance;
	
	return deployer
    .then(() => {
        return deployer.deploy(Patient, powerUsers, adminUsers, {from: owner});
    }).then((inst) => {
        patientInstance = inst;
        console.log("Patient Contract Deployed @ Address : " + patientInstance.address)
        //return deployer.deploy(ERC20, {from: owner});
    })/*.then((_inst) => {
        tokenInstance = _inst;
        return deployer.deploy(CollectibleMarketPlace,
                              patientInstance.address,
                              tokenInstance.address,
                              100,
                              {from: platform});
    });*/
};
