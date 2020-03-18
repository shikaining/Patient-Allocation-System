/*
Author		: Cyrus Lee
Matric. No.	: A0168385N
Title		: Group02 Project - Patient v2
*/

pragma solidity ^0.5.0;

import "./ERC721Full.sol";

contract Patient is ERC721Full {
	
	// == INDICATIONS ==
	enum Indications { 
		CDExamCase,
		DentalPublicHealth,
		Endodontics,
		FixedProsthodontics,
		OperativeDentistry,
		OralSurgery,
		Orthodontics,
		Pedodontics,
		Periodontics,
		RemovableProsthodontics
	}

	// == ROLES ==
	address owner = msg.sender;
	mapping(address => bool) private powerUsers;
	mapping(address => bool) private adminUsers;
	
	// == PATIENTS == 
	mapping(uint => _Patient) private patients;
	mapping(uint => bool) private patientPool;
	
	struct _Patient {
		uint patientID;
		string name;
		string contactNum;
		uint[] possessedIndications;
		address owner;
		bool resolved;
	}
	
	// == COUNTERS ==
	uint patientCount;
	uint patientIndexCount;
	uint totalPatients;
	
	modifier onlyOwner() {
		require(msg.sender == owner);
		_;
	}
	
	modifier onlyPower() {
		require(powerUsers[msg.sender] == true);
		_;
	}
	
	modifier onlyPowerAndUp() {
		require(powerUsers[msg.sender] == true || msg.sender == owner);
		_;
	}
	
	modifier patientListed(uint patientID) {
		require(patientPool[patientID] == true);
		_;
	}
	
	modifier patientUnlisted(uint patientID) {
		require(patientPool[patientID] == false);
		_;
	}
	
	event List(uint patientID, address lister);
	event Unlist(uint patientID, address unlister);
	event Allocate(uint patientID, address from, address to, address allocater);
	
	constructor(address[] memory _powerUsers) ERC721Full("Patient", "PAT") public {
		patientCount = 1;
		totalPatients = 0;	
		
		for (uint i = 0; i < _powerUsers.length; i++) {
			powerUsers[_powerUsers[i]] = true;
			setApprovalForAll(_powerUsers[i], true);
		}
	}
	
	//Create patient
	function createPatient(string memory name, string memory contactNum, 
						   uint[] memory possessedIndications) 
	public onlyPowerAndUp 
	returns (uint) {
		// Create patient if patient does not exist
		_Patient memory _patient = _Patient(
			patientCount, 
			name, 
			contactNum, 
			possessedIndications,
			address(0),
			false
		);	   
		
		// Allocate patient ID to patient
		patients[patientCount] = _patient;
		// Tag patient to ERC721 token
		_mint(address(this), patientCount);
		
		return patientCount++;
	}
	
	// Register a patient in the patient pool
	function listPatient(uint patientID) 
	public onlyPowerAndUp patientUnlisted(patientID) {		
		// Register patient ID in patient pool
		patientPool[patientID] = true;
		
		// Emit List event
		emit List(patientCount, msg.sender);
	}
	
	// Unlist a patient in the patient pool
	function unlistPatient(uint patientID) 
	public onlyPowerAndUp patientListed(patientID) {		
		// Remove patient from patient pool
		delete patientPool[patientID];
		
		// Emit Unlist event
		emit Unlist(patientCount, msg.sender);
	}
	
	// Allocate a patient to a student
	function allocatePatient(uint patientID, address student) 
	public onlyPowerAndUp patientListed(patientID) {		
		// Allocate patient to student
		patients[patientID].owner = student;
		transferFrom(address(this), student, patientID);
		
		// Remove patient from patient pool
		delete patientPool[patientID];
		
		// Emit Allocate event
		emit Allocate(patientID, address(this), student, msg.sender);
	}
	
	// Return all credentials of a patient
	function getPatient(uint patientID) 
	public onlyPowerAndUp
	view returns (string memory, string memory, uint[] memory, address, bool) {
		return (patients[patientID].name, patients[patientID].contactNum,
			    patients[patientID].possessedIndications, patients[patientID].owner,
			    patients[patientID].resolved);
	}
	
	/*
	getowner
	gettotalpatients
	studenttransfer
	getindicationcount
	*/
}