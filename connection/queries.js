const Pool = require("pg").Pool;
const CryptoJS = require('crypto-js');
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "api",
  password: "password",
  port: 5432
});

function inputDB(query, address, email, nric, password){
  return new Promise((res,rej) => {
    // console.log("Query: " + query)
    // console.log("address: " + address)
    // console.log("email: " + email);
    // console.log("nric: " + nric);
    // console.log("password: " + password)
    pool.query(query,[address,password,nric, email], (err,data)=>{
      if(err){
        console.log('Error')
        console.log(err);
      }else {
        console.log('Success')
        res(data);
        return;
      }
      
    })
  })
}

module.exports = {
  init: async function(accounts) {
    if(accounts == null || accounts.length < 5) {
      console.log("***FORGOT TO RUN TRUFFLE MIGRATE***")
      return;
    }
    hashedPassword = CryptoJS.AES.encrypt('password', 'IS4302').toString();
    // console.log(hashedPassword)
    pool.query('select stud.email as studemail, staff.email as staffemail from staff staff left join student stud on staff.stfid = stud.studid ORDER BY staff.stfId asc', async (err,result) => {
      
      updateStaff = "UPDATE public.staff SET address = $1, password = $2, nric = $3 WHERE email = $4"
      updateStudent = "UPDATE public.student SET address = $1, password = $2, nric = $3 WHERE email = $4"
      let i = 0;
      console.log(i + '-First')
      await inputDB(updateStaff, accounts[i], result.rows[i].staffemail, CryptoJS.AES.encrypt('S953600' + i + 'A', 'IS4302').toString(), hashedPassword)
      // console.log(i + '- Second')
      await inputDB(updateStudent, accounts[i+5], result.rows[i].studemail, CryptoJS.AES.encrypt('S953610' + i + 'A', 'IS4302').toString(), hashedPassword)
      i = 1;
      console.log(i + '- First')
      await inputDB(updateStaff, accounts[i], result.rows[i].staffemail, CryptoJS.AES.encrypt('S953600' + i + 'A', 'IS4302').toString(), hashedPassword)
      // console.log(i + '- Second');
      await inputDB(updateStudent, accounts[i+5], result.rows[i].studemail, CryptoJS.AES.encrypt('S953610' + i + 'A', 'IS4302').toString(), hashedPassword)
      i = 2;
      console.log(i + '- First')
      await inputDB(updateStaff, accounts[i], result.rows[i].staffemail, CryptoJS.AES.encrypt('S953600' + i + 'A', 'IS4302').toString(), hashedPassword)
      // console.log(i + '- Second');
      await inputDB(updateStudent, accounts[i+5], result.rows[i].studemail, CryptoJS.AES.encrypt('S953610' + i + 'A', 'IS4302').toString(), hashedPassword)
      i = 3;
      console.log(i + '- First')
      await inputDB(updateStaff, accounts[i], result.rows[i].staffemail, CryptoJS.AES.encrypt('S953600' + i + 'A', 'IS4302').toString(), hashedPassword)
      // console.log(i + '- Second');
      await inputDB(updateStudent, accounts[i+5], result.rows[i].studemail, CryptoJS.AES.encrypt('S953610' + i + 'A', 'IS4302').toString(), hashedPassword)


    //   for(i = 0; i < 4; i++){
    //     // console.log(i)
    //     // console.log(hashedPassword);
    //     staffAddress = accounts[i];
    //     staffEmail = result.rows[i].staffemail;
    //     staffNric = 'S953600' + i + "A";
    //     staffNric = CryptoJS.AES.encrypt(staffNric, 'IS4302').toString();
    //     updateStaff = "UPDATE public.staff SET address = $1, password = $2, nric = $3 WHERE email = $4"
    //     // console.log(i)
        
    //     studI = i+5;
    //     studentAddress = accounts[studI];
    //     studentEmail = result.rows[i].studemail;
    //     studentNRIC = 'S953610' + studI + 'B';
    //     studentNRIC = CryptoJS.AES.encrypt(studentNRIC, 'IS4302').toString();
    //     // console.log(studentNRIC);
    //     updateStudent = "UPDATE public.student SET address = $1, password = $2, nric = $3 WHERE email = $4"
    //     inputDB(updateStaff, staffAddress, staffEmail, staffNric, hashedPassword).then(inputDB(updateStudent, studentAddress, studentEmail, studentNRIC, hashedPassword))
    //   }
    //   console.log("End of Init, Success updating Database")
    })
    
  },
  select: function(table, columns, params, order) {
    var query = "SELECT " + columns + " FROM " + table;
    if (params != "") {
      query += " WHERE " + params;
    }
    if (order != "" && order != null) {
      console.log(order);
      query += " ORDER BY " + order;
    }
    console.log("SELECT Statement triggered : " + query);
    return new Promise((resolve, reject) => {
      pool.query(query, (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results);
        return;
      });
    });
  },

  insert: function(query, values) {
    console.log("INSERT Statement triggered");
    return new Promise((resolve, reject) => {
      pool.query(query, values, (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results);
        return;
      });
    });
  },

  delete: function(table, params) {
    var query = "DELETE FROM " + table + " WHERE " + params;
    console.log("DELETE Statement triggered : " + query);
    return new Promise((resolve, reject) => {
      pool.query(query, (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results);
        return;
      });
    });
  }
};
