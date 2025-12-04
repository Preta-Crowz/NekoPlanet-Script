import { drone, worker, storage, translocator, Robot } from "./robot"
import type { CropCheckResult, Crop, Air, Block } from "./crop"

const cropPos = {x: 64, y: 136, z: 14}
const sugarCanePos = {x: 64, y: 136, z: 13}
const transPos = {x: 65, y: 138, z: 17}

export const droneMove = async (x: number, y: number, z: number) => {
    const {x: dx,y: dy,z: dz} = await drone?.sendCommand("getPosition");
    await drone?.sendCommand("moveTo", dx, 138.5, dz);
    await drone?.sendCommand("moveTo", x+0.5, 138.5, z+0.5);
    await drone?.sendCommand("moveTo", x+0.5, y+0.5, z+0.5);
}

type Position = {x: number, y:number, z: number}



export const giveDrawerToWorker = async (target: Robot, drawerPos: Position, targetSlot: number, count: number) => {
    const {x: wx,y: wy,z: wz} = await target?.sendCommand("getPosition");
    
    await drone.acquireMutex();
    
    await droneMove(drawerPos.x, drawerPos.y+1, drawerPos.z);
    await drone?.sendCommand("chooseSlot", 2);
    await drone?.sendCommand("getInventory");
    await drone?.sendCommand("get", 2, count);
    await droneMove(wx, wy+1, wz);
    await drone?.sendCommand("put", targetSlot + 4, count);

    (async () => { 
        await droneMove(64, 136, 17)
        drone.releaseMutex();
    })();
}


export const plantDefaultCrop = async (target: Robot): Promise<boolean> => {
    const current = await checkCrop(target);
    if (current.name === "IC2:blockCrop" && (current as Crop).cropname == undefined) {
        return false;
    }
    if (!(current.name == "IC2:blockCrop" || current.name === "minecraft:air")) {
        return false;
    }
    if (await getNumberOfItems(target, 12) < 1) {
        await giveDrawerToWorker(target, sugarCanePos, 12, 16);
    }

    if (current.name === "minecraft:air") {
        const succ =  await plantCrop(target);
        if (!succ) return false;
    }

    await target.sendCommand("chooseSlot", 12);
    await target.sendCommand("swap")
    const {status }  = await target.sendCommand("place")
    await target.sendCommand("swap")
    return status == true;
}

const getNumberOfItems = async (target: Robot, slot: number): Promise<number> => {
    const {count} =  await target?.sendCommand("count", slot);
    return count;
}

export const plantCrop = async (target: Robot, double: boolean = false): Promise<boolean> => {
    if (await getNumberOfItems(target, 13) < (double ? 2 : 1)) {
        await giveDrawerToWorker(target, cropPos, 13, 16);
    }

    await target.sendCommand("chooseSlot", 13);
    await target.sendCommand("swap")
    const {status }  = await target.sendCommand("place")
    if (double && status == true) await target.sendCommand("place")
    await target.sendCommand("swap")
    return status == true;
}

export const blockExistsBelow = async (target: Robot): Promise<boolean> => {
    const {canNotMove, name} =  await target?.sendCommand("detect", 0);
    return name != "air"
}

export const checkCrop = async (target: Robot): Promise<Crop | Block | Air> => {
    const result: CropCheckResult = await target.sendCommand("checkCrop")!!;
    return result.data;
}


// assume drone at translocator.
const translocate = async (from: Robot) => {
    const {x: wx,y: wy,z: wz} = await from?.sendCommand("getPosition");

    await drone?.sendCommand("chooseSlot", 1);
    await translocator?.sendCommand("chooseSlot", 16)
    await drone?.sendCommand("put", 20, 1);
    await translocator?.sendCommand("swap");
    await translocator?.sendCommand("place");
    await translocator?.sendCommand("swap");
    await drone?.sendCommand("get", 20, 1);

    await droneMove(wx, wy+1, wz);
    await from?.sendCommand("chooseSlot", 16)
    await drone?.sendCommand("put", 20, 1);
    await from?.sendCommand("swap");
    await from?.sendCommand("place");
    await translocator?.sendCommand("redstone", 0, 15);
    await from?.sendCommand("swap");
    await drone?.sendCommand("get", 20, 1);
    await translocator?.sendCommand("redstone", 0, 0);
}


export const moveBlock = async (from: Robot, to: Robot): Promise<boolean> => {


    const bringTrans = async() => {
        await translocator.acquireMutex();
        await translocator?.sendCommand("move", 1)
        await translocator?.sendCommand("move", 3)
        await translocator?.sendCommand("turnLeft")
        await translocator?.sendCommand("move", 3)
        await translocator?.sendCommand("move", 3)
    }
    const returnTrans = async() => {

        await translocator?.sendCommand("move", 2)
        await translocator?.sendCommand("chooseSlot", 1)
        await translocator?.sendCommand("attack")
        await translocator?.sendCommand("move", 2)
        await translocator?.sendCommand("turnRight")
        await translocator?.sendCommand("move",2)
        await translocator?.sendCommand("move",0)

        translocator.releaseMutex();
    }

    await drone.acquireMutex();

    await Promise.all([droneMove(transPos.x, transPos.y, transPos.z), bringTrans()]);
    await translocate(from);
    await droneMove(transPos.x, transPos.y, transPos.z);
    await translocate(to);

    const returnDrone = async () => {
        await droneMove(64, 136, 17);
        drone.releaseMutex();
    }

    returnDrone()
    returnTrans()

    return true;
}

export const cleanupRobotInventory = async (robot: Robot) => {

}


export const swapBlock = async (from: Robot, to: Robot): Promise<boolean> => {


    const bringTrans = async() => {
        await translocator.acquireMutex();
        await translocator?.sendCommand("move", 1)
        await translocator?.sendCommand("move", 3)
        await translocator?.sendCommand("turnLeft")
        await translocator?.sendCommand("move", 3)
        await translocator?.sendCommand("move", 3)
    }
    const returnTrans = async() => {
        await translocator?.sendCommand("move", 2)
        await translocator?.sendCommand("chooseSlot", 1)
        await translocator?.sendCommand("attack")
        await translocator?.sendCommand("move", 2)
        await translocator?.sendCommand("turnRight")
        await translocator?.sendCommand("move",2)
        await translocator?.sendCommand("move",0)

        translocator.releaseMutex();
    }

    await drone.acquireMutex();

    await Promise.all([droneMove(transPos.x, transPos.y, transPos.z), bringTrans()]);
    await translocate(from);
    await droneMove(transPos.x, transPos.y, transPos.z);
    await translocate(to);
    await droneMove(transPos.x, transPos.y, transPos.z);
    await translocate(from);

    const returnDrone = async () => {
        await droneMove(64, 136, 17);
        drone.releaseMutex();
    }

    returnDrone();
    returnTrans();


    return true;
}
