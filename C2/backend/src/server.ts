import net, {Socket} from "node:net";
import { EventEmitter } from 'node:events';
import { robots } from "./robot.js";
import { parse, stringify } from "@kilcekru/lua-table";
import { farmLogic } from "./farm.js";

const options = {
	emptyTables: "object" as const, // Parse empty tables as object or array
	booleanKeys: false, // Allow boolean keys in tables
	mixedKeyTypes: false, // Allow tables with string and numeric keys
	nonPositiveIntegerKeys: false, // Allow numeric keys that are not positive integers
	sparseArray: true, // Allow sparse arrays
}


export class Session extends EventEmitter {
    socket: Socket;
    buf: Buffer
    pending?: ((data: any) => void) | undefined;

    constructor(socket: Socket) {
        super()
        this.socket = socket;
        this.buf = Buffer.alloc(0);
        socket.on("data", this.onData);
        socket.on("end", () => {
            this.emit("end");
        })
    }

    onData = (chunk: Buffer) => {
        try {
            this.buf = Buffer.concat([this.buf, chunk]);

            while (this.buf.length >= 5) {
                const len = parseInt(this.buf.slice(0, 5).toString(), 10);
                if (this.buf.length < 5 + len) break;

                const payload = this.buf.slice(5, 5 + len).toString();
                this.buf = this.buf.slice(5 + len);
                if (this.pending) {
                    const parsed = parse(payload, options);
                    console.log(parsed);
                    this.pending(parsed);
                    this.pending = undefined;
                }
            }
        } catch (e) {
            console.error(e); 
        }
    }

    sendCommand = (cmd: string, ...args: any[]): Promise<any> => {
        const payloadCmd = {"cmd": cmd, "args": args};
        console.log(payloadCmd);
        const payload = stringify(payloadCmd);
        const header = (payload.length+"").padStart(5, "0")
        return new Promise((resolve, reject) => {
            this.pending = resolve;
            if (this.socket.destroyed) {
                reject("socket closed");
                return;
            }
            try {
                this.socket.write(header + payload, err => {
                    if (err) {
                        this.pending = undefined;
                        reject(err);
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }
}

var server = net.createServer(async (socket) => { // doeTCP 서버를 만든다.
  try {
    
    const session = new Session(socket);
    let resp = await session.sendCommand("identify");
    const handler = robots[resp.type];
    if (handler == null) {
        socket.end();
        return
    }
    await handler?.attachSession(session);
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

await farmLogic();
