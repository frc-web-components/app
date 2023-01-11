const { write, onMessage } = require("./communication");
const { startServer } = require('./server');

// https://thisdavej.com/how-to-watch-for-files-changes-in-node-js/

// launchServer();

startServer();

write("args: " + process.argv.join(','));

onMessage((line) => {
  write(`read ${line}`);
});

setInterval(() => {
  // write(`[${new Date().toLocaleTimeString()}] new message`);
}, 500);
