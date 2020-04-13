# Patient-Allocation-System

# Setting Up


Open a terminal from IDE:

	1: cd projectFolder
	2: npm install
	
# Setting up database and running Data Init


Open PSQL:

	1: CREATE DATABASE api;
	2: \c api
	3: \i path/to/your/postgresql script.sql

# Running the project



Open a terminal:

	1: type 'ganache-cli -p -m -a 20' to initialise accounts

Open another terminal:

	1: cd projectFolder
	2: type 'truffle migrate'
	3: type 'npm start'
	4: View app on http://localhost:3000/home
	

# Use Cases of Proposed System

For staff, the use cases include: 
		1. Create staff account
		2. Create patient
		3. Update patient
		4. List patient
		5. Unlist patient
		6. Allocate patient
		7. View All Patients
	
For students, the use cases include
		1.Register for student account
		2. Create Request
		3. Withdraw Request
		4. Transfer Request
		5. Resolve Request (meaning indication has been processed)
		6. View All Patients
		7. View Unallocated Patients
		8. View Requests
		
		
# Ethereum Smart Contracts

	Other than registering for a student account, all of these use cases mentioned above utilize smart contracts to store essential information which accounts for traceability. Our current algorithm for allocation of patients includes the student seniority, indication requirement progress, number of allocated patients and time of request. These variables were determined to be the most important factors after various interview sessions with FOD students and professors. 
	
	We cannot promise that this is the best algorithm to garner confidence from FOD’s undergraduates due to the lack of access to a large-scale, real-time user-acceptance test which can not only test the limits of the algorithm but also find potential flaws. This is in tandem and similar to how the updated NUS ModReg algorithm was tested during Semester 1 of AY2019/2020. However, in the circumstance that we have access to the above mentioned testing, we will definitely be able to optimize the algorithm to its peak performance and reliability. In which, making the optimized algorithm fully transparent will reinforce, stabilize and reestablish the lost trust and confidence of FOD’s undergraduates towards the allocation system.


# Request core Calculation:
	
1. Firstly, we need to understand that we store 2 types of indication records for students and each record holds an integer for all 10 identified indications that FOD requires their students to treat before graduation.

		a. Their **actual completed indications (AcCInd)**, whereby it is only updated when students click ‘resolve’ patients within their account.
		b. Their **expected indications (ExInd)** holds the information of both completed indications and allocated indications that have not been resolved. Basically, when all allocated patients for this student have been resolved, their *ExInd* will have the same values as the *AcCInd*.
		
		
2. When a student makes a request for a patient, we will calculate their score for that particular request by taking the sum of their First Come First Served (FCFS) score, Indication Difference score and lastly, seniority score.

		a. FCFS score weightage is at 20%
			i. We take the difference between the unix timestamp* of when the Patient was listed and the unix timestamp of when the request was created.
			ii. We inverted this value so that the later a student sends a request, the less points they actually get from here.
		b. Indication Difference score weightage is at 30%
			i. There is an Indications Quota that students have to meet before graduation, this will be predetermined by the senior management team in FOD.
			ii. We take the indications the patient has and calculate the difference between Indications Quota and the students’ ExInd, only for the indications this patient has. If students have already hit their quota for graduation, the score for this indication will be 0, there is no negative scoring.
			iii. From there we will divide the total difference with the sum of quota for the respective indications.
			iv. Therefore, the less indications you have completed, the higher score you will get for Indication Difference score.
		c. Seniority score weightage is at 50%
			i. We take the difference between the year from the timestamp* when Patient was listed. 
			ii. Therefore, the closer they are to graduation, the greater number of points the student gets for their Seniority score. *Timestamp : Patient’s listed timestamp is recorded when they are first listed. Which means if they get unlisted and listed back again, the timestamp will still be from the very first time it was listed. This is to facilitate fairness incase staff try to abuse the system and collaborate with students.
			
3. Whenever a new request is submitted, we will update the current highest scoring student for that particular patient and display that information.


# Allocation Process

1. After a staff clicks on ‘allocate’ to allocate a patient to their current first in queue student, all ‘Pending’ request scores for that particular student will be recalculated. This is meant to ensure fairness whereby students cannot request for multiple patients in the early stage when they get better scores and hope to let that high score ride them through all subsequent allocations. This request score update process will be explained below.
2. Once a patient has been allocated, the respective indications that the patient has will be added to the student’s ExInd. With this new ExInd, a new Indication Difference score will be calculated for all pending requests that the student has.
3. The new Indication Difference score will be added to the previously calculated Seniority score and FCFS score which will lead to a new score for that particular request that is lower than the previous.
4. The respective new score for each pending request will be updated into both the ethereum smart contract as well as the database.
5. Following that, for each pending request updated, we will update its respective patient’s first in queue student as there might be a new student with a change in score. Once that is done, that would be all for the allocation process.

# Transfer Process

1. After allocation, if in a scenario where it has been agreed and approved by the staff for the allocated student to transfer his patient to another student, both students’ pending requests’ scores will be updated again. This is meant to not put the original student at a disadvantage when requesting new patients and vice versa for the receiving student.
2. We will refer to the original student to be student A while the recipient to be student B for clarity.
3. We will take the respective indications that the patient has and add it to student B’s ExInd. From there, we will recalculate all of his pending request scores and update all affected patients’ first-in-queue student with the change of the request scores. This is the same process done within the Allocation Process, mentioned above. This results in a lower score for all pending requests for student B.
4. We will then take the respective indications of the patient, but this time it is to deduct it from student B’s ExInd. From there, we will recalculate all of his pending request scores and update all affected patients’ first-in-queue student with the change of the request scores. This is the same process done within the Allocation Process, mentioned above.This results in a higher score for all pending requests for student A. Once that is done, that would be the end of the transfer process.




