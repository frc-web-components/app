const { write, onMessage } = require("./communication");
const launchServer = require('./server');

launchServer();

onMessage((line) => {
  write(`read ${line}`);
});

setInterval(() => {
  write(`[${new Date().toLocaleTimeString()}] new message`);
}, 500);
