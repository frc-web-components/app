const http = require("http");
const { readFile, existsSync } = require("fs");
const path = require("path");
const { getAssetPaths } = require('./plugins');

// const pagesPath = path.join(__dirname, "assets1");
// const cssPath = path.join(__dirname, "assets2");

// let staticAssetPaths = [pagesPath, cssPath];

async function getFilePath(relativePath) {
  const assetPaths = await getAssetPaths();
  for (let rootPath of assetPaths) {
    const fullPath = path.join(rootPath, relativePath);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }
  return undefined;
}

function getContentType(filePath) {
  const extname = path.extname(filePath);
  switch (extname) {
    case ".js":
      return "text/javascript";
    case ".css":
      return "text/css";
    case ".json":
      return "application/json";
    case ".png":
      return "image/png";
    case ".jpg":
      return "image/jpg";
    case ".wav":
      return "audio/wav";
    default:
      return "text/html";
  }
}

function addCorsHeaders(response) {
  // Website you wish to allow to connect
  response.setHeader("Access-Control-Allow-Origin", "*");
  // Request methods you wish to allow
  response.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  // Request headers you wish to allow
  response.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  response.setHeader("Access-Control-Allow-Credentials", true);
}

function updateStaticAssetPaths(assetPaths) {
  staticAssetPaths = assetPaths;
}

async function serveStaticAsset(request, response) {
  const relativePath = request.url.substring(7);
  console.log('relativePath:', relativePath);
  const filePath = await getFilePath(relativePath);
  if (!filePath) {
    response.writeHead(404);
    response.end("", "utf-8");
    return;
  }
  const contentType = getContentType(filePath);
  console.log("request:", request.url, filePath);

  readFile(filePath, function (error, content) {
    if (error) {
      if (error.code == "ENOENT") {
        readFile("./404.html", function (error, content) {
          response.writeHead(404);
          response.end("", "utf-8");
        });
      } else {
        response.writeHead(500);
        response.end(
          "Sorry, check with the site admin for error: " + error.code + " ..\n"
        );
        response.end();
      }
    } else {
      response.writeHead(200, { "Content-Type": contentType });
      response.end(content, "utf-8");
    }
  });
}

function startServer() {
  http
    .createServer(function (request, response) {
      addCorsHeaders(response);
      if (request.url.startsWith("/assets/")) {
        serveStaticAsset(request, response);
      } else {
        response.writeHead(404);
        response.end("", "utf-8");
      }
    })
    .listen(8125);
  console.log("Server running at http://127.0.0.1:8125/");
}

module.exports = { updateStaticAssetPaths, startServer };
