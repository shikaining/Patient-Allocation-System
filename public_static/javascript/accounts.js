//calls methods in server.js
$(document).ready(function () {
  var curraccount;
  var selectedAccount;
  var sender;
  var listOfAddress

  $.get('/getAccounts', function (response) {
    //response received from server.js has many accounts
    //for each account, prints the account
    listOfAddress = response;
    for (let i = 0; i < response.length; i++) {
      curraccount = response[i];
      $('#options').append("<option value='" + curraccount + "'>" + curraccount + "</option>");
    }
  })

  $('#submit').click(function () {
    //user has chosen an account
    selectedAccount = $('#options').val();
    console.log(selectedAccount);
    $.post('/getBalance', { account: selectedAccount }, function (response) {
      $('.select').removeClass("active");
      $('.send').addClass("active");
      $('#account').text(selectedAccount);
      //first element of the response - balance
      $('#balance').text(response[0]);
      //response[1]: all accounts
      var current_account_index = response[1].indexOf(selectedAccount);
      //remove the selected account by the index
      //because can only choose from the remaining accounts
      response[1].splice(current_account_index, 1); //remove the selected account from the list of accounts you can send to.
      $('#all-accounts').addClass("active");
      var list = $('#all-accounts > ol');
      for (let i = 0; i < response[1].length; i++) {
        li = "<li>" + response[1][i] + "</li>";
        list.append(li)
      }
    })
  })

  $('#submit1').click(function () {
      $('.select').removeClass("active");
      $('.create').addClass("active");
  })

  $('#send').click(function () {
    $('#status').text("Sending...");
    let amount = $('#amount').val();
    let receiver = $('#receiver').val();
    //selectedAcocunt is from the prev method
    $.post('/sendCoin', { amount: amount, sender: selectedAccount, receiver: receiver }, function (response) {
      $('#balance').text(response);
      //response is from server.js, contains the balance
      $('#status').text("Sent!!");
    })
  });
  /*
  PATIENT CONTRACT
  */
  $('#allocate').click(function () {
    $('#status').text("Pending...");
    let patientId = $('#patientId').val();
    let studentAddr = $('#studentAddr').val();
    sender = listOfAddress[1]; // Temporary!!    sender will eventually be taken from account user and match to address stored in DB.
    $.post('/allocatePatient', { patientId: patientId, studentAddr: studentAddr, sender: sender }, function () {
      //response is from server.js, contains the balance
      $('#status').text("Allocated successfully");
    })
  });


  $.get('/getOwner', function (response) { //Checked 1
    console.log("Response: " + response);
    var owner = response; //Initially was response[0], which returns 0, not the address.
    //need a component in html with id: owner
    $('#owner').text(owner);
  })

  $('#list').click(function () { //Checked 1
    $('#status').text("Pending...");
    console.log("Listing Patient in progress")
    let patientId = $('#patientId').val();
    sender = listOfAddress[1]; // Temporary!!    sender will eventually be taken from account user and match to address stored in DB.
    $.post('/listPatient', { patientId: patientId, sender: sender }, function () { //
      $('#status').text("Listed successfully"); 
    })
  });

  $('#unlist').click(function () { //Checked 1
    $('#status').text("Pending...");
    let patientId = $('#patientId').val();
    sender = listOfAddress[1]; // Temporary!!    sender will eventually be taken from account user and match to address stored in DB.
    $.post('/unlistPatient', { patientId: patientId, sender: sender }, function () {
      $('#status').text("Unlisted successfully");
    })
  });

  $('#transfer').click(function () { //Can't test since createPatient don't work.
    $('#status').text("Pending...");
    let patientId = $('#patientId').val();
    let studentAddr = $('#studentAddr').val();
    $.post('/studentTransfer', { patientId: patientId, studentAddr: studentAddr, sender: sender }, function () {
      $('#status').text("Student transferred successfully");
    })
  });

  $.get('/getPatient', function (response) { // Can't test this at the moment, need wait for frontend.
    var patientName = response[0];
    var patientContact = response[1];
    var indications = response[2];
    var patientOwner = response[3];
    var resolved = response[4];
    //need a component in html with id: totalPatients
    $('#patientName').text(patientName);
    $('#patientContact').text(patientContact);
    $('#indications').text(indications);
    $('#patientOwner').text(patientOwner);
    $('#resolved').text(resolved);
  })

  $('#createPatient').click(function () { //Doesn't work at the moment, Error: OUT OF GAS.
    $('#status').text("Pending...");
    let patientName = $('#patientName').val();
    let patientContact = $('#patientContact').val();
    let indications = $('#indications').val();
    sender = listOfAddress[1]; // Temporary!!    sender will eventually be taken from account user and match to address stored in DB.
    $.post('/createPatient', { patientName: patientName, patientContact: patientContact, indications: indications, sender: sender }, function () {
      /* Method to create patient in PostgreSQL DB */
      $('#status').text("Created successfully");
    })
  });

})
