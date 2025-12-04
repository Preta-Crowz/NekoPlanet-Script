function comp(a)
    return component.proxy(component.list(a)())
end

local navigation = comp("navigation")
local drone = comp("drone")
local inv_controller = comp("inventory_controller")

function actions.getEnergy()
    return {
        energy= computer.energy(),
        maxEnergy = computer.maxEnergy()
    }
end 


function actions.getPosition()
    local x, y, z = navigation.getPosition()
    return {
        x=x,
        y=y,
        z=z
    }
end

function actions.getAcceleration()
    return {
        data=drone.getAcceleration(),
        status = true
    }
end

function actions.setAcceleration(val)
    drone.setAcceleration(val)
    return {
        status= true,
        reason= nil
    }
end

function actions.moveTo(tx, ty, tz)
    local cx,cy,cz = navigation.getPosition()
    drone.move(tx-cx, ty-cy, tz-cz)

    while drone.getOffset() > 0.05 do
        computer.pullSignal(0.1)
    end

    return {
        status= drone.getOffset() < 0.01,
        reason= nil
    }
end

function actions.getRemaining()
    return {
        distance = drone.getOffset(),
        status= true
    }
end

function actions.chooseSlot(slot)
    drone.select(slot)
    return {
        status= true,
        reason= nil
    }
end 

function actions.getInventory()
    local size = inv_controller.getInventorySize(0)
    local table = {}
    for i=1, size do
        table[i] = inv_controller.getStackInSlot(0, i)
    end
    return {
        size = inv_controller.getInventorySize(0),
        table = table,
        status = true
    }
end 
function actions.get(slot, count)
    local succ, res = inv_controller.suckFromSlot(0, slot, count)
    return {
        status = succ,
        reason = res
    }
end
function actions.put(slot, count)
    local succ, res = inv_controller.dropIntoSlot(0, slot, count)
    return {
        status = succ,
        reason = res
    }
end

function actions.getData(slot)
    return {
        status=true,
        data = inv_controller.getStackInInternalSlot(slot)
    }
end

return { 
    status=true,
    reason = "Successfully loaded"
}