
export type Block = {
    name: string,
    metadata: number,
    hardness: number,
    harvestLevel: number,
    color: number,
}

export type Air = {
    name: "minecraft:air",
    metadata: 0,
    hardness: 0,
    harvestLevel: -1,
    color: 0,
}

export type Crop = {
    cropname: string,
    humidity: number,
    resistance: number,
    size: number,
    nutrients: number,
    air: number,
    roots: number,
    tier: number,
    fertilizer: number,
    maxSize: number,
    gain: number,
    growth: number,
    hydration: number,
    weedex: number,

    name: string,
    metadata: number,
    hardness: number,
    harvestLevel: number,
    color: number,
}

export type CropCheckResult = {
    data: Crop | Block | Air,
    status: boolean,
}

/*{
  data: {
    'crop:name': 'reed',
    'crop:humidity': 2,
    'crop:resistance': 2,
    'crop:size': 1,
    'crop:nutrients': 3,
    'crop:air': 10,
    'crop:roots': 1,
    name: 'IC2:blockCrop',
    'crop:tier': 2,
    'crop:fertilizer': 0,
    'crop:maxSize': 3,
    'crop:gain': 0,
    harvestLevel: -1,
    hardness: 0.80000001192093,
    color: 31744,
    'crop:growth': 3,
    'crop:hydration': 0,
    'crop:weedex': 0,
    metadata: 0
  },
  status: true
}
  {
  data: {
    metadata: 0,
    color: 31744,
    hardness: 0.80000001192093,
    harvestLevel: -1,
    name: 'IC2:blockCrop'
  },
  status: true
}
  {
  data: {
    metadata: 0,
    color: 0,
    hardness: 0,
    harvestLevel: -1,
    name: 'minecraft:air'
  },
  status: true
}

*/