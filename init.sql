drop table if exists student cascade;
drop table if exists staff cascade;
drop table if exists patient cascade;
drop table if exists request cascade;
drop table if exists IndicationQuota cascade;

CREATE TABLE Student (
	studId Serial,
	name varchar(60),
	nric varchar(20),
	contactNo varchar(20),
	email varchar(128) unique not null,
	password varchar(60),
	address varchar(60),
	enrolYear int not null,
	indicationCount integer[10],
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
	verification varchar(60),
	PRIMARY KEY (stfId)
);

CREATE TABLE Patient (
	pId integer not null,
	stfId integer not null,
	studId int,
	name varchar(60),
	nric varchar(20) unique not null,
	contactNo varchar(20),
	listStatus varchar(20),
	allocatedStatus varchar(20),
	curedStatus varchar(20),
	indications text[],
	listedTimestamp timestamptz ,
	leadingStudentId integer DEFAULT 0,
	leadingStudentName varchar(60) DEFAULT 'No Request Yet',
	PRIMARY KEY (pId),
	FOREIGN KEY (stfId) REFERENCES Staff on delete cascade,
	FOREIGN KEY (studId) REFERENCES Student on delete cascade
);


CREATE TABLE Request (
	rId integer not null,
	stfId integer,
	pId integer not null,
	studId int not null,
	allocatedStatus varchar(20),
	indications text[],
	score bigint not null,
	requestTimestamp timestamptz,
	PRIMARY KEY (rId),
	FOREIGN KEY (stfId) REFERENCES Staff(stfId) on delete cascade,
	FOREIGN KEY (studId) REFERENCES Student(studId) on delete cascade,
	FOREIGN KEY (pId) REFERENCES Patient(pId) on delete cascade
);

-- CREATE TABLE Indications (
-- 	iId serial NOT NULL,
-- 	cd_exam_case int NOT NULL,
-- 	dental_public_health int NOT NULL,
-- 	endodontics int NOT NULL,
-- 	fixed_prosthodontics int NOT NULL,
-- 	operative_dentistry int NOT NULL,
-- 	oral_surgery int NOT NULL,
-- 	orthodontics int NOT NULL,
-- 	pedodontics int NOT NULL,
-- 	periodontics int NOT NULL,
-- 	removable_prosthodontics int NOT NULL,
-- 	PRIMARY KEY(iId)
-- );

CREATE TABLE IndicationQuota (
    iId serial NOT NULL,
	indicationArray integer ARRAY[10],
	PRIMARY KEY(iId)
);

insert into Student(name, nric, contactNo, email, password,enrolYear,indicationCount) values('Kai Ning', 'S9123456A', '91234567', 'kaining@gmail.com', 'asd', 2017,'{1, 2, 3, 4, 5, 4, 3, 2, 1, 0}');
insert into Student(name, nric, contactNo, email, password,enrolYear,indicationCount) values('Cyrus', 'S9123457A', '91234567', 'cyrus@gmail.com', 'asd', 2017,'{1, 2, 3, 4, 5, 4, 3, 2, 1, 0}');
insert into Student(name, nric, contactNo, email, password,enrolYear,indicationCount) values('Jason', 'S9123458A', '91234567', 'jason@gmail.com', 'asd', 2018, '{2, 1, 2, 0, 1, 2, 0, 1, 1, 3}');
insert into Student(name, nric, contactNo, email, password,enrolYear,indicationCount) values('Jerome', 'S9123459A', '91234567', 'jerome@gmail.com', 'asd', 2019, '{0, 0, 0, 0, 0, 0, 0, 0, 0, 0}');


insert into Staff(name, nric, contactNo, email, password, verification) values('Staff1', 'S9223456A', '91234567', 'staff1@gmail.com', 'asd', 'staff');
insert into Staff(name, nric, contactNo, email, password, verification) values('Staff2', 'S9323457A', '92234567', 'staff2@gmail.com', 'asd', 'staff');
insert into Staff(name, nric, contactNo, email, password, verification) values('Staff3', 'S9423458A', '93234567', 'staff3@gmail.com', 'asd', 'staff');
insert into Staff(name, nric, contactNo, email, password, verification) values('Staff4', 'S9523459A', '94234567', 'staff4@gmail.com', 'asd', 'poweruser');

-- INSERT INTO indications(cd_exam_case, dental_public_health, endodontics, fixed_prosthodontics, operative_dentistry, oral_surgery, orthodontics, pedodontics, periodontics, removable_prosthodontics)
-- VALUES(3, 5, 4, 3, 5, 4, 6, 2, 4, 3);

INSERT INTO IndicationQuota(indicationArray) VALUES ('{3, 5, 4, 3, 5, 4, 6, 2, 4, 3}');

-- insert into Patient(pId, stfId, name, nric, contactNo, listStatus, allocatedStatus, curedStatus, indications) values(1, 1, 'Patient1', 'S9223451A', '91234568', 'Not Listed', 'Not Allocated', 'Not Cured','{"CDExamCase", "Endodontics"}');
-- -- -- update Patient set studId = 3;

-- insert into Request(studId, pId, allocatedStatus, indications) values(1, 1, 'Pending', '{"CDExamCase", "Endodontics"}');
-- insert into Request(studId, pId, allocatedStatus, indications) values(2, 1, 'Pending', '{"CDExamCase", "Endodontics"}');
-- insert into Request(studId, pId, allocatedStatus, indications) values(3, 1, 'Pending', '{"CDExamCase", "Endodontics"}');
-- insert into Request(studId, pId, allocatedStatus, indications) values(4, 1, 'Pending', '{"CDExamCase", "Endodontics"}');
