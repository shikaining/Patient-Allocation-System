/*
Author		: Cyrus Lee
Matric. No.	: A0168385N
Title		: Group02 Project - Patient v3
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
	
	// =================

	// == ROLES ==
	
	address requestAddress;
	address owner = msg.sender;
	mapping(address => bool) private powerUsers;
	mapping(address => bool) private adminUsers;
	
	// ===========
	
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
	
	// ==============
	
	// == COUNTERS ==
	
	uint patientCount;
	uint totalPatients;
	
	// ==============
	
	//uint[] ret;
	
	// == MODIFIERS ==
	
	modifier onlyOwner() {
		require(msg.sender == owner);
		_;
	}
	
	modifier onlyPowerAndUp() {
		require(powerUsers[msg.sender] == true || 
				msg.sender == owner);
		_;
	}
	
	modifier onlyPowerAndUpAndRequest() {
		require(powerUsers[msg.sender] == true || 
				msg.sender == owner ||
				msg.sender == requestAddress);
		_;
	}
	
	modifier onlyAdminAndUp() {
		require(adminUsers[msg.sender] == true || 
				powerUsers[msg.sender] == true || 
				msg.sender == owner);
		_;
	}
	
	modifier onlyStudent(uint patientID) {
		require(ownerOf(patientID) == msg.sender);
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
	
	modifier unresolved(uint patientID) {
		require(patients[patientID].resolved == false);
		_;
	}
	
	// ===============
	
	// == EVENTS ==

	// Administration 
	event CreatePowerUser(address user);
	event CreateAdminUser(address user);

	// Functions
	event Allocate(uint patientID, address from, address to, address allocater);	
	event List(uint patientID, address lister);
	event Resolve(uint patientID, address resolver);
	event Transfer(uint patientID, address from, address to);
	event Update(uint patientID, address updater);
	event Unlist(uint patientID, address unlister);
	
	// ============
	
	// == CONSTRUCTOR ==
	
	constructor(address[] memory _powerUsers, address[] memory _adminUsers) 
	ERC721Full("Patient", "PAT") public {
		patientCount = 1;
		totalPatients = 0;	
		
		for (uint i = 0; i < _powerUsers.length; i++) {
			powerUsers[_powerUsers[i]] = true;
			setApprovalForAll(_powerUsers[i], true);
		}
		
		for (uint i = 0; i < _adminUsers.length; i++) {
			adminUsers[_adminUsers[i]] = true;
			setApprovalForAll(_adminUsers[i], true);
		}
	}
	
	// =================
	
	// == ADMINISTRATION ==
	
	// Create power user
	function createPowerUser(address user) 
	public onlyOwner {
		powerUsers[user] = true;
		
		emit CreatePowerUser(user);
	}
	
	// Check power user
	function getPowerUser(address user) 
	public view onlyOwner
	returns (bool) {
		return powerUsers[user];
	}
	
	// Create admin user
	function createAdminUser(address user) 
	public onlyOwner {
		adminUsers[user] = true;
		
		emit CreateAdminUser(user);
	}
	
	// Check admin user
	function getAdminUser(address user) 
	public view onlyOwner
	returns (bool) {
		return adminUsers[user];
	}
	
	// ====================
	
	// == FUNCTIONS ==
	
	// Allocate a patient to a student
	function allocatePatient(uint patientID, address student) 
	public onlyPowerAndUpAndRequest patientListed(patientID) {		
		// Allocate patient to student
		patients[patientID].owner = student;
		transferFrom(address(this), student, patientID);
		
		// Remove patient from patient pool
		delete patientPool[patientID];
		
		emit Allocate(patientID, address(this), student, msg.sender);
	}
	
	//Create patient
	function createPatient(string memory name, string memory contactNum, 
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
		
		totalPatients++;
		
		return patientCount++;
	}
	
	// Register a patient in the patient pool
	function listPatient(uint patientID) 
	public onlyPowerAndUp patientUnlisted(patientID) unresolved(patientID) {		
		// Register patient ID in patient pool
		patientPool[patientID] = true;
		
		emit List(patientCount, msg.sender);
	}
	
	// Resolve a patient post-processing
	function resolvePatient(uint patientID)
	public onlyStudent(patientID) unresolved(patientID){
		patients[patientID].resolved = true;
		
		emit Resolve(patientID, msg.sender);
	}
	
	// Set request address for allocation permission
	function setRequestAddress(address _requestAddress) 
	public onlyOwner {
		requestAddress = _requestAddress;
	}
	
	// Transfer patient between students
	function studentTransfer(uint patientID, address student) 
	public unresolved(patientID) {
		// Re-allocate patient to new student
		transferFrom(msg.sender, student, patientID);
		
		// Update new owner
		patients[patientID].owner = student;
		
		emit Transfer(patientID, msg.sender, student);
	}
	
	// Update patient information
	function updatePatient(uint patientID, string memory _name,
						   string memory _contactNum,
						   uint[] memory _possessedIndications,
						   address _owner, bool resolution)
	public onlyPowerAndUp {
		patients[patientID].name = _name;
		patients[patientID].contactNum = _contactNum;
		patients[patientID].possessedIndications = _possessedIndications;
		patients[patientID].owner = _owner;
		patients[patientID].resolved = resolution;
		
		emit Update(patientID, msg.sender);
	}	
		
	// Unlist a patient in the patient pool
	function unlistPatient(uint patientID) 
	public onlyPowerAndUp patientListed(patientID) {		
		// Remove patient from patient pool
		delete patientPool[patientID];
		
		emit Unlist(patientCount, msg.sender);
	}
	
	// ===============
	
	// == GETTERS ==
	
	// Return all indications from patient
	function getIndications(uint patientID) 
	public view returns (uint[] memory) {		
		return patients[patientID].possessedIndications;
	}
	
	// Return contract owner
	function getOwner() 
	public view returns (address) {
		return owner;
	}
	
	// Return all credentials of a patient
	function getPatient(uint patientID) 
	public onlyAdminAndUp
	view returns (string memory, string memory, uint[] memory, address, bool) {
		return (patients[patientID].name, patients[patientID].contactNum,
			    patients[patientID].possessedIndications, patients[patientID].owner,
			    patients[patientID].resolved);
	}
	
	// Return total number of patients
	function getTotalPatients() 
	public view returns (uint) {
		return totalPatients;
	}
	
	// =============
}