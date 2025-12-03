function comp(a)
    return component.proxy(component.list(a)())
end

local navigation = comp("navigation")
local drone = comp("drone")
local computer = comp("computer")
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
    return drone.getAcceleration()
end

function actions.setAcceleration(val)
    drone.setAcceleration(val)
end

function actions.moveTo(tx, ty, tz)
    local cx,cy,cz = navigation.getPosition()
    drone.move(tx-cx, ty-cy, tz-cz)
end


function actions.chooseSlot(slot)
    drone.select(slot)
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
    return inv_controller.getStackInInternalSlot(slot)
end

return { 
    status=true,
    reason = "Successfully loaded"
}