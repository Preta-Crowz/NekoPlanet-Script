local navigation = component.navigation
local robot = component.robot
local computer = component.computer

function actions.getEnergy()
    return {
        energy= computer.energy(),
        maxEnergy = computer.maxEnergy()
    }
end 

function actions.checkCrop()
    local rawResult = component.geolyzer.analyze(sides.down)
    return rawResult
end

function actions.getPosition()
    local x, y, z =  navigation.getPosition()
    return {
        x=math.floor(x),
        y=math.floor(y),
        z=math.floor(z)
    }
end

function actions.moveFor(cnt, dir) 
    local failureCount = 0
    while cnt > 0 do
        local status, reason = robot.move(dir)
        if (status) then
            failureCount = failureCount + 1
            if (failureCount > 10) then
                return false, reason
            end
        else
            failureCount = 0
            cnt = cnt - 1
        end
    end
    return true, nil
end

local function _moveTo(x, y, z)
    local pos = getPosition()
    local dX = x - pos.x
    local dZ = z - pos.z
    local dY = y - pos.y

    if dY ~= 0 then
        local succ, res = moveFor(math.abs(dY), dY > 0 and 1 or 0)
        if ~succ then
            return succ, res
        end
    end

    local facing = navigation.getFacing()
    if (facing == 4 or facing == 5) and dX ~= 0 then
        local forwardOffset = facing == 4 and -1 or 1
        local movement = forwardOffset * dX

        local succ, res = moveFor(math.abs(dX), movement > 0 and 3 or 2)
        if ~succ then
            return succ, res
        end
        if (dZ ~= 0) then
            succ, res = robot.turnRight()
            if ~succ then
                return succ, res
            end
            facing =  facing == 4 and 2 or 3
        end
    end
    
    if (facing == 2 or facing == 3) and dZ ~= 0 then
        local forwardOffset = facing == 4 and -1 or 1
        local movement = forwardOffset * dZ

        local succ, res = oveFor(math.abs(dX), movement > 0 and 3 or 2)
        if ~succ then
            return succ, res
        end
        if (dX ~= 0) then
            succ, res = robot.turnRight()
            if ~succ then
                return succ, res
            end
            facing = facing == 3 and 4 or 5
        end
    end
    
    if (facing == 4 or facing == 5) and dX ~= 0 then
        local forwardOffset = facing == 4 and -1 or 1
        local movement = forwardOffset * dX

        local succ, res = moveFor(math.abs(dX), movement > 0 and 3 or 2)
        if ~succ then
            return succ, res
        end
    end 
    return true, nil
end

function actions.moveTo(x,y,z)
    local succ, res = _moveTo(x,y,z)
    return {
        status = succ,
        reason = res
    }
end 

function actions.chooseSlot(slot)
    robot.select(slot) 
end

function actions.attack()
    local succ, res = drone.swing(0)
    return {
        status = succ,
        reason = res
    }
end

function actions.place()
    local succ, res = drone.use(0)
    return {
        status = succ,
        reason = res
    }
end

function actions.redstone(val)
    return {
        status = true, 
        old = component.redstone.setOutput(0, val)
    }
end

return { 
    status=true,
    reason = "Successfully loaded"
}