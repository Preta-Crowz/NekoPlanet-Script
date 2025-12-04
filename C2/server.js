
import { stringify } from "@kilcekru/lua-table";
import { parse } from "@kilcekru/lua-table";
import net from 'net';
import fs from 'fs';

const options = {
	emptyTables: "object", // Parse empty tables as object or array
	booleanKeys: false, // Allow boolean keys in tables
	mixedKeyTypes: false, // Allow tables with string and numeric keys
	nonPositiveIntegerKeys: false, // Allow numeric keys that are not positive integers
	sparseArray: true, // Allow sparse arrays
}

let robots = {
  drone: {socket: null, file: "actions_drone.lua", sendCommand: async (cmd) => { throw ""; }},
  worker: {socket: null, file: "actions_robot.lua", sendCommand: async (cmd) => { throw ""; }},
  storage: {socket: null, file: "actions_robot.lua", sendCommand: async (cmd) => { throw ""; }},
  translocator: {socket: null, file: "actions_robot.lua", sendCommand: async (cmd) => { throw ""; }}
}

const delay = (t, val) => new Promise(resolve => setTimeout(resolve, t, val));

const handle = async (socket) => {
  let buf = Buffer.alloc(0);
  let pending = null;

  socket.on("data", chunk => {
    try {
      buf = Buffer.concat([buf, chunk]);

      while (buf.length >= 5) {
        const len = parseInt(buf.slice(0, 5).toString(), 10);
        if (buf.length < 5 + len) break;

        const payload = buf.slice(5, 5 + len).toString();
        buf = buf.slice(5 + len);
        if (pending) {
          pending(parse(payload, options));
          pending = null;
        }
      }
    } catch (e) {
      console.err(e); 
    }
  });

  const sendCommand = (cmd) => {
    const payload = stringify(cmd);
    const header = (payload.length+"").padStart(5, "0")
    return new Promise((resolve, reject) => {
      pending = resolve;
      if (socket.destroyed) {
        reject("socket closed");
        return;
      }
      try {
        socket.write(header + payload, err => {
          if (err) {
            pending = null;
            reject(err);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }
  console.log("Connected!")

  let resp = await sendCommand({"cmd": "identify", "args": []})
  console.log(resp);

  const handler = robots[resp.type];
  if (handler == null) {
    socket.end();
    return
  }

  resp = await sendCommand({"cmd": "load", "args": [fs.readFileSync(handler.file).toString()]})
  handler.sendCommand = sendCommand;
  console.log(resp);

  while (true) {
    await sendCommand({"cmd": "redstone", "args": [2, 15]});
    await delay(500)
    await sendCommand({"cmd": "redstone", "args": [2, 0]});
    await delay(500)
  }
}

var server = net.createServer(async (socket) => { // doeTCP 서버를 만든다.
  try {
    await handle(socket);
  } catch (e) {
    console.log(e);
  }
});

server.on('error', (err) => { // 네트워크 에러 처리
  console.log(err);
});

server.listen(23587, "0.0.0.0", () => {
  console.log('listen', server.address());
});