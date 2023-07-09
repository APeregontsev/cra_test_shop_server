let express = require("express");
let server = express();
const path = require("path");
const cors = require("cors");
let cookieParser = require("cookie-parser");
let onlineUsers = require("./onlineUsers.js");

server.use(express.json());
server.use(express.urlencoded());
server.use(cookieParser());

// For DEV
/*   origin: "http://localhost:3000", */

const corsOptions = {
  origin: "https://aperegontsev.github.io/cra_test_shop_front/",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
  credentials: true,
  /* allowedHeaders: "*", */
};

server.use(cors(corsOptions));

const port = process.env.PORT || 3100;

// Middleware
server.use((req, res, next) => {
  onlineUsers(req, res, connection, next);
});

// Подключаем mysql модуль
let mysql = require("mysql2");
let connection = mysql.createPool({
  connectionLimit: 5,
  host: "bu8525zb8ofvspeq8d4r-mysql.services.clever-cloud.com",
  user: "uyejhtoqam4loe1o",
  password: "0SrmU4cw8c0M6EIeSKPM",
  database: "bu8525zb8ofvspeq8d4r",
});

// Сервер

server.listen(port, function () {
  console.log("node express work on 3100");
});

// Сервер

server.get("/categories", function (req, res) {
  console.log("Есть ЗАПРОС!!!");

  connection.query(
    "SELECT * FROM Category",

    function (error, result, fields) {
      if (error) throw error;

      res.json(JSON.parse(JSON.stringify(result)));
    }
  );
});

server.get("/products", function (req, res) {
  console.log("Есть ЗАПРОС products__");

  connection.query(
    "SELECT * FROM Products where category_id=" + req.query.id + "",

    function (error, result, fields) {
      if (error) throw error;

      res.json(JSON.parse(JSON.stringify(result)));
    }
  );
});

server.post("/productsinthecard", function (req, res) {
  console.log("POST 2222222222222222222222222", req.body);

  if (req.body.key.length != 0) {
    connection.query(
      "SELECT * FROM Products WHERE id IN (" + req.body.key.join(",") + ")",
      function (error, result, fields) {
        if (error) throw error;
        console.log(result);
        let goods = {};
        for (let i = 0; i < result.length; i++) {
          goods[result[i]["id"]] = result[i];
        }
        res.json(goods);
      }
    );
  } else {
    console.log("ПУСТООООООООООООООООООООООООООООООООООООООООО");
    res.json({});
  }
});

server.post("/finishorder", function (req, res) {
  console.log("FINISH ORDERRRRRRRRRRRRRRRRRR", req.body);

  const orderID = Math.floor(Math.random() * 9999);

  console.log("req.body.key.length", Object.keys(req.body.key));

  if (Object.keys(req.body.key).length) {
    let key = Object.keys(req.body.key);
    connection.query(
      "SELECT * FROM Products WHERE id IN (" + key.join(",") + ")",

      function (error, result, fields) {
        if (error) throw error;
        console.log("result SELECT INTO Products", result);

        saveOrder(req.body, result, orderID);
        console.log("orderID", orderID);

        res.json(orderID);
      }
    );
  } else {
    res.send(false);
  }
});

function saveOrder(data, result, orderID) {
  // data - информация о пользователе
  // result - сведения о товаре

  let selectUserSql = "SELECT * FROM User WHERE user_email = '" + data.email + "'";

  connection.query(selectUserSql, function (error, resultUserSelect) {
    if (error) throw error;
    console.log("_____________________email", resultUserSelect);
    console.log("_____________________email", resultUserSelect.length);
    date = new Date() / 1000;

    if (resultUserSelect.length) {
      let userId = resultUserSelect[0]["id"];

      for (let i = 0; i < result.length; i++) {
        insertOrderSql =
          "INSERT INTO Orders (date, user_id, product_id, product_price, product_amount, order_total,order_id) VALUES (" +
          date +
          "," +
          userId +
          "," +
          result[i]["id"] +
          "," +
          result[i]["price"] +
          "," +
          data.key[result[i]["id"]] +
          "," +
          data.key[result[i]["id"]] * result[i]["price"] +
          "," +
          orderID +
          ")";
        connection.query(insertOrderSql, function (error, resultQuery) {
          if (error) throw error;
          console.log("1 ORDER saved", resultQuery);
        });
      }
    } else {
      insertUserSql =
        "INSERT INTO User (user_name, user_email, user_address, user_phone, user_login) VALUES ('" +
        data.name +
        "','" +
        data.email +
        "','" +
        data.address +
        "','" +
        data.phone +
        "','" +
        data.name +
        "')";

      connection.query(insertUserSql, function (error, insertUserResult) {
        if (error) throw error;
        console.log("1 user info saved");
        console.log("input INTO User", insertUserResult);

        let userId = insertUserResult.insertId;

        for (let i = 0; i < result.length; i++) {
          insertOrderSql =
            "INSERT INTO Orders (date, user_id, product_id, product_price, product_amount, order_total,order_id) VALUES (" +
            date +
            "," +
            userId +
            "," +
            result[i]["id"] +
            "," +
            result[i]["price"] +
            "," +
            data.key[result[i]["id"]] +
            "," +
            data.key[result[i]["id"]] * result[i]["price"] +
            "," +
            orderID +
            ")";
          connection.query(insertOrderSql, function (error, resultQuery) {
            if (error) throw error;
            console.log("1 ORDER saved", resultQuery);
          });
        }
      });
    }
  });
}

server.get("/getorders", function (req, res) {
  console.log("Есть ЗАПРОС GET ORDERS__");

  let productsInvolved = [];
  let resultObject = {};
  resultObject.products = {};

  const selectOrdersSql =
    "SELECT Orders.id, Orders.order_total, Orders.user_id, Orders.product_id, Orders.product_amount, Orders.order_id FROM Orders inner join User on Orders.user_id = User.id where User.user_email='" +
    req.query.email +
    "'";

  console.log("---------------------------------selectOrdersSql", selectOrdersSql);

  connection.query(selectOrdersSql, function (error, selectedOrdersResult) {
    if (error) throw error;

    console.log("---------------------------------selectOrdersSql", selectedOrdersResult);

    if (selectedOrdersResult.length) {
      selectedOrdersResult.forEach((order) => {
        if (!productsInvolved.includes(order["product_id"])) {
          productsInvolved.push(order["product_id"]);
        }

        if (!resultObject[order["order_id"]]) {
          resultObject[order["order_id"]] = [];
          let product = {};
          product[order["product_id"]] = order["product_amount"];

          resultObject[order["order_id"]].push(product);
        } else {
          let product = {};
          product[order["product_id"]] = order["product_amount"];
          resultObject[order["order_id"]].push(product);
        }
      });

      const selectProductsSql = "SELECT * FROM Products WHERE id IN (" + productsInvolved.join(",") + ")";

      connection.query(selectProductsSql, function (error, selectedProductsResult) {
        if (error) throw error;

        console.log("---------------------------------selectedProductsResult", selectedProductsResult);

        selectedProductsResult.forEach((product) => {
          resultObject.products[product.id] = product;
        });
        res.json(JSON.parse(JSON.stringify(resultObject)));
      });
    } else {
      res.send("False");
    }
  });
});

server.get("/coupons", function (req, res) {
  console.log("Есть ЗАПРОС coupons_____________________________");

  connection.query(
    "SELECT * FROM Coupons",

    function (error, resultCoupons, fields) {
      if (error) throw error;

      console.log(resultCoupons);

      res.json(JSON.parse(JSON.stringify(resultCoupons)));
    }
  );
});

server.post("/coupons", function (req, res) {
  console.log("POST COUPONSSSSSSSSSSSS", req.body);

  if (req.body.coupon.length > 0) {
    const selectCouponSql = "SELECT coupon_value FROM Coupons WHERE coupon_code = " + req.body.coupon + "";

    console.log("selectCouponSql", selectCouponSql);

    connection.query(selectCouponSql, function (error, resultSelectCoupon) {
      console.log("resultSelectCoupon", resultSelectCoupon);

      if (error) {
        res.json("error: error");
      } else {
        if (resultSelectCoupon != undefined && resultSelectCoupon[0]) {
          res.json(resultSelectCoupon);
        } else {
          res.json("error: error");
        }
      }
    });
  } else {
    res.json("error: empty query");
  }
});

server.post("/favourites", function (req, res) {
  console.log("POST !!!!!!!!!!!!!!!!!!!!!! favourites", req.body);

  if (req.body.fav_products.length != 0) {
    connection.query(
      "SELECT * FROM Products WHERE id IN (" + req.body.fav_products.join(",") + ")",
      function (error, result, fields) {
        if (error) throw error;
        console.log(result);

        res.json(result);
      }
    );
  } else {
    console.log("ПУСТООООООООООООООООООООООООООООООООООООООООО");
    res.json({});
  }
});

server.get("/online", function (req, res) {
  console.log("ONLINE !!!!!!!!!!");

  const fiveMin = 300000;
  const dateFrom = Date.now() - fiveMin;

  const sqlSelectOnline = 'SELECT * FROM Online WHERE date >"' + dateFrom + '"';
  console.log(">>>>>>>>>>>> sqlInsert", sqlSelectOnline);

  connection.query(sqlSelectOnline, function (error, resultOnline) {
    if (error) throw error;

    console.log(">>>>>>>>>>>> resultOnline", resultOnline);
    res.json(JSON.parse(JSON.stringify(resultOnline.length)));
  });
});
