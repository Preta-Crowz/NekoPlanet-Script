
import { stringify } from "@kilcekru/lua-table";
import { parse } from "@kilcekru/lua-table";
import net from 'net';

const options = {
	emptyTables: "object", // Parse empty tables as object or array
	booleanKeys: false, // Allow boolean keys in tables
	mixedKeyTypes: false, // Allow tables with string and numeric keys
	nonPositiveIntegerKeys: false, // Allow numeric keys that are not positive integers
	sparseArray: true, // Allow sparse arrays
}






var server = net.createServer(async (socket) => { // doeTCP 서버를 만든다.
  let buf = Buffer.alloc(0);
  let pending = null;

  socket.on("data", chunk => {
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
  });

  const sendCommand = (sock, cmd) => {
    const payload = stringify(cmd);
    const header = (payload.length+"").padStart(5, "0")
    return new Promise((resolve, reject) => {
      pending = resolve;
      socket.write(header + payload, err => {
        if (err) {
          pending = null;
          reject(err);
        }
      });
    });
  }


  const resp = await sendCommand(socket, {"cmd": "identify", "args": []})
  console.log(resp);
});

server.on('error', (err) => { // 네트워크 에러 처리
  console.log(err);
});

server.listen(23587, "0.0.0.0", () => {
  console.log('listen', server.address());
});