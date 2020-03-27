drop table if exists student cascade;
drop table if exists staff cascade;
drop table if exists patient cascade;
drop table if exists request cascade;

CREATE TABLE Student (
	studId Serial,
	name varchar(60),
	nric varchar(20),
	contactNo varchar(20),
	email varchar(128) unique not null,
	password varchar(60),
	address varchar(60),
	PRIMARY KEY (studId)

);

CREATE TABLE Staff (
	stfId Serial,
	name varchar(60),
	nric varchar(20),
	contactNo varchar(20),
	email varchar(128) unique not null,
	password varchar(60),
	address varchar(60),
	PRIMARY KEY (stfId)
);

CREATE TABLE Patient (
	pId Serial,
	stfId integer not null,
	studId int,
	name varchar(60),
	nric varchar(20) unique not null,
	contactNo varchar(20),
	listStatus varchar(20),
	allocatedStatus varchar(20),
	curedStatus varchar(20),
	indications text[],
	PRIMARY KEY (pId),
	FOREIGN KEY (stfId) REFERENCES Staff on delete cascade,
	FOREIGN KEY (studId) REFERENCES Student on delete cascade
);


CREATE TABLE Request (
	rId Serial,
	stfId integer,
	pId integer not null,
	studId int not null,
	allocatedStatus varchar(20),
	indications text[],
	PRIMARY KEY (rId),
	FOREIGN KEY (stfId) REFERENCES Staff on delete cascade,
	FOREIGN KEY (studId) REFERENCES Student on delete cascade,
	FOREIGN KEY (pId) REFERENCES Patient on delete cascade
);

insert into Student(name, nric, contactNo, email, password) values('Kai Ning', 'S9123456A', '91234567', 'kaining@gmail.com', 'asd');
insert into Student(name, nric, contactNo, email, password) values('Cyrus', 'S9123457A', '91234567', 'cyrus@gmail.com', 'asd');
insert into Student(name, nric, contactNo, email, password) values('Jason', 'S9123458A', '91234567', 'jason@gmail.com', 'asd');
insert into Student(name, nric, contactNo, email, password) values('Jerome', 'S9123459A', '91234567', 'jerome@gmail.com', 'asd');


insert into Staff(name, nric, contactNo, email, password) values('Staff1', 'S9223456A', '91234567', 'staff1@gmail.com', 'asd');
insert into Staff(name, nric, contactNo, email, password) values('Staff2', 'S9323457A', '92234567', 'staff2@gmail.com', 'asd');
insert into Staff(name, nric, contactNo, email, password) values('Staff3', 'S9423458A', '93234567', 'staff3@gmail.com', 'asd');
insert into Staff(name, nric, contactNo, email, password) values('Staff4', 'S9523459A', '94234567', 'staff4@gmail.com', 'asd');

insert into Patient(stfId, name, nric, contactNo, listStatus, allocatedStatus, curedStatus, indications) values(1, 'Patient1', 'S9223451A', '91234568', 'Not Listed', 'Not Allocated', 'Not Cured','{"CDExamCase", "Endodontics"}');
-- update Patient set studId = 3;

insert into Request(studId, pId, allocatedStatus, indications) values(1, 1, 'Pending', '{"CDExamCase", "Endodontics"}');
insert into Request(studId, pId, allocatedStatus, indications) values(2, 1, 'Pending', '{"CDExamCase", "Endodontics"}');
insert into Request(studId, pId, allocatedStatus, indications) values(3, 1, 'Pending', '{"CDExamCase", "Endodontics"}');
insert into Request(studId, pId, allocatedStatus, indications) values(4, 1, 'Pending', '{"CDExamCase", "Endodontics"}');
