# Patient-Allocation-System

# Setting Up


Open a terminal from IDE:

	1: cd projectFolder
	2: npm install


# Running the project



Open a terminal:

	1: type 'ganache-cli -p -m -a 20' to initialise accounts

Open another terminal:

	1: cd projectFolder
	2: type 'truffle migrate'
	3: type 'npm start'
	4: View app on http://localhost:3000/home
	

# Setting up database and running Data Init


Open PSQL:

	1: CREATE DATABASE api;
	2: \c api
	3: \i path/to/your/postgresql script.sql
