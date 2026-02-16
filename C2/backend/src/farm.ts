import { drone, Robot, robots, storage, translocator, worker } from "./robot"
import { attackAndTakeCareOfInventory, blockExistsBelow, checkCrop, checkEnergy, moveBlock, moveWorker, plantCrop, plantDefaultCrop, plantDoubleCrop, prepareTranslocator, returnTranslocator, swapBlock, workingFarmMove } from "./actions"
import { loadAllDataFromFile, saveAllDataToFile, storageFarm, WorkArea, type BlockData } from "./workarea";

import { workingFarm } from "./workarea";
import type { Block, Crop } from "./crop";

const restPos = {x: 64, y: 137, z: 16}

const isCrop = (data: Crop|Block): boolean => data.name == "IC2:blockCrop";
const isAir = (data: Crop|Block): boolean => data.name == "minecraft:air";
const isNotPlanted = (data: Crop|Block): boolean => (data as Crop)["crop:name"] == undefined;
const isWeed = (data: Crop|Block): boolean => isCrop(data) && !isNotPlanted(data) 
    && ((data as Crop)["crop:name"] == "weed" 
    || ((data as Crop)["crop:name"] == 'Grass')
    || ((data as Crop)["crop:name"] == 'venomilia' && (data as Crop)["crop:growth"] > 7)
    || ((data as Crop)["crop:growth"] > 23));


const cleanupFarming = async () => {
    storage.mutex.cancel();
    worker.mutex.cancel();
    await worker.acquireMutex();

     // wait for a second to ensure no one is using worker.
    for (const pos of workingFarm.getIteratorOfBlockPositions()) {
        const block = workingFarm.getBlock(pos.x, pos.z);
        await moveWorker(worker, pos.x, workingFarm.y, pos.z);
        const crop = await checkCrop(worker);
        console.log(crop);
        if (isCrop(crop) && isNotPlanted(crop) || isWeed(crop)) {
            await attackAndTakeCareOfInventory(worker);
            block.canPlant = true;
            block.isDouble = false;
            block.data = await checkCrop(worker);
        }
    };
}

const moveDroneToEmpty = async (target: Robot, workarea: WorkArea[]): Promise<boolean> => {
    // iterate and find empty.
    await target.acquireMutex();

    let {y: wy} = await target?.sendCommandWithRetry("getPosition");

    for (const area of workarea) {
        for (const pos of area.getIteratorOfBlockPositions()) {
            const block = area.getBlock(pos.x, pos.z);
            if (block.data?.name === "minecraft:air" && (block.canPlant || block.canPlant == null)) { // 
                if (pos.y !== wy) {
                    await moveWorker(target, 65, wy, 18);
                    await moveWorker(target, 64, wy, 18);
                    await moveWorker(target, 64, pos.y, 18);
                    await moveWorker(target, 65, pos.y, 18);
                    wy = pos.y;
                }

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
    }
    target.releaseMutex();

    await cleanupFarming();

    saveAllDataToFile("farmdata.json");
    process.exit(1);
    return false;
}

export const checkFarm = async (target: Robot, farm: WorkArea, eraseEmpty: boolean) => {
    for (const pos of farm.getIteratorOfBlockPositions()) {
        const previous = farm.getBlock(pos.x, pos.z);
        
        await moveWorker(target, pos.x, pos.y, pos.z);
        let data = await checkCrop(target);
        console.log(data);


        let plantable = isCrop(data) ? true : (isAir(data) ? null : false);
        if (plantable !== null) previous.canPlant = plantable;

        if (previous.canPlant === null) {
            let newCanPlant = null;
            if (isCrop(data)) newCanPlant = true;
            else if (!isAir(data)) newCanPlant = false;

            if (newCanPlant === null) {
                // try planting.
                const planted = await plantCrop(target);
                if (planted) {
                    newCanPlant = true;
                    await attackAndTakeCareOfInventory(worker);
                } else {
                    newCanPlant = false;
                }
            }
            previous.canPlant = newCanPlant;
        }

        if (eraseEmpty && isCrop(data) && isNotPlanted(data)) {
            await attackAndTakeCareOfInventory(worker);
            data = await checkCrop(target);
            previous.isDouble = false;
        }

        let isDouble = isCrop(data) && !isNotPlanted(data) ? false : (isAir(data) ? false : null);
        if (isDouble !== null) previous.isDouble = isDouble;

        if (previous.isDouble === null) {
            if (isCrop(data) && !isNotPlanted(data)) {
                previous.isDouble = false;
            } else if (isAir(data)) {
                previous.isDouble = false;
            } else if (isCrop(data)) {
                // well.... just break and make it not double.
                await attackAndTakeCareOfInventory(target);

                previous.isDouble = false;
                previous.data = null;
                data = await checkCrop(target);
            } else {
                previous.isDouble = false;
            }
        }

        previous.data = data;
        previous.lastChecked = Date.now();
    }
    saveAllDataToFile("farmdata.json");
}

const charge = async () => {

        {
            // move to rest pos and charge.
            await moveWorker(worker, restPos.x, restPos.y, restPos.z);
            // charge fully.
            let {energy, maxEnergy} = await checkEnergy(worker);
            while (energy < maxEnergy-1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const energyInfo = await checkEnergy(worker);
                energy = energyInfo.energy;
            }

            // move worker up rest pos.
            await moveWorker(worker, restPos.x, restPos.y + 1, restPos.z);
        }
        {
            // charge storage.
            
            let {y: wy} = await storage?.sendCommandWithRetry("getPosition");
            await moveWorker(storage, 65, wy, 18);
            await moveWorker(storage, 64, wy, 18);
            await moveWorker(storage, 64, restPos.y, 18);
            await moveWorker(storage, restPos.x, restPos.y, restPos.z);
            let {energy, maxEnergy}= (await checkEnergy(storage));
            console.log(energy, maxEnergy);
            while (energy < maxEnergy-1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const energyInfo = await checkEnergy(storage);
                energy = energyInfo.energy;
            }

            await moveWorker(storage, 64, 137, 18);
            moveDroneToEmpty(storage, storageFarm);
            await moveWorker(worker, restPos.x, restPos.y, restPos.z);
        }
        {
            let {energy, maxEnergy}= (await checkEnergy(translocator));
            console.log(energy, maxEnergy);
            while (energy < maxEnergy-1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const energyInfo = await checkEnergy(storage);
                energy = energyInfo.energy;
            }
        }
}

type DecisionFunction = (x: number, z: number, double: boolean, crop: Crop, block: BlockData) => Promise<void>;



const doubleCropAndStoreData = async (block: BlockData) => {
    const succ = await plantCrop(worker, true, true);
    block.data = await checkCrop(worker);
    if (succ)
        block.isDouble = true;
    else
        block.isDouble = false; 
}

const moveToStorage = async (block: BlockData) => {
    await moveBlock(worker, storage, () => moveDroneToEmpty(storage, storageFarm));
    moveDroneToEmpty(storage, storageFarm)
    // double plant
    await doubleCropAndStoreData(block);
}

const strategySaveAll: DecisionFunction = async (x: number, z: number, double: boolean, crop: Crop, block: BlockData) => {
    moveToStorage(block);
}

const strategyTier: DecisionFunction = async (x: number, z: number, double: boolean, crop: Crop, block: BlockData) => {
    console.log("Strat Tier: Found ", crop, " at ", x, z, " prev: ", block);

    // find lowest tier in working farm.
    let minTier = 9999999;
    let minTierPos = {x: -1, z: -1};
    for (const pos of workingFarm.getIteratorOfBlockPositions()) {
        if ((pos.x + pos.z) % 2 == 0) continue; // only single crop pos
        const b = workingFarm.getBlock(pos.x, pos.z);
        if (isCrop(b.data!!) && !isNotPlanted(b.data!!)) {
            const c = b.data as Crop;
            const t = c["crop:tier"];
            if (t < minTier){
                minTier = t;
                minTierPos = {x: pos.x, z: pos.z};
            };
        } else if (b.data?.name == "minecraft:air" && b.canPlant) {
            // empty spot found, prefer this.
            minTier = -1;
            minTierPos = {x: pos.x, z: pos.z};
            break; 
        }
    }
    console.log("Min tier crop at ", minTierPos, " tier ", minTier);

    if  (crop["crop:resistance"] > 5) {
        console.log("High resistance: action: remove");
        await attackAndTakeCareOfInventory(worker);
        await doubleCropAndStoreData(block);
        return;
    }

    if (crop["crop:tier"] <= minTier) {
        console.log("Seeing Low Tier Crop");
        // check if crop exists in storage farm. with count.
            let count = 0;
            for (const area of storageFarm) {
                for (const pos of area.getIteratorOfBlockPositions()) {
                    const b = area.getBlock(pos.x, pos.z);
                    if (isCrop(b.data!!) && !isNotPlanted(b.data!!) && (b.data as Crop)["crop:name"] == (crop as Crop)["crop:name"]) {
                        count++;    
                    }
                }
            }
            // store.
            if (count > 3) {
                console.log("Found count "+count+", action: remove");
                // three exists, so remove.
                await attackAndTakeCareOfInventory(worker);
                await doubleCropAndStoreData(block);
                return;
            } 
            if (drone.hasLock()) {
                console.log("Drone locked, can't move to storage. Wait for next opportunity.");
                return;
            }
                console.log("Found count "+count+", action: move to storage");
            await moveToStorage(block);
            return;
    }
    if (crop["crop:growth"] > 21) {
        console.log("High growth: action: move to storage");
        if (!drone.hasLock()) await moveToStorage(block);
        return;
    }

    // transplant.
    if (!drone.hasLock()) {
        console.log("Drone doesn't have lock! Checking storage farm count");
        // check if minTierPos crop exists in storage farm. with count.
        let count = 0;
        for (const area of storageFarm) {
            for (const pos of area.getIteratorOfBlockPositions()) {
                const b = area.getBlock(pos.x, pos.z);
                if (isCrop(b.data!!) && !isNotPlanted(b.data!!) && (b.data as Crop)["crop:name"] == (workingFarm.getBlock(minTierPos.x, minTierPos.z).data as Crop)["crop:name"]) {
                    count++;    
                }
            }
        }
        console.log("Count: "+count);
        // store.
        if (count > 3) {
            console.log("Decision: Destroy and swap with min tier crop at ", minTierPos);
            await workingFarmMove(worker, minTierPos.x, workingFarm.y, minTierPos.z, block);
            moveDroneToEmpty(storage, storageFarm)

            workingFarm.getBlock(minTierPos.x, minTierPos.z).data = await checkCrop(worker);
            workingFarm.getBlock(minTierPos.x, minTierPos.z).isDouble = false; 
            return;
        }

        console.log("Decision: Move and swap with min tier crop at ", minTierPos);
        // check.
        await moveBlock(worker, storage, () => moveDroneToEmpty(storage, storageFarm));
        await doubleCropAndStoreData(block);
        await moveWorker(worker, minTierPos.x, workingFarm.y, minTierPos.z);
        await swapBlock(worker, storage);
        workingFarm.getBlock(minTierPos.x, minTierPos.z).data = await checkCrop(worker);
        workingFarm.getBlock(minTierPos.x, minTierPos.z).isDouble = false;
        moveDroneToEmpty(storage, storageFarm)
        // double plant
    } else {
        console.log("Drone has lock. wait for later.");
    }

}


const strategyStat = (cropName: string): DecisionFunction => {
    return async (x: number, z: number, double: boolean, crop: Crop, block: BlockData) => {
        // check if it is the crop.
        if ((crop as Crop)["crop:name"] !== cropName) {
            // check if crop exists in storage farm. with count.
            let count = 0;
            for (const area of storageFarm) {
                for (const pos of area.getIteratorOfBlockPositions()) {
                    const b = area.getBlock(pos.x, pos.z);
                    if (isCrop(b.data!!) && !isNotPlanted(b.data!!) && (b.data as Crop)["crop:name"] == (crop as Crop)["crop:name"]) {
                        count++;    
                    }
                }
            }
            // store.
            // if (count > 3) {
                // three exists, so remove.
                await attackAndTakeCareOfInventory(worker);
                await doubleCropAndStoreData(block);
                return;
            // } 
            // if (drone.hasLock()) {
            //     console.log("Drone locked");
            //     return;
            // }
            // await moveToStorage(block);
            // return;
        }

        let stat = crop["crop:growth"] + crop["crop:gain"] - crop["crop:resistance"];
        // find min stat in working farm
        let minStat = 9999999;
        let minStatPos = {x: -1, z: -1};
        for (const pos of workingFarm.getIteratorOfBlockPositions()) {
        if ((pos.x + pos.z) % 2 == 0) continue; // only single crop pos
            const b = workingFarm.getBlock(pos.x, pos.z);
            if (isCrop(b.data!!) && !isNotPlanted(b.data!!)) {
                const c = b.data as Crop;
                if (c["crop:name"] == cropName) {
                    const s = c["crop:growth"] + c["crop:gain"] - c["crop:resistance"];
                    if (s < minStat){
                        minStat = s;
                        minStatPos = {x: pos.x, z: pos.z};
                    };
                } else {
                    minStat = -1;
                    minStatPos = {x: pos.x, z: pos.z};
                    break; 
                }
            } else if (b.data?.name == "minecraft:air" && b.canPlant) {
                // empty spot found, prefer this.
                minStat = -1;
                minStatPos = {x: pos.x, z: pos.z};
                break; 
            }
        }

        if (stat < minStat || crop["crop:resistance"] > 2) {
            await attackAndTakeCareOfInventory(worker);
            await doubleCropAndStoreData(block);
            return;
        }

        if (crop["crop:growth"] > 21) {
            if (!drone.hasLock()) await moveToStorage(block);
            return;
        }
        // transplant.
        if (!drone.hasLock()) {
            await workingFarmMove(worker, minStatPos.x, workingFarm.y, minStatPos.z, block);
            moveDroneToEmpty(storage, storageFarm)

            workingFarm.getBlock(minStatPos.x, minStatPos.z).data = await checkCrop(worker);
            workingFarm.getBlock(minStatPos.x, minStatPos.z).isDouble = false; 
        }
    }
} 

let currentStrategy: DecisionFunction = strategyStat("Sugar Beet");


export const storeAll = async() => {
    moveDroneToEmpty(storage, storageFarm);
    await prepareTranslocator();
    for (const pos of workingFarm.getIteratorOfBlockPositions()) {
        saveAllDataToFile("farmdata.json");
        await moveWorker(worker, pos.x, pos.y, pos.z);
        const block = workingFarm.getBlock(pos.x, pos.z);
        const crop = await checkCrop(worker);
        block.data = crop;
        if (isWeed(crop)) {
            await attackAndTakeCareOfInventory(worker);
            continue;
        }
        if (isCrop(crop) && isNotPlanted(crop)) {
            await attackAndTakeCareOfInventory(worker);
            continue;
        }
        if (isCrop(crop)) {
            await moveBlock(worker, storage, () => moveDroneToEmpty(storage, storageFarm));
            moveDroneToEmpty(storage, storageFarm);
            block.data = await checkCrop(worker);
            block.isDouble = false; 
        }
    }
    saveAllDataToFile("farmdata.json");
    await returnTranslocator();
}

export const moveCropToWork = async (cropName: string, countNeeded: number) => {
    await prepareTranslocator();
    await storage.acquireMutex();
    storage.releaseMutex();

    let count = 0;
    let {y: wy} = await storage?.sendCommandWithRetry("getPosition");

    const workingFarmPos = workingFarm.getIteratorOfBlockPositions()
        .filter(pos => (pos.x + pos.z) % 2 === 1 && workingFarm.getBlock(pos.x, pos.z).data?.name === "minecraft:air" && workingFarm.getBlock(pos.x, pos.z).canPlant);

    let workFarmIdx = 0;

    for (const area of storageFarm) {
        for (const pos of area.getIteratorOfBlockPositions()) {
            const b = area.getBlock(pos.x, pos.z);
            if (isCrop(b.data!!) && !isNotPlanted(b.data!!) && (b.data as Crop)["crop:name"] == cropName) {
                if (pos.y !== wy) {
                    await moveWorker(storage, 65, wy, 18);
                    await moveWorker(storage, 64, wy, 18);
                    await moveWorker(storage, 64, pos.y, 18);
                    await moveWorker(storage, 65, pos.y, 18);
                    wy = pos.y;
                }

                await moveWorker(storage, pos.x, pos.y, pos.z);
                await moveWorker(worker, workingFarmPos[workFarmIdx]!!.x, workingFarmPos[workFarmIdx]!!.y, workingFarmPos[workFarmIdx]!!.z);

                await moveBlock(storage, worker, async () => { });


                b.data = await checkCrop(storage);
                b.isDouble = false;
                workingFarm.getBlock(workingFarmPos[workFarmIdx]!!.x, workingFarmPos[workFarmIdx]!!.z).data = await checkCrop(worker);
                workingFarm.getBlock(workingFarmPos[workFarmIdx]!!.x, workingFarmPos[workFarmIdx]!!.z).isDouble = false;

                count++;
                workFarmIdx ++;
                saveAllDataToFile("farmdata.json");
                if (count >= countNeeded) {
                    return;
                }
            }
        }
    }
    await returnTranslocator();
}

export const farmLogic = async () => {
    loadAllDataFromFile("farmdata.json");

    // clear storage farm data.
    // for (const pos of storageFarm.getIteratorOfBlockPositions()) {
    //     const block = storageFarm.getBlock(pos.x, pos.z);
    //     block.data = { name: "minecraft:air", metadata: 0, hardness: 0, harvestLevel: 0, color: 0};
    //     block.isDouble = false;
    // }

    // await Promise.all([checkFarm(worker, workingFarm, false), checkFarm(storage, storageFarm, true)]);;

    await charge();

    // await moveCropToWork("Sugar Beet", 10);
    // saveAllDataToFile("farmdata.json");
    
    // // await storeAll();
    // // await charge();

    // return;


    while (true) {
        moveDroneToEmpty(storage, storageFarm)
            // prepare translocator.
        await prepareTranslocator();
        // iterate working farm
        for (const pos of workingFarm.getIteratorOfBlockPositions()) {
            saveAllDataToFile("farmdata.json");
            if (worker.hasLock()) return;
            const block = workingFarm.getBlock(pos.x, pos.z);
            await moveWorker(worker, pos.x, pos.y, pos.z);
            
            let crop = await checkCrop(worker);



            block.data = crop;
            block.lastChecked = Date.now();
            if ((isCrop(crop) && !isNotPlanted(crop)) || !isCrop(crop)) block.isDouble = false;
            if (!isCrop(crop) && !isAir(crop)) block.canPlant = false;
            if (isCrop(crop)) block.canPlant = true;

            if (!block.canPlant) continue;

            let double = (pos.x + pos.z) % 2 === 0;

            if (isWeed(crop)) {
                if ((crop as Crop)["crop:name"] == "weed") {
                    // use shovel
                    await worker.useTool(15);
                    await worker.chooseSlot(1);
                    await worker.sendCommand("use", 0, false);
                    for (let i = 1; i <= 12; i++) {
                        const {count} = await worker.sendCommandWithRetry("count", i);
                        if (count > 0) {
                            await worker.sendCommandWithRetry("dropBelow", i)
                        }
                    }
                    block.data = crop = await checkCrop(worker);
                    block.isDouble = false;

                } else {
                    // remove weed
                    await attackAndTakeCareOfInventory(worker);
                    block.data = crop = await checkCrop(worker);
                    block.isDouble = false;
                }
            }
            
            if (!isCrop(crop)) {
                if (double) {
                    const succ = await plantCrop(worker, true, true);
                    block.data = crop = await checkCrop(worker);
                    block.isDouble = succ;
                } else {
                    // await plantDefaultCrop(worker, true);
                    block.data = crop = await checkCrop(worker);
                    block.isDouble = false;
                }
            }


            if (!double && isNotPlanted(crop)) {
                console.log("not planted??")
                // await plantDefaultCrop(worker, true);
                block.data = crop = await checkCrop(worker);
                block.isDouble = false;
            }
            if (double && !isNotPlanted(crop)) {
                // move to storage farm.
                // chooooose what to do.
                if (currentStrategy !== undefined)
                    await (currentStrategy as DecisionFunction)(pos.x, pos.z, double, crop as Crop, block);
            } else if (double && isNotPlanted(crop)) {
                const succ = await plantDoubleCrop(worker, true);
                if (succ)
                    block.isDouble = true;
            }
        }

        saveAllDataToFile("farmdata.json");

        await returnTranslocator();
        await charge();
    }
}