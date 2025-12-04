import type { Session } from "./server.js";
import fs from 'node:fs';
import { Mutex } from "async-mutex";

export let robots: Record<string, Robot> = {}

export class Robot {
    name: string;
    file: string;
    session?: Session | undefined;
    promise: Promise<void>;
    resolve?: () => void;
    connected: boolean;
    mutex: Mutex = new Mutex();

    constructor(name: string, file: string) {
        this.name = name;
        this.file = file;
        this.promise = new Promise((resolve) => this.resolve = resolve);
        this.connected = false;
    }


    sendCommand = async (cmd: string, ...args: any[]): Promise<any> => {
        await this.promise;
        return await this.session?.sendCommand(cmd, ...args);
    }

    acquireMutex = async () => {
        return await this.mutex.acquire();
    }

    releaseMutex = () => {
        this.mutex.release();
    }

    attachSession = async (socket: Session) => {
        this.session = socket;
        this.connected = true;
        socket.on("end", () => {
            this.connected = false;
            this.promise = new Promise((resolve) => this.resolve = resolve);
        })

        await this.session.sendCommand("load", fs.readFileSync(this.file).toString())     

        if (this.resolve) this.resolve();
    }
}


const registerRobot = (name: string, file: string) => {
  robots[name] = new Robot(name, file);
}
registerRobot("drone", "lua/actions_drone.lua")
registerRobot("worker", "lua/actions_robot.lua")
registerRobot("storage", "lua/actions_robot.lua")
registerRobot("translocator", "lua/actions_robot.lua")


export const drone: Robot = robots["drone"]!!;
export const worker : Robot= robots["worker"]!!;
export const storage: Robot = robots["storage"]!!;
export const translocator: Robot = robots["translocator"]!!;