// https://stackoverflow.com/a/14840331

const express = require("express");
const cors = require("cors");
const path = require("path");

let server = null;

function getServer(plugins, port) {
  const app = express();
  app.use(
    cors({
      origin: "*",
    })
  );
  app.get("/", (request, response) => {
    response.send("Hello CSS!!! " + __dirname);
  });
  plugins.forEach((plugin) => {
    app.use("/assets", express.static(plugin.directory));
  });

  const server = app.listen(port, () => {
    console.log(`Server is running on Port ${port}`);
    console.log(__dirname);
  });

  return server;
}

function startServer(plugins, port) {
  if (server) {
    server.close(function () {
      console.log("Doh :(");
    });
  }
  server = getServer(plugins, port);
}

module.exports = () => {
  const pagesPath = path.join(__dirname, "assets1");
  const cssPath = path.join(__dirname, "assets2");
  const port = process.env.PORT || 3000;
  startServer([{ directory: pagesPath }, { directory: cssPath }], port);
};
