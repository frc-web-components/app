// https://stackoverflow.com/a/14840331

const express = require("express");
const cors = require("cors");
const path = require("path");
const pagesPath = path.join(__dirname, "/cheatsheet");
const cssPath = path.join(__dirname, "/stylesheet");
const port = process.env.PORT || 3000;

module.exports = () => {
  var app = express();

  app.use(
    cors({
      origin: "*",
    })
  );

  app.use("/cheatsheet", express.static(pagesPath));
  app.use("/stylesheet", express.static(cssPath));

  app.get("/", (request, response) => {
    response.send("Hello CSS!!! " + __dirname);
  });

  app.get("/bad", (request, response) => {
    response.send({ error: "Bad Request" });
  });

  app.listen(port, () => {
    console.log(`Server is running on Port ${port}`);
    console.log(__dirname);
  });
};
