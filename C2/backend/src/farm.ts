import { robots, storage, worker } from "./robot"
import { blockExistsBelow, plantCrop, plantDefaultCrop } from "./actions"

export const farmLogic = async () => {
    // await robots["worker"]?.sendCommand("moveTo", 64, 137, 16)
    // await robots["drone"]?.sendCommand("moveTo", 64, 136, 17)
    await robots["worker"]?.sendCommand("checkCrop");

    // await giveCropToWorker(16);

    await plantDefaultCrop(worker);
    // await swapBlock(storage, worker);

    // await plantCrop(storage);
    // await blockExistsBelow(storage)
}