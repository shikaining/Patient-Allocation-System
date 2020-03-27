const Pool = require("pg").Pool;
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "api",
  password: "password",
  port: 5432
});

module.exports = {
  init: function(accounts) {
    if(accounts == null || accounts.length < 5) {
      console.log("***FORGOT TO RUN TRUFFLE MIGRATE***")
      return;
    }
    pool.query("SELECT email FROM public.staff", (err, result)=>{
      // console.log(result.rows);
      var updateStatement = "UPDATE public.staff SET address = $1 WHERE email = $2"
      for(i = 0; i < result.rows.length; i++){
        address = accounts[i+1];
        email = result.rows[i].email;
        // console.log("Address : " + address);
        // console.log("Email : " + email)
        
        pool.query(updateStatement,[accounts[i+1],result.rows[i].email])
      }
      console.log("End of Init, Success updating Database")
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
