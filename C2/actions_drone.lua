function comp(a)
    return component.proxy(component.list(a)())
end

local navigation = comp("navigation")
local drone = comp("drone")
local computer = comp("computer")
local inv_controller = comp("inventory_controller")

local function getEnergy()
    return {
        energy= computer.energy(),
        maxEnergy = computer.maxEnergy()
    }
end 


local function getPosition()
    local x, y, z = navigation.getPosition()
    return {
        x=x,
        y=y,
        z=z
    }
end

local function getAcceleration()
    return drone.getAcceleration()
end

local function setAcceleration(val)
    drone.setAcceleration(val)
end

local function moveTo(tx, ty, tz)
    local cx,cy,cz = navigation.getPosition()
    drone.move(tx-cx, ty-cy, tz-cz)
end


local function chooseSlot(slot)
    drone.select(slot)
end 

local function get(slot, count)
    local succ, res = inv_controller.suckFromSlot(0, slot, count)
    return {
        status = succ,
        reason = res
    }
end
local function put(slot, count)
    local succ, res = inv_controller.dropIntoSlot(0, slot, count)
    return {
        status = succ,
        reason = res
    }
end

local function getData(slot)
    return inv_controller.getStackInInternalSlot(slot)
end

return {
    getData = getData,
    put = put,
    get = get, 
    moveTo = moveTo,
    select = chooseSlot,
    setAcceleration = setAcceleration,
    getAcceleration = getAcceleration, 
    getPosition = getPosition,
    getEnergy = getEnergy
}