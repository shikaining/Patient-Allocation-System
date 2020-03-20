//calls methods in server.js
$(document).ready(function () {
  var curraccount;
  var selectedAccount;
  var sender;

  $.get('/getAccounts', function (response) {
    //response received from server.js has many accounts
    //for each account, prints the account
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
    $.post('/allocatePatient', { patientId: patientId, studentAddr: studentAddr, sender: sender }, function () {
      //response is from server.js, contains the balance
      $('#status').text("Allocated successfully");
    })
  });

  $.get('/getTotalPatients', function (response) {
    var totalPatients = response[0];
    //need a component in html with id: totalPatients
    $('#totalPatients').text(totalPatients);
  })

  $.get('/getOwner', function (response) {
    var owner = response[0];
    //need a component in html with id: owner
    $('#owner').text(owner);
  })

  $('#list').click(function () {
    $('#status').text("Pending...");
    let patientId = $('#patientId').val();
    $.post('/listPatient', { patientId: patientId, sender: sender }, function () {
      $('#status').text("Listed successfully");
    })
  });

  $('#unlist').click(function () {
    $('#status').text("Pending...");
    let patientId = $('#patientId').val();
    $.post('/unlistPatient', { patientId: patientId, sender: sender }, function () {
      $('#status').text("Unlisted successfully");
    })
  });

  $('#transfer').click(function () {
    $('#status').text("Pending...");
    let patientId = $('#patientId').val();
    let studentAddr = $('#studentAddr').val();
    $.post('/studentTransfer', { patientId: patientId, studentAddr: studentAddr, sender: sender }, function () {
      $('#status').text("Student transferred successfully");
    })
  });

})
