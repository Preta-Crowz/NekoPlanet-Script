import { Robot, robots, storage, worker } from "./robot"
import { blockExistsBelow, checkCrop, checkEnergy, moveBlock, moveDroneToEmpty, moveWorker, plantCrop, plantDefaultCrop } from "./actions"
import { loadAllDataFromFile, saveAllDataToFile, storageFarm, WorkArea } from "./workarea";

import { workingFarm } from "./workarea";
import type { Block, Crop } from "./crop";

const restPos = {x: 64, y: 137, z: 16}

const isCrop = (data: Crop|Block): boolean => data.name == "IC2:blockCrop";
const isAir = (data: Crop|Block): boolean => data.name == "minecraft:air";
const isNotPlanted = (data: Crop|Block): boolean => (data as Crop)["crop:cropname"] == undefined;

export const checkFarm = async (target: Robot, farm: WorkArea, eraseEmpty: boolean) => {
    for (const pos of farm.getIteratorOfBlockPositions()) {
        const previous = farm.getBlock(pos.x, pos.z);
        
        await moveWorker(target, pos.x, pos.y, pos.z);
        let data = await checkCrop(target);


        let plantable = isCrop(data) ? true : (isAir(data) ? null : false);
        if (plantable !== null) previous.canPlant = plantable;

        if (previous.canPlant === null) {
            let newCanPlant = null;
            if (isCrop(data)) newCanPlant = true;
            else if (!isAir(data)) newCanPlant = false;

            if (newCanPlant === null) {
                // try planting.
                const planted = await plantCrop(worker);
                if (planted) {
                    newCanPlant = true;
                    worker.sendCommand("attack")
                } else {
                    newCanPlant = false;
                }
            }
            previous.canPlant = newCanPlant;
        }

        if (eraseEmpty && isCrop(data) && isNotPlanted(data)) {
            target.sendCommand("attack")
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
                target.sendCommand("attack")
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



export const farmLogic = async () => {
    loadAllDataFromFile("farmdata.json");

    checkFarm(worker, workingFarm, false);
    checkFarm(storage, storageFarm, true);


    while (true) {
        // iterate working farm
        for (const pos of workingFarm.getIteratorOfBlockPositions()) {
            const block = workingFarm.getBlock(pos.x, pos.z);
            await moveWorker(worker, pos.x, pos.y, pos.z);
            
            let crop = await checkCrop(worker);



            block.data = crop;
            block.lastChecked = Date.now();
            if ((isCrop(crop) && !isNotPlanted(crop)) || !isCrop(crop)) block.isDouble = false;
            if (!isCrop(crop) && !isAir(crop)) block.canPlant = false;

            if (!block.canPlant) continue;

            let double = (pos.x + pos.z) % 2 === 0;

            if (!isCrop(crop)) {
                if (double) {
                    await plantCrop(worker, true);
                    block.data = crop = await checkCrop(worker);
                    block.isDouble = true;
                } else {
                    await plantDefaultCrop(worker);
                    block.data = crop = await checkCrop(worker);
                    block.isDouble = false;
                }
            }

            if (!double && isNotPlanted(crop)) {
                await plantDefaultCrop(worker);
                block.data = crop = await checkCrop(worker);
                block.isDouble = false;
            }
            if (double && !isNotPlanted(crop)) {
                // move to storage farm.
                await moveDroneToEmpty(storage, storageFarm)
                await moveBlock(worker, storage);
                // double plant
                await plantCrop(worker, true);
                block.data = crop = await checkCrop(worker);
                block.isDouble = true;
            }
        }

        {
            // move to rest pos and charge.
            await moveWorker(worker, restPos.x, restPos.y, restPos.z);
            // charge fully.
            let {energy, maxEnergy} = await checkEnergy(worker);
            while (energy < maxEnergy) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const energyInfo = await checkEnergy(worker);
                energy = energyInfo.energy;
            }

            // move worker up rest pos.
            await moveWorker(worker, restPos.x, restPos.y + 1, restPos.z);
        }
        {
            // charge storage.
            await moveWorker(storage, restPos.x, restPos.y, restPos.z);
            let {energy, maxEnergy}= (await checkEnergy(storage));
            while (energy < maxEnergy) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const energyInfo = await checkEnergy(storage);
                energy = energyInfo.energy;
            }

            await moveWorker(storage, 64, 137, 17);
            moveDroneToEmpty(storage, storageFarm);
            await moveWorker(worker, restPos.x, restPos.y, restPos.z);
        }

        saveAllDataToFile("farmdata.json");
    }
}