import type { Block, Crop } from "./crop";
import fs from 'fs'

export type BlockData = {
    data: (Block | Crop | null);
    canPlant: boolean | null; 
    lastChecked: number;
    isDouble: boolean | null;
}



export class WorkArea {
    minX: number;
    minZ: number;
    maxX: number;
    maxZ: number;
    y: number

    crops: BlockData[] = []

    constructor(minX: number, y: number, minZ: number, maxX: number, maxZ: number) {
        this.minX = minX;
        this.y = y;
        this.minZ = minZ;
        this.maxX = maxX;
        this.maxZ = maxZ;

        // initialize crops array
        const size = (maxX - minX + 1) * (maxZ - minZ + 1);
        this.crops = new Array(size).fill(null).map(() => ({ data: null, canPlant: null, lastChecked: 0, isDouble: null }) );
    }

    getBlock(x: number, z: number): BlockData {
        const index = (z - this.minZ) * (this.maxX - this.minX + 1) + (x - this.minX);
        return this.crops[index]!!;
    }

    getIteratorOfBlockPositions(): {x: number, y: number, z: number}[] {
        const positions: {x: number, y: number, z: number}[] = [];
        // zigzag by rows: go left->right on one z, then right->left on next z, etc.
        for (let z = this.minZ; z <= this.maxZ; z++) {
            const rowIndex = z - this.minZ;
            if (rowIndex % 2 === 0) {
                for (let x = this.minX; x <= this.maxX; x++) {
                    positions.push({ x, y: this.y, z });
                }
            } else {
                for (let x = this.maxX; x >= this.minX; x--) {
                    positions.push({ x, y: this.y, z });
                }
            }
        }
        return positions;
    }
}


const workingFarm = new WorkArea(65, 137, 8, 73, 16);
const storageFarm = new WorkArea(65, 137, 18, 79, 31);

export { storageFarm, workingFarm };

export const loadAllDataFromFile = (filePath: string) => {
    // fill storageFarm and workingFarm from file path given.
    fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (data.storageFarm) {
        Object.assign(storageFarm, data.storageFarm);
    }
    if (data.workingFarm) {
        Object.assign(workingFarm, data.workingFarm);
    }
}

export const saveAllDataToFile = (filePath: string) => {
    // save storageFarm and workingFarm to file path given.
    fs.writeFileSync(filePath, JSON.stringify({storageFarm, workingFarm}));
}
