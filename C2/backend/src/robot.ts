import type { Session } from "./server.js";
import fs from 'node:fs';
import { Mutex } from "async-mutex";

export let robots: Record<string, Robot> = {}

const withTimeout = <T>(millis: number, promise: Promise<T>): Promise<T> => {
    let timeoutPid: NodeJS.Timeout | null = null;
    const timeout = new Promise<T>((resolve, reject) =>
        timeoutPid = setTimeout(
            () => reject(`Timed out after ${millis} ms.`),
            millis));
    return Promise.race([
        promise,
        timeout
    ]).finally(() => {
        if (timeoutPid) {
            clearTimeout(timeoutPid);
        }
    });
};

export class Robot {
    name: string;
    file: string;
    session?: Session | undefined;
    promise: Promise<void>;
    responseQueue: Promise<any>[] = [];
    resolve?: () => void;
    connected: boolean;
    mutex: Mutex = new Mutex();
    currentTool = -1;     
    currentChosenSlot = -1;

    constructor(name: string, file: string) {
        this.name = name;
        this.file = file;
        this.promise = new Promise((resolve) => this.resolve = resolve);
        this.connected = false;
    }


    sendCommand = async (cmd: string, ...args: any[]): Promise<any> => {
        // always timeout of 20 seconds.
        await this.promise;
        console.log(`[${Date.now()}] [${this.name.padEnd(15)}] REQ `, {"cmd": cmd, "args": args});
        const resp = await withTimeout(20000, this.session!.sendCommand(cmd, ...args));
        console.log(`[${Date.now()}] [${this.name.padEnd(15)}] RESP `, resp);
        return resp;
    }

    sendCommandWithRetry = async (cmd: string, ...args: any[]): Promise<any> => {
        const maxRetries = 3;
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                return await this.sendCommand(cmd, ...args);
            } catch (error) {
                console.error(`Error sending command '${cmd}' (attempt ${attempt + 1}):`, error);
                attempt++;
                if (attempt >= maxRetries) {
                    throw new Error(`Failed to send command '${cmd}' after ${maxRetries} attempts.`);
                }
            }
        }
    }

    acquireMutex = async () => {
        return await this.mutex.acquire();
    }

    releaseMutex = () => {
        this.mutex.release();
    }

    hasLock = (): boolean => {
        return this.mutex.isLocked();
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


    chooseSlot = async (slot: number) => {
        if (this.currentChosenSlot !== slot) {
            await this.sendCommand("chooseSlot", slot);
            this.currentChosenSlot = slot;
        }
    }

    useTool = async (toolSlot: number) => {
        if (this.currentTool !== toolSlot) {
            await this.returnTool();
            await this.chooseSlot(toolSlot);
            await this.sendCommand("swap");
            this.currentTool = toolSlot;
        }
    }

    returnTool = async () => {
        if (this.currentTool !== -1) {
            await this.chooseSlot(this.currentTool);
            await this.sendCommand("swap");
            this.currentTool = -1;
        }
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