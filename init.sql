drop table if exists student cascade;
drop table if exists staff cascade;
drop table if exists patient cascade;
drop table if exists request cascade;
drop table if exists IndicationQuota cascade;

CREATE TABLE Student (
	studId Serial,
	name varchar(60),
	nric varchar(120),
	contactNo varchar(20),
	email varchar(128) unique not null,
	password varchar(120),
	address varchar(60),
	enrolYear int not null,
	indicationCount integer[10],
	expectedCount integer[10],
	PRIMARY KEY (studId)
);

CREATE TABLE Staff (
	stfId Serial,
	name varchar(60),
	nric varchar(120),
	contactNo varchar(20),
	email varchar(128) unique not null,
	password varchar(120),
	address varchar(60),
	verification varchar(60),
	PRIMARY KEY (stfId)
);

CREATE TABLE Patient (
	pId integer not null,
	stfId integer not null,
	studId int,
	name varchar(60),
	nric varchar(120) unique not null,
	contactNo varchar(20),
	listStatus varchar(20),
	allocatedStatus varchar(20),
	resolvedStatus varchar(20),
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
	fcfsScore bigint not null,
	seniorityScore bigint not null,
	isTransferred boolean DEFAULT FALSE,
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





insert into Student(name, nric, contactNo, email, password,enrolYear,indicationCount,expectedCount) values('Kai Ning', 'S9123456A', '91234567', 'kaining@gmail.com', 'password', 2017,'{1, 2, 3, 4, 5, 4, 3, 2, 1, 1}','{1, 2, 3, 4, 5, 4, 3, 2, 1, 1}');
insert into Student(name, nric, contactNo, email, password,enrolYear,indicationCount,expectedCount) values('Cyrus', 'S9123457A', '91234567', 'cyrus@gmail.com', 'password', 2017,'{0, 0, 0, 0, 0, 0, 0, 0, 0, 0}','{0, 0, 0, 0, 0, 0, 0, 0, 0, 0}');
insert into Student(name, nric, contactNo, email, password,enrolYear,indicationCount,expectedCount) values('Jason', 'S9123458A', '91234567', 'jason@gmail.com', 'password', 2018, '{0, 0, 0, 0, 0, 0, 0, 0, 0, 0}','{0, 0, 0, 0, 0, 0, 0, 0, 0, 0}');
insert into Student(name, nric, contactNo, email, password,enrolYear,indicationCount,expectedCount) values('Jerome', 'S9123459A', '91234567', 'jerome@gmail.com', 'password', 2019, '{0, 0, 0, 0, 0, 0, 0, 0, 0, 0}','{0, 0, 0, 0, 0, 0, 0, 0, 0, 0}');


--systemadmin is system admin
-- --
insert into Staff(name, nric, contactNo, email, password, verification) values('SystemAdmin', 'S9223456A', '91234567', 'staff0@gmail.com', 'password', 'systemadmin');
insert into Staff(name, nric, contactNo, email, password, verification) values('PowerUser1', 'S9223456A', '91234567', 'staff1@gmail.com', 'password', 'poweruser');
insert into Staff(name, nric, contactNo, email, password, verification) values('PowerUser2', 'S9323457A', '92234567', 'staff2@gmail.com', 'password', 'poweruser');
insert into Staff(name, nric, contactNo, email, password, verification) values('AdminUser1', 'S9423458A', '93234567', 'staff3@gmail.com', 'password', 'staff');

-- INSERT INTO indications(cd_exam_case, dental_public_health, endodontics, fixed_prosthodontics, operative_dentistry, oral_surgery, orthodontics, pedodontics, periodontics, removable_prosthodontics)
-- VALUES(3, 5, 4, 3, 5, 4, 6, 2, 4, 3);

INSERT INTO IndicationQuota(indicationArray) VALUES ('{3, 5, 4, 3, 5, 4, 6, 2, 4, 3}');

-- insert into Patient(pId, stfId, name, nric, contactNo, listStatus, allocatedStatus, curedStatus, indications) values(1, 1, 'Patient1', 'S9223451A', '91234568', 'Not Listed', 'Not Allocated', 'Not Cured','{"CDExamCase", "Endodontics"}');
-- -- -- update Patient set studId = 3;

-- insert into Request(studId, pId, allocatedStatus, indications) values(1, 1, 'Pending', '{"CDExamCase", "Endodontics"}');
-- insert into Request(studId, pId, allocatedStatus, indications) values(2, 1, 'Pending', '{"CDExamCase", "Endodontics"}');
-- insert into Request(studId, pId, allocatedStatus, indications) values(3, 1, 'Pending', '{"CDExamCase", "Endodontics"}');
-- insert into Request(studId, pId, allocatedStatus, indications) values(4, 1, 'Pending', '{"CDExamCase", "Endodontics"}');


INSERT INTO public.patient (pid,stfid,studid,"name",nric,contactno,liststatus,allocatedstatus,resolvedstatus,indications,listedtimestamp,leadingstudentid,leadingstudentname) VALUES
(8,2,NULL,'Patient8','S9215008H','94540008','Listed','Not Allocated','Not Resolved','{CD Exam Case}','2020-04-13 14:05:38.377',0,'No Request Yet')
,(9,2,NULL,'Patient9','S9215009I','94540009','Listed','Not Allocated','Not Resolved','{CD Exam Case}','2020-04-13 14:05:42.632',0,'No Request Yet')
,(10,2,NULL,'Patient10','S9215010J','94540010','Listed','Not Allocated','Not Resolved','{CD Exam Case}','2020-04-13 14:05:47.039',0,'No Request Yet')
,(1,2,1,'Patient1','S9215001A','94540001','Unlisted','Allocated','Resolved','{CD Exam Case,Dental Public Health,Endodontics,Fixed Prosthodontics,Operative Dentistry,Oral Surgery,Orthodontics,Pedodontics,Periodontics,Removable Prosthodontics}','2020-04-13 14:05:04.444',1,'Kai Ning')
,(2,2,1,'Patient2','S9215002B','94540002','Unlisted','Allocated','Resolved','{Dental Public Health,Endodontics,Fixed Prosthodontics,Operative Dentistry,Oral Surgery,Orthodontics,Pedodontics}','2020-04-13 14:05:09.156',1,'Kai Ning')
,(3,2,1,'Patient3','S9215003C','94540003','Unlisted','Allocated','Resolved','{Endodontics,Fixed Prosthodontics,Operative Dentistry,Oral Surgery,Orthodontics}','2020-04-13 14:05:14.348',1,'Kai Ning')
,(4,2,1,'Patient4','S9215004D','94540004','Unlisted','Allocated','Resolved','{Fixed Prosthodontics,Operative Dentistry,Oral Surgery}','2020-04-13 14:05:19.160',1,'Kai Ning')
,(5,2,1,'Patient5','S9215005E','94540005','Unlisted','Allocated','Resolved','{Operative Dentistry}','2020-04-13 14:05:24.739',1,'Kai Ning')
,(6,2,NULL,'Patient6','S9215006F','94540006','Listed','Not Allocated','Not Resolved','{CD Exam Case}','2020-04-13 14:05:29.339',1,'No Request Yet')
,(7,2,NULL,'Patient7','S9215007G','94540007','Listed','Not Allocated','Not Resolved','{CD Exam Case}','2020-04-13 14:05:34.127',1,'No Request Yet')
;


INSERT INTO public.request (rid,stfid,pid,studid,allocatedstatus,indications,score,requesttimestamp,fcfsscore,seniorityscore,istransferred) VALUES
(1,NULL,1,1,'Resolved','{CD Exam Case,Dental Public Health,Endodontics,Fixed Prosthodontics,Operative Dentistry,Oral Surgery,Orthodontics,Pedodontics,Periodontics,Removable Prosthodontics}',749999431029,'2020-04-13 14:08:03.994',199999431029,250000000000,false)
,(2,NULL,2,1,'Resolved','{Dental Public Health,Endodontics,Fixed Prosthodontics,Operative Dentistry,Oral Surgery,Orthodontics,Pedodontics}',677585612103,'2020-04-13 14:08:16.855',199999405206,250000000000,false)
,(3,NULL,3,1,'Resolved','{Endodontics,Fixed Prosthodontics,Operative Dentistry,Oral Surgery,Orthodontics}',613635752573,'2020-04-13 14:08:27.181',199999388937,250000000000,false)
,(4,NULL,4,1,'Resolved','{Fixed Prosthodontics,Operative Dentistry,Oral Surgery}',524999377266,'2020-04-13 14:08:35.676',199999377266,250000000000,false)
,(5,NULL,5,1,'Resolved','{Operative Dentistry}',509999371143,'2020-04-13 14:08:43.187',199999371143,250000000000,false)
;
