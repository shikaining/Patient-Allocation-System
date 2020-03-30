/*
Author		: Cyrus Lee
Matric. No.	: A0168385N
Title		: Group02 Project - Test Sequence v3
*/

const Patient = artifacts.require("Patient");

contract("Patient", accounts => {
	
	// The contract
	let patient;
	
	// == ACCOUNTS ==
	// Contract Owner
	const owner = accounts[0];
	
	// Power Users
	const powerUser1 = accounts[1];
	const powerUser2 = accounts[2];
	
	// Admin Users
	const adminUser1 = accounts[3];
	const adminUser2 = accounts[4];
	
	// Students
	const student1 = accounts[5];
	const student2 = accounts[6];

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
	
	it("Owner of Patient contract is correct", () =>
		patient.getOwner.call()
		.then((rsl) => {
			assert.equal(rsl, owner, "Contract owner is incorrect");
		})
	);
	
	it("Patient 1 is created", () =>
		patient.createPatient.call('Kai Ning', '999', [1, 2], {from: powerUser1})
		.then((patientID) => {
			// Check for returned patient ID
			assert.equal(patientID.toNumber(), 1, "Patient 1 not created successfully");
			patient1 = patientID.toNumber();
		}).then(() => {
			patient.createPatient('Kai Ning', '999', [1, 2], {from: powerUser1});
		})
	);
	
	it("Patient 1 is registered into patient pool", () =>
		patient.listPatient(patient1, {from: powerUser2})
		.then((evt) => {
			// Check for List event
			assert.equal(evt.logs[0].event, 'List', "Patient 1 not listed successfully");
		})
	);
	
	it("Patient 1 records are accurate", () =>
		patient.getPatient.call(patient1, {from: adminUser1})
		.then((rsl) => {
			// Check for all Patient 1 credentials
			assert.equal(rsl[0], 'Kai Ning', "Patient 1's name incorrect");
			assert.equal(rsl[1], '999', "Patient 1's contact number incorrect");
			
			let indications = [1, 2];
			for (let i = 0; i < rsl[2].length; i++) {
				assert.equal(rsl[2][i], indications[i], "Patient 1's indications incorrect");
			}
			
			assert.equal(rsl[3], 0, "Patient 1's dentist incorrect");
			assert.equal(rsl[4], false, "Patient 1's resolution incorrect");
		})
	);
	
	it("Patient 1 is unregistered from patient pool", () =>
		patient.unlistPatient(patient1, {from: powerUser1})
		.then((evt) => {
			// Check for Unlist event
			assert.equal(evt.logs[0].event, 'Unlist', "Patient 1 not unlisted successfully");
		})
	);
	
	it("Patient 1 is allocated to Student 1", () =>
		patient.listPatient(patient1, {from: powerUser2})
		.then(() => {
			return patient.allocatePatient(patient1, student1);
		}).then((evt) => {
			// Check for Unlist event
			assert.equal(evt.logs[1].event, 'Allocate', "Patient 1 not allocated successfully");
		})
	);
	
	it("Patient 1 allocated dentist is accurate", () =>
		patient.ownerOf(patient1)
		.then((rsl) => {
			// Check for new patient owner
			assert.equal(rsl, student1, "Patient 1's allocated dentist incorrect");
		}).then(() => {
			return patient.getPatient.call(patient1, {from: powerUser1});
		}).then((rsl) => {
			// Check for Patient 1 owner using local function
			assert.equal(rsl[3], student1, "Patient 1's allocated dentist incorrect");
		})
	);
	
	it("Student 1 transferred patient to Student 2", () =>
		patient.studentTransfer(patient1, student2, {from: student1})
		.then((evt) => {
			assert.equal(evt.logs[1].event, 'Transfer', "Student 1 failed to transfer patient");
		})
	);
	
	it("Patient 1 dentist updated", () =>
		patient.ownerOf(patient1)
		.then((rsl) => {
			// Check for new patient owner
			assert.equal(rsl, student2, "Patient 1's dentist not updated");
		}).then(() => {
			return patient.getPatient.call(patient1, {from: powerUser2});
		}).then((rsl) => {
			// Check for Patient 1 owner using local function
			assert.equal(rsl[3], student2, "Patient 1's dentist not updated");
		})
	);
	
	it("Total number of patients correct", () =>
		patient.getTotalPatients.call()
		.then((rsl) => {
			assert.equal(rsl.toNumber(), 1, "Total number of patients incorrect");
		})
	);
	
	/*
	it("Initiating indication consolidation", () =>
		patient.getIndications.call()
		.then((rsl) => {
			console.log(rsl);
		})
	);
	*/
});
