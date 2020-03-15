/*
Author		: Cyrus Lee
Matric. No.	: A0168385N
Title		: Group02 Project - Test Sequence
*/

const Patient = artifacts.require("Patient");

contract("Patient", accounts => {
	
	// The contract
	let patient;
	
	// == ACCOUNTS ==
	// Loyalty contract owner
	const owner = accounts[0];
	
	// Shop owners
	const powerUser1 = accounts[1];
	const powerUser2 = accounts[2];

	// == PATIENTS ==
	let patient1;
	
	it("Patient contract is deployed", () =>
		Patient.deployed()
		.then((_inst) => {
			patient = _inst;
			// Check for contract deployment
			assert.ok(patient, "Contract not deployed successfully");
		})
	);

	it("Patient 0 is registered", () =>
		patient.listPatient.call('Kai Ning', '999', [1, 2], {from: accounts[1]})
		.then((patientID) => {
			// Check for returned patient ID
			assert.equal(patientID.toNumber(), 0, "Patient 0 not created successfully");
			patient1 = patientID.toNumber();
		}).then(() => {
			return patient.listPatient('Kai Ning', '999', [1, 2], {from: owner})
		}).then((evt) => {
			// Check for List event
			assert.equal(evt.logs[1].event, 'List', "Patient 0 not listed successfully");
		})
	);
	
	it("Patient 0 records accurate", () =>
		patient.getPatient.call(patient1, {from: accounts[2]})
		.then((rsl) => {
			// Check for all Patient 0 credentials
			assert.equal(rsl[0], 'Kai Ning', "Patient 0's name incorrect");
			assert.equal(rsl[1], '999', "Patient 0's contact number incorrect");
			
			let indications = [1, 2];
			for (let i = 0; i < rsl[2].length; i++) {
				assert.equal(rsl[2][i], indications[i], "Patient 0's indications incorrect");
			}
			
			assert.equal(rsl[3], 0, "Patient 0's owner incorrect");
			assert.equal(rsl[4], false, "Patient 0's resolution incorrect");
		})
	);
});
