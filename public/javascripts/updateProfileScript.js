function check(event) {
	// Get Values
	var name = document.getElementById('name').value;
	var nric = document.getElementById('nric').value;
	var password = document.getElementById('password').value;
	var repassword = document.getElementById('repassword').value;

	// Simple Check
	if (nric.length != 9) {
		alert("Invalid NRIC number");
		event.preventDefault();
		event.stopPropagation();
		return false;
	}
	if (name.length == 0) {
		alert("Invalid name");
		event.preventDefault();
		event.stopPropagation();
		return false;
	}
	if (password != repassword) {
		alert("Password does not match");
		event.preventDefault();
		event.stopPropagation();
		return false;
	}
}