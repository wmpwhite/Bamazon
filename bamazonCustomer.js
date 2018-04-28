var inquirer = require("inquirer");
var mysql = require("mysql");
var Table = require("cli-table");

var connection = mysql.createConnection({
  host: "localhost",
  port: 8889,

  // Your username
  user: "root",

  // Your password
  password: "root",
  database: "bamazon_db"
});

connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId)
    readProducts();
    // connection.end();
  });

  var prodTableLength = 0;
  var newQty = 0;
  var itemBought = 0;

  function readProducts() {
    console.log("Selecting all products...\n");
    connection.query("SELECT * FROM products", function(err, res) {
        if (err) throw err;
        // Log all results of the SELECT statement
        var table = new Table ({
            head: ["Product ID","Product","Department","Price","Qty_OH"],
            colWidths: [6, 35, 20, 8, 8]
        });
        for (var i = 0; i < res.length; i++) {
            table.push( [res[i].item_id, res[i].product_name, res[i].department_name, res[i].price, res[i].stock_quantity]);
        }
        console.log(table.toString());
        prodTableLength = res.length;
        console.log("There are " + prodTableLength + "items in the product table.");
        start();
        // connection.end();
    })
  };

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
                console.log("OK. Thank you for shopping with bamazon.");
                connection.end();
            }
            else {
                goBuy();
            }
        })
};

function goBuy() {
    inquirer 
        .prompt([
        { type: "input",
          name: "itemID",
          message: "What is the item number?"
        },
        { type: "input",
          name: "itemQty",
          message: "How many would you like?"
        }
    ]).then(function(answer) {
        // if (answer.itemID > prodTableLength) {
        //     console.log("Sorry, I don't recognize that item.");
        //     connection.end();
        // };
        var query = "SELECT price, stock_quantity FROM products WHERE item_id = ?";
        connection.query(query, [answer.itemID], function(err, res) {
            if (err) throw err;
            console.log(res[0].price);
            console.log(res[0].stock_quantity);
            if (answer.itemQty > res[0].stock_quantity) {
                console.log("Sorry, we don't have enough stock to fill that order.");
                connection.end();
            } else {
                var totalPrice = answer.itemQty * res[0].price;
                console.log("The total for that order is $" + totalPrice);
                newQty = res[0].stock_quantity - answer.itemQty;
                itemBought = answer.itemID;
                console.log("variable newQty = " + newQty);
                console.log("variable itemBought = " + itemBought);
                updateQty();
                // connection.end();
            };
            
        })
        
    })
};

function updateQty() {
    var query1 = "UPDATE products SET stock_quantity = ? WHERE item_id = ?";
    connection.query(query1, [newQty, itemBought], function(err, res) {
        if (err) throw err;
        console.log(res);
        // connection.end();
    });
    connection.query("SELECT * FROM products", function(err, res) {
        if (err) throw err;
        // Log all results of the SELECT statement
        var table = new Table ({
            head: ["Product ID","Product","Department","Price","Qty_OH"],
            colWidths: [6, 35, 20, 8, 8]
        });
        for (var i = 0; i < res.length; i++) {
            table.push( [res[i].item_id, res[i].product_name, res[i].department_name, res[i].price, res[i].stock_quantity]);
        }
        console.log(table.toString());
    });
};

