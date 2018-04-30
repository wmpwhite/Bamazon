

// The following three lines require npm packages for use in the code.
var inquirer = require("inquirer");
var mysql = require("mysql");
var Table = require("cli-table");

//Lines 9-19 set up the localhost and port to connect to the database.
var connection = mysql.createConnection({
  host: "localhost",
  port: 8889,

  // Your username
  user: "root",

  // Your password
  password: "root",
  database: "bamazon_db"
});

// The following lines establish a connection to database,
// throw an eror if the connection is not made, and if it is made
// the function "readProducts" is fired.
connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId)
    readProducts();
    // connection.end();
  });

// Three variables are initialized as global so that information 
// from one function can be used in another.
var prodTableLength = 0;
var newQty = 0;
var itemBought = 0;

// Function "readProducts" takes in the current database information
// and displays it in a table.
// It then fires function start to initiate interaction at the command line.
function readProducts() {
    console.log("\nSelecting all products...\n");
    connection.query("SELECT * FROM products", function(err, res) {
        if (err) throw err;
        // Log all results of the SELECT statement
        var table = new Table ({
            head: ["Item No.","Product","Department","Price","Qty_OH"],
            colWidths: [10, 35, 20, 8, 8]
        });
        for (var i = 0; i < res.length; i++) {
            table.push( [res[i].item_id, res[i].product_name, res[i].department_name, res[i].price, res[i].stock_quantity]);
        }
        console.log(table.toString());
        prodTableLength = res.length;        
        start();    
    })
};

// Function "start" is basically an inquirer prompt that gives the 
// user the option to say yes or no to a question asking if they
//  want to buy anything from the table.
// If they say "no" there is a msg and the the program terminates.
// If they say yes, the function "goBuy" is fired.
function start() {
    inquirer
        .prompt({
            name: "buyOrNot",
            type: "rawlist",
            message: "Would you like to buy something",
            choices: ["YES", "NO"]
        })
        .then(function(answer) {
            if (answer.buyOrNot.toUpperCase() === "NO") {
                console.log("\nOK. Thank you for shopping with bamazon.");
                connection.end();
            }
            else {
                goBuy();
            }
        })
};

// Function "goBuy" performs the bulk of the functionality.
// First, an inquirer prompt asks for the user to input
//  the item number and quantity they want to buy. 

function goBuy() {
    inquirer 
        .prompt([
        { type: "input",
          name: "itemID",
          message: "\nWhat is the item number of the product you would like to purchase?"
        },
        { type: "input",
          name: "itemQty",
          message: "\nHow many would you like to buy?"
        }
    // The following code validates that the item number exists in the table
    // by making sure that it is within the range of the number of
    // products in the table (i.e., no higher than 10 in this case).
    ]).then(function(answer) {
        if (answer.itemID > prodTableLength) {
            console.log("\nSorry, I don't recognize that item.");
            connection.end();
        } else {

            // The following code queries the data base
            var query = "SELECT price, stock_quantity FROM products WHERE item_id = ?";
            connection.query(query, [answer.itemID], function(err, res) {
                if (err) throw err;
                // The following "if" checks to see if there is sufficient
                // stock on hand to fill the desired order.  If not it logs a msg
                // and ends the session.
                if (answer.itemQty > res[0].stock_quantity) {
                    console.log("\nSorry, we don't have enough stock to fill that order.");
                    connection.end();
                } else {
                    // If there is sufficient quantity, the following code computes the order 
                    // total cost (qty times unit price) and computes the new stock level by 
                    // subtracting the order quantity from the initial stock quantity for the item.
                    // It the fire function "updateQty".  
                    var totalPrice = answer.itemQty * res[0].price;
                    console.log("\nThe total for that order is $" + totalPrice);
                    newQty = res[0].stock_quantity - answer.itemQty;
                    itemBought = answer.itemID;                    
                    updateQty();                    
                };
            })
        }        
    })
};

// This function updates the products table by changing the stock quantity
// for the purchased item to the newly computed post-sale quntity.
// it then prints a new table with the updated quantity displayed. 
function updateQty() {
    var query1 = "UPDATE products SET stock_quantity = ? WHERE item_id = ?";
    connection.query(query1, [newQty, itemBought], function(err, res) {
        if (err) throw err;
    });
    console.log("\nUpdating product table...\n");
    connection.query("SELECT * FROM products", function(err, res) {
        if (err) throw err;        
        var table = new Table ({
            head: ["Product ID","Product","Department","Price","Qty_OH"],
            colWidths: [6, 35, 20, 8, 8]
        });
        for (var i = 0; i < res.length; i++) {
            table.push( [res[i].item_id, res[i].product_name, res[i].department_name, res[i].price, res[i].stock_quantity]);
        }
        console.log(table.toString());
        connection.end();
    });
};

