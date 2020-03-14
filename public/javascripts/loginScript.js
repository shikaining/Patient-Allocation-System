function check(event) {
	// Get Values
    var username = document.getElementById('username').value;
    var password    = document.getElementById('password'   ).value;
	
	// Simple Check
	if(username.length == 0) {
		alert("Invalid name");
		event.preventDefault();
		event.stopPropagation();
		return false;
    }
}