module.exports = function (req, res, connection, next) {
  console.log(">>>>>>>>>>>> Middleware");
  console.log(req.cookies.user_id);

  // 1) If no such cookie
  if (req.cookies.user_id == undefined) {
    const hash = makeHash(12);
    const currentTime = Date.now();

    // Generete sql query
    let sqlInsert;
    sqlInsert = "INSERT INTO Online (hash, date) VALUES ('" + hash + "','" + currentTime + "')";
    console.log(">>>>>>>>>>>> sqlInsert", sqlInsert);

    connection.query(sqlInsert, function (error, resultInsert) {
      if (error) reject(error);
      console.log("INSERTED INTO ONLINE >>>>>>>>>>>>", resultInsert);

      // Setting cookie
      res.cookie("user_id", hash, {  expires: new Date(Date.now() + 43_200_000), sameSite: "None", secure: true, domain: "aperegontsev.github.io" });
      next();
    });
  } else {
    // 2) If cookie exist

    const hashFromCookie = req.cookies.user_id;

    // Generete sql query
    let sqlSelect;
    sqlSelect = 'SELECT * FROM Online WHERE hash="' + hashFromCookie + '"';
    console.log(">>>>>>>>>>>> sqlSelect", sqlSelect);

    connection.query(sqlSelect, function (error, resultSelect) {
      if (error) reject(error);
      console.log("SELECTED FROM ONLINE >>>>>>>>>>>>", resultSelect);

      const currentTime = Date.now();

      if (resultSelect.length == 0) {
        let sqlInsert;

        sqlInsert = "INSERT INTO Online (hash, date) VALUES ('" + hashFromCookie + "','" + currentTime + "')";
        console.log(">>>>>>>>>>>> sqlInsert", sqlInsert);

        connection.query(sqlInsert, function (error, resultInsert) {
          if (error) reject(error);
          console.log("INSERTED INTO ONLINE 2>>>>>>>>>>>>", resultInsert);
          next();
        });
      } else {
        sqlUpdate = "UPDATE Online  SET date='" + currentTime + "' WHERE hash= '" + hashFromCookie + "' ";
        console.log(">>>>>>>>>>>> sqlUpdate", sqlUpdate);

        connection.query(sqlUpdate, function (error, resultUpdate) {
          if (error) throw error;
          next();
        });
      }
    });
  }
};

function makeHash(length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
