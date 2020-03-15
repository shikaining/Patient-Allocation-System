/*
Author		: Cyrus Lee
Matric. No.	: A0168385N
Title		: Group02 Project - Patient
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
	
	event List(uint patientID, address lister);
	
	constructor(address[] memory _powerUsers) ERC721Full("Patient", "PAT") public {
		owner = msg.sender;
		patientCount = 0;
		totalPatients = 0;	
		
		for (uint i = 0; i < _powerUsers.length; i++) {
			powerUsers[_powerUsers[i]] = true;
		}
	}
	
	// Create and register a patient in the patient pool
	function listPatient(string memory name, string memory contactNum, 
						 uint[] memory possessedIndications) 
	public onlyPowerAndUp 
	returns (uint) {
		// Create patient
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
		
		// Emit List event
		emit List(patientCount, msg.sender);
		
		return patientCount++;
	}
	
	// Return all credentials of a patient
	function getPatient(uint patientID) 
	public onlyPowerAndUp
	view returns (string memory, string memory, uint[] memory, address, bool) {
		return (patients[patientID].name, patients[patientID].contactNum,
			    patients[patientID].possessedIndications, patients[patientID].owner,
			    patients[patientID].resolved);
	}
}