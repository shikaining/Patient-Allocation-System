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
let powerUser3;

// Admin Users
let adminUser1;
let adminUser2;
let adminUser3;

// Students
let student1;
let student2;

// == PATIENTS ==
let patient1; // 'Kai Ning', '999', [1, 2]
let patient2; // 'Jason Teo', '919', [3, 4]

// == REQUESTS ==
let request1; // 99, [3, 4, 5], student2 owner
let request2; // 98, [6], student1 owner
	
contract("Patient [Workflow Test]", accounts => {
		
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
			console.log("\n>> TEST BEGIN <<");
			console.log("\nContract Deployment");
			console.log("-------------------");
			
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
	
	it("Power User 3 is created", () =>
		patient.createPowerUser(accounts[7], {from: owner})
		.then((evt) => {
			console.log("Administrative Functions");
			console.log("------------------------");
			
			// Check for CreatePowerUser event
			assert.equal(evt.logs[1].event, 'CreatePowerUser', "Power User 3 not created successfully");
			powerUser3 = accounts[7];
		})
	);
	
	it("Power User 3 is verified", () =>
		patient.getPowerUser.call(powerUser3, {from: owner})
		.then((rsl) => {
			// Check if Power User 3 is registered
			assert.equal(rsl, true, "Power User 3 not registered successfully");
		})
	);
	
	it("Admin User 3 is created", () =>
		patient.createAdminUser(accounts[8], {from: owner})
		.then((evt) => {
			// Check for CreatePowerUser event
			assert.equal(evt.logs[1].event, 'CreateAdminUser', "Admin User 3 not created successfully");
			adminUser3 = accounts[8];
		})
	);
	
	it("Admin User 3 is verified", () =>
		patient.getAdminUser.call(adminUser3, {from: owner})
		.then((rsl) => {
			// Check if Admin User 3 is registered
			assert.equal(rsl, true, "Admin User 3 not registered successfully");
		})
	);
	
	it("Patient 1 is created", () =>
		patient.createPatient.call('Kai Ning', '999', [1, 2], {from: powerUser1})
		.then((patientID) => {
			console.log("Patient Creation");
			console.log("----------------");
			
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
			console.log("Patient Registration");
			console.log("--------------------");
			
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
			console.log("Patient Allocation");
			console.log("------------------");
			
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
			console.log("Patient Transfer");
			console.log("----------------");
			
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
			console.log("Patient Resolution");
			console.log("------------------");
			
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
	
	it("Patient 1 information is updated", () =>
		patient.updatePatient(patient1, "Kai Ningg", "998", [1, 2, 3], 
							  student2, false, {from: powerUser1})
		.then((evt) => {
			console.log("Patient Update");
			console.log("--------------");
			
			// Check for update event
			assert.equal(evt.logs[0].event, 'Update', "Patient 1 failed to be updated");
		})
	);
	
	it("Patient 1 updated records are accurate", () =>
		patient.getPatient.call(patient1, {from: adminUser1})
		.then((rsl) => {
			// Check for all Patient 1 credentials
			assert.equal(rsl[0], 'Kai Ningg', "Patient 1's name incorrect");
			assert.equal(rsl[1], '998', "Patient 1's contact number incorrect");
			
			let indications = [1, 2, 3];
			for (let i = 0; i < rsl[2].length; i++) {
				assert.equal(rsl[2][i], indications[i], "Patient 1's indications incorrect");
			}
			
			assert.equal(rsl[3], student2, "Patient 1's dentist incorrect");
			assert.equal(rsl[4], false, "Patient 1's resolution incorrect");
		})
	);
	
	it("Total number of patients correct", () =>
		patient.getTotalPatients.call()
		.then((rsl) => {
			// Check if total patients is updated correctly
			assert.equal(rsl.toNumber(), 1, "Total number of patients incorrect");
		})
	);
});

contract("Patient [Failure Tests]", accounts => {
	
	let tempPatient;
	
	it("Power User unable to create power user", async() =>		
		{
			console.log("\n>> TEST BEGIN <<");
			console.log("\nAdministrative Functions");
			console.log("------------------------");
			
			let err = null;
		
			try {
				await patient.createPowerUser.call(accounts[9], {from: powerUser1});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Power user creation should have failed");
		}
	);
	
	it("Admin User unable to create power user", async() =>		
		{
			let err = null;
		
			try {
				await patient.createPowerUser.call(accounts[9], {from: adminUser1});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Power user creation should have failed");
		}
	);
	
	it("Student unable to create power user", async() =>		
		{
			let err = null;
		
			try {
				await patient.createPowerUser.call(accounts[9], {from: student1});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Power user creation should have failed");
		}
	);
	
	it("Admin User unable to create admin user", async() =>		
		{
			let err = null;
		
			try {
				await patient.createAdminUser.call(accounts[9], {from: adminUser2});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Admin user creation should have failed");
		}
	);
	
	it("Student unable to create admin user", async() =>		
		{
			let err = null;
		
			try {
				await patient.createAdminUser.call(accounts[9], {from: student2});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Admin user creation should have failed");
		}
	);
	
	it("Admin User unable to create patients", async() =>		
		{
			console.log("Patient Registration");
			console.log("--------------------");
			
			let err = null;
		
			try {
				await patient.createPatient.call('Kai Ning', '999', [1, 2], {from: adminUser1});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient creation should have failed");
		}
	);
	
	it("Student unable to create patients", async() =>		
		{
			let err = null;
		
			try {
				await patient.createPatient.call('Kai Ning', '999', [1, 2], {from: student1});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient creation should have failed");
		}
	);
	
	it("Admin User unable to register patients into patient pool", async() =>		
		{
			console.log("Patient Registration");
			console.log("--------------------");
			
			tempPatient = await patient.createPatient.call('Temp', '911', [2], 
															  {from: powerUser2});
			await patient.createPatient('Temp', '911', [2], {from: powerUser2});
						
			let err = null;
		
			try {
				await patient.listPatient.call(tempPatient.toNumber(), {from: adminUser2});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient registration should have failed");
		}
	);
	
	it("Student unable to register patients into patient pool", async() =>		
		{
			let err = null;
		
			try {
				await patient.listPatient.call(tempPatient.toNumber(), {from: student1});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient registration should have failed");
		}
	);
	
	it("Unable to list currently-listed patients", async() =>		
		{
			await patient.listPatient(tempPatient.toNumber(), {from: powerUser2});
			
			let err = null;
		
			try {
				await patient.listPatient.call(tempPatient.toNumber(), {from: powerUser2});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient registration should have failed");
		}
	);
	
	it("Admin User unable to unregister patients from patient pool", async() =>		
		{
			let err = null;
		
			try {
				await patient.unlistPatient.call(tempPatient.toNumber(), {from: adminUser1});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient unregistration should have failed");
		}
	);
	
	it("Student unable to unregister patients from patient pool", async() =>		
		{
			let err = null;
		
			try {
				await patient.unlistPatient.call(tempPatient.toNumber(), {from: student2});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient unregistration should have failed");
		}
	);
	
	it("Unable to unlist currently-unlisted patients", async() =>		
		{
			await patient.unlistPatient(tempPatient.toNumber(), {from: powerUser1});
			
			let err = null;
		
			try {
				await patient.unlistPatient.call(tempPatient.toNumber(), {from: powerUser1});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient unregistration should have failed");
		}
	);
	
	it("Unable to list resolved patients", async() =>		
		{
			await patient.listPatient(tempPatient.toNumber(), {from: powerUser2});
			await patient.allocatePatient(tempPatient.toNumber(), student2, 
										 {from: powerUser2});
			await patient.resolvePatient(tempPatient.toNumber(), {from: student2});
										 
			let err = null;
		
			try {
				await patient.listPatient.call(tempPatient.toNumber(), {from: powerUser2});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient registration should have failed");
		}
	);
	
	it("Unable to allocate unlisted patients", async() =>		
		{
			console.log("Patient Allocation");
			console.log("------------------");
			
			tempPatient = await patient.createPatient.call('Temp2', '912', [2], 
														  {from: powerUser1});
			await patient.createPatient('Temp2', '912', [2], {from: powerUser1});
						
			let err = null;
		
			try {
				await patient.allocatePatient.call(tempPatient.toNumber(), student1, 
												  {from: powerUser1});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient allocation should have failed");
		}
	);
	
	it("Admin User unable to allocate patients", async() =>		
		{
			await patient.listPatient(tempPatient.toNumber(), {from: powerUser2});
						
			let err = null;
		
			try {
				await patient.allocatePatient.call(tempPatient.toNumber(), student2, 
												  {from: adminUser2});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient allocation should have failed");
		}
	);
	
	it("Normal User unable to allocate patients", async() =>		
		{		
			let err = null;
		
			try {
				await patient.allocatePatient.call(tempPatient.toNumber(), student1, 
												  {from: student1});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient allocation should have failed");
		}
	);
	
	it("Owner of contract unable to transfer patients", async() =>		
		{
			console.log("Patient Transfer");
			console.log("----------------");
			
			await patient.allocatePatient(tempPatient.toNumber(), student1,
										 {from: powerUser2});
		
			let err = null;
		
			try {
				await patient.studentTransfer.call(tempPatient.toNumber(), student2,
												  {from: owner});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient transfer should have failed");
		}
	);
	
	it("Power User unable to transfer patients", async() =>		
		{
			let err = null;
		
			try {
				await patient.studentTransfer.call(tempPatient.toNumber(), student2,
												  {from: powerUser1});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient transfer should have failed");
		}
	);
	
	it("Admin User unable to transfer patients", async() =>		
		{
			let err = null;
		
			try {
				await patient.studentTransfer.call(tempPatient.toNumber(), student2,
												  {from: adminUser2});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient transfer should have failed");
		}
	);
	
	it("Student unable to transfer un-owned patients", async() =>		
		{
			let err = null;
		
			try {
				await patient.studentTransfer.call(tempPatient.toNumber(), student2,
												  {from: adminUser2});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient transfer should have failed");
		}
	);
	
	it("Unable to transfer resolved patients", async() =>		
		{
			await patient.resolvePatient(tempPatient.toNumber(), {from: student1});
												  
			let err = null;
		
			try {
				await patient.studentTransfer.call(tempPatient.toNumber(), student2,
												  {from: student1});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient transfer should have failed");
		}
	);
	
	it("Owner of contract unable to resolve patients", async() =>		
		{
			console.log("Patient Resolution");
			console.log("------------------");
			
			tempPatient = await patient.createPatient.call('Temp3', '913', [2], 
														  {from: powerUser1});
			await patient.createPatient('Temp3', '913', [2], {from: powerUser1});
			await patient.listPatient(tempPatient.toNumber(), {from: powerUser1});
			await patient.allocatePatient(tempPatient.toNumber(), student1, 
										 {from: powerUser1});
											  
			let err = null;
		
			try {
				await patient.resolvePatient.call(tempPatient.toNumber(),
												 {from: owner});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient allocation should have failed");
		}
	);
	
	it("Power User unable to resolve patients", async() =>		
		{
			let err = null;
		
			try {
				await patient.resolvePatient.call(tempPatient.toNumber(),
												 {from: powerUser2});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient allocation should have failed");
		}
	);
	
	it("Admin User unable to resolve patients", async() =>		
		{
			let err = null;
		
			try {
				await patient.resolvePatient.call(tempPatient.toNumber(),
												 {from: adminUser1});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient allocation should have failed");
		}
	);
	
	it("Student unable to resolve un-owned patients", async() =>		
		{
			let err = null;
		
			try {
				await patient.resolvePatient.call(tempPatient.toNumber(),
												 {from: student2});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient allocation should have failed");
		}
	);
	
	it("Unable to resolve resolved patients", async() =>		
		{
			await patient.resolvePatient(tempPatient.toNumber(),
										{from: student1});
			let err = null;
		
			try {
				await patient.resolvePatient.call(tempPatient.toNumber(),
												 {from: student1});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient allocation should have failed");
		}
	);
	
	it("Admin User unable to update patient information", async() =>		
		{
			console.log("Patient Update");
			console.log("--------------");
			
			tempPatient = await patient.createPatient.call('Temp4', '914', [2], 
														  {from: powerUser2});
			await patient.createPatient('Temp4', '914', [2], {from: powerUser2});

			let err = null;
		
			try {
				await patient.updatePatient.call(tempPatient.toNumber(), 'Temp5',
												 '915', [3], owner, false,
												{from: adminUser2});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient information update should have failed");
		}
	);
	
	it("Student unable to update patient information", async() =>		
		{
			let err = null;
		
			try {
				await patient.updatePatient.call(tempPatient.toNumber(), 'Temp5',
												 '915', [3], owner, false,
												{from: student1});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Patient information update should have failed");
		}
	);
});

contract("Request [Workflow Test]", accounts => {
	
	it("Request contract is deployed", () =>
		Request.deployed()
		.then((inst) => {
			console.log("\n>> TEST BEGIN <<");
			console.log("\nContract Deployment");
			console.log("-------------------");
			
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
	
	it("Power User 3 is created", () =>
		request.createPowerUser(accounts[7], {from: owner})
		.then((evt) => {
			console.log("Administrative Functions");
			console.log("------------------------");
			
			// Check for CreatePowerUser event
			assert.equal(evt.logs[0].event, 'CreatePowerUser', "Power User 3 not created successfully");
			powerUser3 = accounts[7];
		})
	);
	
	it("Power User 3 is verified", () =>
		request.getPowerUser.call(powerUser3, {from: owner})
		.then((rsl) => {
			// Check if Power User 3 is registered
			assert.equal(rsl, true, "Power User 3 not registered successfully");
		})
	);
	
	it("Admin User 3 is created", () =>
		request.createAdminUser(accounts[8], {from: owner})
		.then((evt) => {
			// Check for CreatePowerUser event
			assert.equal(evt.logs[0].event, 'CreateAdminUser', "Admin User 3 not created successfully");
			adminUser3 = accounts[8];
		})
	);
	
	it("Admin User 3 is verified", () =>
		request.getAdminUser.call(adminUser3, {from: owner})
		.then((rsl) => {
			// Check if Admin User 3 is registered
			assert.equal(rsl, true, "Admin User 3 not registered successfully");
		})
	);
	
	it("Request 1 is created", () =>
		request.createRequest.call(99, [3, 4, 5], {from: powerUser1})
		.then((requestID) => {
			console.log("Request Creation");
			console.log("----------------");
			
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

	it("Patient 2 is created", () =>
		patient.createPatient.call('Jason Teo', '919', [3, 4, 5], {from: powerUser1})
		.then((patientID) => {
			console.log("Request Processing");
			console.log("------------------");
			
			// Check for returned patient ID
			assert.equal(patientID.toNumber(), 1, "Patient 2 not created successfully");
			patient2 = patientID.toNumber();
		}).then(() => {
			// Create Patient 2
			patient.createPatient('Jason Teo', '919', [3, 4, 5], {from: powerUser2});
		})
	);
	
	it("Patient 2 records are accurate", () =>
		patient.getPatient.call(patient2, {from: adminUser1})
		.then((rsl) => {
			// Check for all Patient 1 credentials
			assert.equal(rsl[0], 'Jason Teo', "Patient 1's name incorrect");
			assert.equal(rsl[1], '919', "Patient 1's contact number incorrect");
			
			let indications = [3, 4, 5];
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
			console.log("Request Resolution");
			console.log("------------------");
			
			// Check resolution
			assert.equal(rsl[5], true, "Request 1's resolution incorrect");
		})
	);
	
	it("Request 2 is created", () =>
		request.createRequest.call(98, [6], {from: student2})
		.then((requestID) => {
			console.log("Request Withdrawal");
			console.log("------------------");
			
			// Check for returned request ID
			assert.equal(requestID.toNumber(), 2, "Request 2 not created successfully");
			request2 = requestID.toNumber();
		}).then(() => {
			// Create Request 2
			request.createRequest(98, [6], {from: student1});
		})
	);
	
	it("Request 2 is withdrawn", () =>
		request.withdrawRequest(request2, {from: student1})
		.then((evt) => {
			// Check for withdrawal event
			assert.equal(evt.logs[0].event, 'Withdraw', "Patient 2 not withdrawn successfully");
		})
	);
	
	it("Request 2 is resolved via withdrawal", () =>
		request.getRequest.call(request2, {from: powerUser1})
		.then((rsl) => {
			// Check resolution
			assert.equal(rsl[5], true, "Request 2's resolution incorrect");
		})
	);
		
	it("Total number of requests correct", () =>
		request.getTotalRequests.call()
		.then((rsl) => {
			// Check if total requests is updated correctly
			assert.equal(rsl.toNumber(), 2, "Total number of requests incorrect");
		})
	);
});

contract("Request [Failure Tests]", accounts => {
	
	let tempPatient;
	let tempRequest1;
	let tempRequest2;
	
	it("Power User unable to create power user", async() =>		
		{
			console.log("\n>> TEST BEGIN <<");
			console.log("\nAdministrative Functions");
			console.log("------------------------");
			
			let err = null;
		
			try {
				await request.createPowerUser.call(accounts[9], {from: powerUser1});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Power user creation should have failed");
		}
	);
	
	it("Admin User unable to create power user", async() =>		
		{
			let err = null;
		
			try {
				await request.createPowerUser.call(accounts[9], {from: adminUser1});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Power user creation should have failed");
		}
	);
	
	it("Student unable to create power user", async() =>		
		{
			let err = null;
		
			try {
				await request.createPowerUser.call(accounts[9], {from: student1});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Power user creation should have failed");
		}
	);
	
	it("Admin User unable to create admin user", async() =>		
		{
			let err = null;
		
			try {
				await request.createAdminUser.call(accounts[9], {from: adminUser2});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Admin user creation should have failed");
		}
	);
	
	it("Student unable to create admin user", async() =>		
		{
			let err = null;
		
			try {
				await request.createAdminUser.call(accounts[9], {from: student2});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Admin user creation should have failed");
		}
	);

	it("Admin User unable to process requests", async() =>		
		{
			console.log("Request Processing");
			console.log("------------------");

			tempPatient = await patient.createPatient.call('Temp6', '916', [2], 
														  {from: powerUser1});
			await patient.createPatient('Temp6', '916', [2], {from: powerUser1});
			await patient.listPatient(tempPatient.toNumber(), {from: powerUser1});
			
			tempRequest1 = await request.createRequest.call(22, [2], {from: student1});
			await request.createRequest(22, [2], {from: student1});
			tempRequest2 = await request.createRequest.call(22, [2, 3], {from: student1});
			await request.createRequest(22, [2, 3], {from: student1});

			let err = null;
		
			try {
				await request.processRequest.call(tempRequest1.toNumber(), 
												  tempPatient.toNumber(), 
												 {from: adminUser1});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Request processing should have failed");
		}
	);
	
	it("Student unable to process requests", async() =>		
		{
			let err = null;
		
			try {
				await request.processRequest.call(tempRequest1.toNumber(), 
												  tempPatient.toNumber(), 
												 {from: student2});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Request processing should have failed");
		}
	);
	
	it("Unable to process request with unmatching indications", async() =>		
		{
			let err = null;
		
			try {
				await request.processRequest.call(tempRequest2.toNumber(), 
												  tempPatient.toNumber(), 
												 {from: powerUser1});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Request processing should have failed");
		}
	);
	
	it("Unable to process resolved requests", async() =>		
		{
			await request.processRequest(tempRequest1.toNumber(), 
										 tempPatient.toNumber(), 
										{from: powerUser2});
												 
			let err = null;
		
			try {
				await request.processRequest.call(tempRequest1.toNumber(), 
												  tempPatient.toNumber(), 
												 {from: powerUser2});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Request processing should have failed");
		}
	);
	
	it("Student unable to withdraw un-owned requests", async() =>		
		{
			console.log("Request Withdrawal");
			console.log("------------------");
			
			let err = null;
		
			try {
				await request.withdrawRequest.call(tempRequest2.toNumber(), 
												  {from: student2});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Request withdrawal should have failed");
		}
	);
	
	it("Student unable to withdraw resolved requests", async() =>		
		{
			await request.withdrawRequest(tempRequest2.toNumber(), 
										 {from: student1});
			
			let err = null;
		
			try {
				await request.withdrawRequest.call(tempRequest2.toNumber(), 
												  {from: student1});
			}
			catch (error) {
				err = error;
			}
						
			assert.ok(err instanceof Error
					 , "Request withdrawal should have failed");
		}
	);
	
});
