import { drone, worker, storage, translocator, Robot } from "./robot"
import type { CropCheckResult, Crop, Block } from "./crop"
import type { BlockData, WorkArea } from "./workarea"

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
    const {status} = await drone?.sendCommand("get", 2, count);
    if (status == 0) {
        (async () => { 
            await droneMove(63.5, 136, 17.5);
            drone.releaseMutex();
        })();
        return;
    }
    await droneMove(wx, wy+1, wz);
    await drone?.sendCommand("put", targetSlot + 4, count);

    (async () => { 
        await droneMove(63.5, 136, 17.5);
        drone.releaseMutex();
    })();
}


export const plantDefaultCrop = async (target: Robot, failIfNotEnoughAndDroneLocked = false): Promise<boolean> => {
    const current = await checkCrop(target);
    if (current.name === "IC2:blockCrop" && (current as Crop)["crop:name"] !== undefined) {
        return false;
    }
    if (!(current.name == "IC2:blockCrop" || current.name === "minecraft:air")) {
        return false;
    }
    if (target.currentTool == 14) await target.returnTool();
    if (await getNumberOfItems(target, 14) < 1) {
        if (drone.hasLock() && failIfNotEnoughAndDroneLocked) {
            console.log("Drone locked");
            return false;
        }
        await giveDrawerToWorker(target, sugarCanePos, 14, 16);
    }

    if (current.name === "minecraft:air") {
        const succ =  await plantCrop(target, false, failIfNotEnoughAndDroneLocked);
        if (!succ) return false;
    }

    await target.useTool(14); // use crop.
    const {status }  = await target.sendCommand("place")
    return status == true;
}

const getNumberOfItems = async (target: Robot, slot: number): Promise<number> => {
    const {count} =  await target?.sendCommand("count", slot);
    return count;
}

export const plantCrop = async (target: Robot, double: boolean = false, failIfNotEnoughAndDroneLocked = false): Promise<boolean> => {
    if (target.currentTool == 13) await target.returnTool();
    if (await getNumberOfItems(target, 13) < (double ? 2 : 1)) {
        if (failIfNotEnoughAndDroneLocked && drone.hasLock()) {
            console.log("Drone locked");
            return false;
        }
        await giveDrawerToWorker(target, cropPos, 13, 48);
    }

    await target.useTool(13);
    const {status }  = await target.sendCommand("place")
    if (double && status == true) await target.sendCommand("use", 0, false)
    return status == true;
}
export const plantDoubleCrop = async (target: Robot, failIfNotEnoughAndDroneLocked = false): Promise<boolean> => {
    if (target.currentTool == 13) await target.returnTool();
    if (await getNumberOfItems(target, 13) < 1) {
        if (failIfNotEnoughAndDroneLocked && drone.hasLock()) {
            console.log("Drone locked");
            return false;
        }
        await giveDrawerToWorker(target, cropPos, 13, 48);
    }

    await target.useTool(13);
    const {status} =  await target.sendCommand("use", 0, false)
    return status == true;
}


export const blockExistsBelow = async (target: Robot): Promise<boolean> => {
    const {canNotMove, name} =  await target?.sendCommand("detect", 0);
    return name != "air"
}

export const checkCrop = async (target: Robot): Promise<Crop | Block> => {
    const result: CropCheckResult = await target.sendCommand("checkCrop")!!;
    return result.data;
}

export const moveWorker = async (target: Robot, x: number, y: number, z: number) => {
    await target.sendCommand("moveTo", x, y, z);
}

export const moveDroneToEmpty = async (target: Robot, workarea: WorkArea): Promise<boolean> => {
    // iterate and find empty.
    await target.acquireMutex();

    for (const pos of workarea.getIteratorOfBlockPositions()) {
        const block = workarea.getBlock(pos.x, pos.z);
        if (block.data?.name === "minecraft:air" && block.canPlant) {
            await moveWorker(target, pos.x, pos.y, pos.z);
            // check if relally empty.
            const crop = await checkCrop(target);
            if (crop.name === "minecraft:air") {
                target.releaseMutex();
                return true;
            } else {
                block.data = crop;
                block.lastChecked = new Date().getTime();
            }
        }
    }
    target.releaseMutex();
    return false;
}

export  const attackAndTakeCareOfInventory = async (target: Robot) => {
    await target.useTool(15);
    await target.chooseSlot(1)
    await target.sendCommand("attack");
    for (let i = 1; i <= 12; i++) {
        const {count} = await target.sendCommand("count", i);
        if (count > 0) {
            await target.sendCommand("dropBelow", i)
        }
    }
}


// assume drone at translocator.
const translocate = async (from: Robot): Promise<() => Promise<void>> => {
    const {x: wx,y: wy,z: wz} = await from?.sendCommand("getPosition");

    const stage1 = async () => {
        await drone?.sendCommand("chooseSlot", 1);
        await droneMove(wx, wy+1, wz);
    }
    await Promise.all([stage1(), from.returnTool()]);

    await drone?.sendCommand("put", 20, 1);
    await from.useTool(16);
    if (await blockExistsBelow(from)) {
        await from?.sendCommand("use",0 ,true);
    } else {
        await from?.sendCommand("use",0 ,false);
    }
    await from.returnTool();
    await Promise.all([
        drone?.sendCommand("get", 20, 1),
        translocator?.sendCommand("redstone", 0, 15)
    ]);

    const cleanup = async () => {
        await Promise.all([
            translocator?.sendCommand("redstone", 0, 0),
            droneMove(transPos.x, transPos.y, transPos.z)
        ]);
        await drone?.sendCommand("put", 20, 1);
        await translocator?.useTool(16);
        await translocator?.sendCommand("use", 0, true);
        await translocator?.returnTool();
        await drone?.sendCommand("get", 20, 1);
    }
    return cleanup;
}


export const prepareTranslocator = async () => {
    await translocator?.sendCommand("move", 1)
    await translocator?.sendCommand("move", 3)
    await translocator?.sendCommand("turnLeft")
    await translocator?.sendCommand("move", 3)
    await translocator?.sendCommand("move", 3)
}

export const returnTranslocator = async () => {
    await translocator.acquireMutex();
    await translocator?.sendCommand("move", 2)
    await translocator?.sendCommand("chooseSlot", 1)
    await translocator?.sendCommand("move", 2)
    await translocator?.sendCommand("turnRight")
    await translocator?.sendCommand("move",2)
    await translocator?.sendCommand("move",0)
    translocator.releaseMutex();
}

export const workingFarmMove = async (from: Robot, x: number, y: number, z: number, block: BlockData) => {
    await drone.acquireMutex();
    await from.acquireMutex();
    await translocator.acquireMutex();
    const cleanup = await translocate(from);
    const workerJob = async () => {

        const succ = await plantCrop(worker, true, true); // if worker doesn't have enough crop, then it will fail. :D
        block.data = await checkCrop(worker);
        if (succ)
            block.isDouble = true;
        else
            block.isDouble = false; 

        await moveWorker(from, x, y, z);
        await attackAndTakeCareOfInventory(from);
    }
    
    await Promise.all([
        workerJob(), cleanup()
    ])
    
    const cleanup2 = await translocate(from);
    from.releaseMutex();
    
    const doRemaining = async () => {
        const returnDrone = async () => {
            await droneMove(63.5, 136, 17.5);
            drone.releaseMutex();
        }

        await cleanup2();
        returnDrone();
        translocator.releaseMutex();
    }
    doRemaining();

    return true;
}

export const moveBlock = async (from: Robot, to: Robot): Promise<boolean> => {
    await drone.acquireMutex();
    await from.acquireMutex();
        await translocator.acquireMutex();

    const cleanup = await translocate(from);
    from.releaseMutex();

    const doRemaining = async () => {
        await cleanup();
        await to.acquireMutex();
        const cleanup2 = await translocate(to);
        to.releaseMutex();

        const returnDrone = async () => {
            await droneMove(63.5, 136, 17.5);
            drone.releaseMutex();
        }

        await cleanup2();
        returnDrone();
        translocator.releaseMutex();
    }

    doRemaining();


    return true;
}

export const checkEnergy = async (target: Robot): Promise<{energy: number, maxEnergy: number}> => {
    const {energy, maxEnergy} = await target?.sendCommand("getEnergy");
    return {energy, maxEnergy};
}

export const swapBlock = async (from: Robot, to: Robot): Promise<boolean> => {


    await translocator.acquireMutex();
    await drone.acquireMutex();
    await from.acquireMutex();
    
    await (await translocate(from))();
    await to.acquireMutex();
    await (await translocate(to))();
    to.releaseMutex();
    const cleanup = await translocate(from);
    from.releaseMutex();

    const returnDrone = async () => {
        await droneMove(63.5, 136, 17.5);
        drone.releaseMutex();
    }
    
    const returnTrans = async () => {
        await cleanup();
        returnDrone();
        translocator.releaseMutex();
    }


    returnTrans();
    

    return true;
}
