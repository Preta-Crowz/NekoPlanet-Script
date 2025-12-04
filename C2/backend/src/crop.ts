
export type Block = {
    name: string,
    metadata: number,
    hardness: number,
    harvestLevel: number,
    color: number,
}

export type Crop = {
    "crop:cropname": string,
    "crop:humidity": number,
    "crop:resistance": number,
    "crop:size": number,
    "crop:nutrients": number,
    "crop:air": number,
    "crop:roots": number,
    "crop:tier": number,
    "crop:fertilizer": number,
    "crop:maxSize": number,
    "crop:gain": number,
    "crop:growth": number,
    "crop:hydration": number,
    "crop:weedex": number,
    
    name: string,
    metadata: number,
    hardness: number,
    harvestLevel: number,
    color: number,
}

export type CropCheckResult = {
    data: Crop | Block,
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