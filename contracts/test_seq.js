/*
Author		: Cyrus Lee
Matric. No.	: A0168385N
Title		: Group02 Project - Test Sequence v3
*/

const Patient = artifacts.require("Patient");
const Request = artifacts.require("Request");

// == CONTRACTS ==
let patient;
let request;

// == ACCOUNTS ==
// Contract Owner
let owner;

// Power Users
let powerUser1;
let powerUser2;

// Admin Users
let adminUser1;
let adminUser2;

// Students
let student1;
let student2;

// == PATIENTS ==
let patient1; // 'Kai Ning', '999', [1, 2]
let patient2; // 'Jason Teo', '919', [3, 4]

// == REQUESTS ==
let request1; // 99, [4, 5, 6]
	
contract("Patient", accounts => {
	
	owner = accounts[0];

	// Power Users
	powerUser1 = accounts[1];
	powerUser2 = accounts[2];

	// Admin Users
	adminUser1 = accounts[3];
	adminUser2 = accounts[4];

	// Students
	student1 = accounts[5];
	student2 = accounts[6];

	it("Patient contract is deployed", () =>
		Patient.deployed()
		.then((inst) => {
			patient = inst;
			// Check for contract deployment
			assert.ok(patient, "Contract not deployed successfully");
		})
	);
	
	it("Owner of Patient contract is correct", () =>
		patient.getOwner.call()
		.then((rsl) => {
			// Check contract owner
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
			// Create Patient 1
			patient.createPatient('Kai Ning', '999', [1, 2], {from: powerUser1});
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
	
	it("Patient 1 is registered into patient pool", () =>
		patient.listPatient(patient1, {from: powerUser2})
		.then((evt) => {
			// Check for List event
			assert.equal(evt.logs[0].event, 'List', "Patient 1 not listed successfully");
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
			// Check for transfer event
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
	
	it("Student 2 resolved Patient 1", () =>
		patient.resolvePatient(patient1, {from: student2})
		.then((evt) => {
			// Check for resolution event
			assert.equal(evt.logs[0].event, 'Resolve', "Patient 1 failed to be resolved");
		})
	);
	
	it("Patient 1 resolution is updated", () =>
		patient.getPatient.call(patient1, {from: powerUser1})
		.then((rsl) => {
			// Check if patient is resolved
			assert.equal(rsl[4], true, "Patient 1 not resolved successfully");
		})
	);
	
	it("Total number of patients correct", () =>
		patient.getTotalPatients.call()
		.then((rsl) => {
			// Check if total patients is updated correctly
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

contract("Request", accounts => {
	
	it("Request contract is deployed", () =>
		Request.deployed()
		.then((inst) => {
			request = inst;
			// Check for contract deployment
			assert.ok(request, "Contract not deployed successfully");
		})
	);
	
	it("Owner of Request contract is correct", () =>
		request.getOwner.call()
		.then((rsl) => {
			assert.equal(rsl, owner, "Contract owner is incorrect");
		})
	);
	
	it("Request 1 is created", () =>
		request.createRequest.call(99, [3, 4, 5], {from: powerUser1})
		.then((requestID) => {
			// Check for returned request ID
			assert.equal(requestID.toNumber(), 1, "Request 1 not created successfully");
			request1 = requestID.toNumber();
		}).then(() => {
			// Create Request 1
			request.createRequest(99, [3, 4, 5], {from: student2});
		})
	);
	
	it("Request 1 records are accurate", () =>
		request.getRequest.call(request1, {from: powerUser2})
		.then((rsl) => {
			// Check for all Patient 1 credentials
			assert.equal(rsl[0], student2, "Request 1's owner incorrect");
			assert.equal(rsl[1], request1, "Request 1's ID incorrect");
			assert.equal(rsl[2], 0, "Request 1's default allocated patient ID incorrect");
			assert.equal(rsl[3], 99, "Request 1's score incorrect");
			
			let indications = [3, 4, 5];
			for (let i = 0; i < rsl[4].length; i++) {
				assert.equal(rsl[4][i], indications[i], "Request 1's indications incorrect");
			}

			assert.equal(rsl[5], false, "Request 1's resolution incorrect");
		})
	);
	
	it("Request 1 is updated", () =>
		request.updateRequest(request1, 0, 89, [3, 4], false, {from: powerUser1})
		.then((evt) => {
			// Check for update event
			assert.equal(evt.logs[0].event, 'Update', "Request 1 failed to update successfully");
		})
	);
	
	it("Request 1 records are updated", () =>
		request.getRequest.call(request1, {from: powerUser2})
		.then((rsl) => {
			// Check for all Patient 1 credentials
			assert.equal(rsl[0], student2, "Request 1's owner incorrect");
			assert.equal(rsl[1], request1, "Request 1's ID incorrect");
			assert.equal(rsl[2], 0, "Request 1's default allocated patient ID incorrect");
			assert.equal(rsl[3], 89, "Request 1's score incorrect");
			
			let indications = [3, 4];
			for (let i = 0; i < rsl[4].length; i++) {
				assert.equal(rsl[4][i], indications[i], "Request 1's indications incorrect");
			}

			assert.equal(rsl[5], false, "Request 1's resolution incorrect");
		})
	);
	
	it("Patient 2 is created", () =>
		patient.createPatient.call('Jason Teo', '919', [3, 4], {from: powerUser1})
		.then((patientID) => {
			// Check for returned patient ID
			assert.equal(patientID.toNumber(), 1, "Patient 2 not created successfully");
			patient2 = patientID.toNumber();
		}).then(() => {
			// Create Patient 2
			patient.createPatient('Jason Teo', '919', [3, 4], {from: powerUser2});
		})
	);
	
	it("Patient 2 records are accurate", () =>
		patient.getPatient.call(patient2, {from: adminUser1})
		.then((rsl) => {
			// Check for all Patient 1 credentials
			assert.equal(rsl[0], 'Jason Teo', "Patient 1's name incorrect");
			assert.equal(rsl[1], '919', "Patient 1's contact number incorrect");
			
			let indications = [3, 4];
			for (let i = 0; i < rsl[2].length; i++) {
				assert.equal(rsl[2][i], indications[i], "Patient 1's indications incorrect");
			}
			
			assert.equal(rsl[3], 0, "Patient 1's dentist incorrect");
			assert.equal(rsl[4], false, "Patient 1's resolution incorrect");
		})
	);

	it("Patient 2 is registered into patient pool", () =>
		patient.listPatient(patient2, {from: powerUser2})
		.then((evt) => {
			// Check for List event
			assert.equal(evt.logs[0].event, 'List', "Patient 2 not listed successfully");
		})
	);
	
	it("Patient 2 is processed", () =>
		request.processRequest(request1, patient2, {from: powerUser1})
		.then((evt) => {
			// Check for Process event
			assert.equal(evt.logs[0].event, 'Process', "Patient 2 not processed successfully");
		})
	);
	
	it("Patient 2 allocated dentist is accurate", () =>
		patient.ownerOf(patient2)
		.then((rsl) => {
			// Check for new patient owner
			assert.equal(rsl, student2, "Patient 2's allocated dentist incorrect");
		}).then(() => {
			return patient.getPatient.call(patient1, {from: powerUser1});
		}).then((rsl) => {
			// Check for Patient 2 owner using local function
			assert.equal(rsl[3], student2, "Patient 2's allocated dentist incorrect");
		})
	);
	
	it("Request 1 is resolved", () =>
		request.getRequest.call(request1, {from: powerUser2})
		.then((rsl) => {
			// Check resolution
			assert.equal(rsl[5], true, "Request 1's resolution incorrect");
		})
	);
		
	it("Total number of requests correct", () =>
		request.getTotalRequests.call()
		.then((rsl) => {
			// Check if total patients is updated correctly
			assert.equal(rsl.toNumber(), 1, "Total number of requests incorrect");
		})
	);
});