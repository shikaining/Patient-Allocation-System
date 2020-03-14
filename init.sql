drop table if exists users cascade;

CREATE TABLE Users (
	uId Serial,
	name varchar(60),
	nric varchar(20),
	contactNo varchar(20),
	email varchar(128) unique not null,
	password varchar(60),
	PRIMARY KEY (uId)

);

insert into Users(name, nric, contactNo, email, password) values('Kai Ning', 'S9123456A', '91234567', 'kaining@gmail.com', 'asd');
insert into Users(name, nric, contactNo, email, password) values('Cyrus', 'S9123457A', '91234567', 'cyrus@gmail.com', 'asd');
insert into Users(name, nric, contactNo, email, password) values('Jason', 'S9123458A', '91234567', 'jason@gmail.com', 'asd');
insert into Users(name, nric, contactNo, email, password) values('Jerome', 'S9123459A', '91234567', 'jerome@gmail.com', 'asd');
