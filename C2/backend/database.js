import fs from 'fs';

const farm = JSON.parse(fs.readFileSync("farm.json"))

const getCropSlot = (fieldNo, x, z) => {
    return farm[fieldNo].crops[x][z]
}

const setCropSlot = (fieldNo, x, z, crop) => {
    farm[fieldNo].crops[x][z] = crop;
}

const getFarmDimension = (fieldNo) => {
    return farm[fieldNo].dimension
}

