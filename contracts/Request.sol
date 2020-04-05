/*
Author		: Cyrus Lee
Matric. No.	: A0168385N
Title		: Group02 Project - Request v1
*/

pragma solidity ^0.5.0;

import "./Patient.sol";

contract Request {
	
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
	
	// =================

	// == ROLES ==
	
	Patient patientContract;
	address owner = msg.sender;
	mapping(address => bool) private powerUsers;
	mapping(address => bool) private adminUsers;
	
	// ===========
	
	// == REQUESTS == 
	
	mapping(uint => _Request) private requests;
	
	struct _Request {
		address owner;
		uint requestID;
		uint allocatedPatientID;
		uint score;
		uint[] indications;
		bool resolved;
	}
	
	// ==============
	
	// == COUNTERS ==
	
	uint requestCount;
	uint totalRequests;
	
	// ==============
		
	// == MODIFIERS ==
	
	modifier matchingIndication(uint requestID, uint patientID) {
		for (uint i = 0; i < patientContract.getIndications(patientID).length; i++) {
			require(patientContract.getIndications(patientID)[i] == requests[requestID].indications[i]);
		}
		_;
	}
	
	modifier onlyPowerAndUp() {
		require(powerUsers[msg.sender] == true || 
				msg.sender == owner);
		_;
	}
	
	modifier onlyRequestOwnerAndUp(uint requestID) {
		require(requests[requestID].owner == msg.sender ||
				adminUsers[msg.sender] == true || 
				powerUsers[msg.sender] == true || 
				msg.sender == owner);
		_;
	}
	
	modifier unresolved(uint requestID) {
		require(requests[requestID].resolved == false);
		_;
	}
	
	// ===============
	
	// == EVENTS ==
	
	event Update(uint requestID, address student);
	event Process(uint requestID, uint patientID);
	
	// ============
	
	// == CONSTRUCTOR ==
	
	constructor(address[] memory _powerUsers, address[] memory _adminUsers, 
				Patient _patientContract) 
	public {
		requestCount = 1;
		totalRequests = 0;	
		
		for (uint i = 0; i < _powerUsers.length; i++) {
			powerUsers[_powerUsers[i]] = true;
		}
		
		for (uint i = 0; i < _adminUsers.length; i++) {
			adminUsers[_adminUsers[i]] = true;
		}
		
		patientContract = _patientContract;
	}
	
	// =================
	
	// == FUNCTIONS ==
	
	function createRequest(uint score, uint[] memory indications) 
	public 
	returns (uint) {
		// Create request
		_Request memory _request = _Request(
			msg.sender, 
			requestCount, 
			0, 
			score,
			indications,
			false
		);	   
		
		// Allocate request ID to request
		requests[requestCount] = _request;
				
		totalRequests++;
		
		return requestCount++;
	}
	
	function processRequest(uint requestID, uint patientID) 
	public onlyPowerAndUp unresolved(requestID) matchingIndication(requestID, patientID) {
		requests[requestID].allocatedPatientID = patientID;
		patientContract.allocatePatient(patientID, requests[requestID].owner);
		requests[requestID].resolved = true;
		
		emit Process(requestID, patientID);
	}
	
	// Update the information of a request
	function updateRequest(uint requestID, uint patientID, uint score,
						   uint[] memory indications, bool resolution) 
	public onlyRequestOwnerAndUp(requestID) unresolved(requestID) {
		// Update request
		requests[requestID].allocatedPatientID = patientID;
		requests[requestID].score = score;
		requests[requestID].indications = indications;
		requests[requestID].resolved = resolution;

		emit Update(requestID, msg.sender);
	}
	
	// ===============
	
	// == GETTERS ==
	
	// Return contract owner
	function getOwner() 
	public view returns (address) {
		return owner;
	}
	
	// Return all information of a request
	function getRequest(uint requestID) 
	public onlyRequestOwnerAndUp(requestID)
	view returns (address, uint, uint, uint, uint[] memory, bool) {
		return (requests[requestID].owner, requests[requestID].requestID,
			    requests[requestID].allocatedPatientID, requests[requestID].score,
			    requests[requestID].indications, requests[requestID].resolved);
	}
	
	// Return total number of requests
	function getTotalRequests() 
	public view returns (uint) {
		return totalRequests;
	}
	
	// =============
}