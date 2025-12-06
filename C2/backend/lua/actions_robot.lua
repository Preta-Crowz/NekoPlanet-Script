

function comp(a)
    local val = component.list(a)()
    if val then
        return component.proxy(val)
    else
        return nil
    end
end

local navigation = comp "navigation"
local robot = comp "robot"
local geolyzer = comp "geolyzer"
local redstone = comp "redstone"
local inv_controller = comp("inventory_controller")

function actions.getEnergy()
    return {
        energy= computer.energy(),
        maxEnergy = computer.maxEnergy(),
        status = true
    }
end 

function actions.checkCrop()
    local rawResult = geolyzer.analyze(0)
    return {
        data = rawResult,
        status = true
    }
end

function actions.getPosition()
    local x, y, z =  navigation.getPosition()
    return {
        x=math.floor(x),
        y=math.floor(y),
        z=math.floor(z),
        status = true
    }
end

local function moveFor(cnt, dir) 
    local failureCount = 0
    while cnt > 0 do
        local status, reason = robot.move(dir)
        if not status then
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
    local pos = actions.getPosition()
    local dX = x - pos.x
    local dZ = z - pos.z
    local dY = y - pos.y

    if dY ~= 0 then
        local succ, res = moveFor(math.abs(dY), dY > 0 and 1 or 0)
        if not succ then
            return succ, res
        end
    end

    local facing = navigation.getFacing()
    if (facing == 4 or facing == 5) and dX ~= 0 then
        local forwardOffset = facing == 4 and -1 or 1
        local movement = forwardOffset * dX

        local succ, res = moveFor(math.abs(dX), movement > 0 and 3 or 2)
        dX = 0
        if not succ then
            return succ, res
        end
    end
    
    if dZ ~= 0 then
        if not (facing == 2 or facing == 3) then
            succ, res = robot.turn(true)
            if not succ then
                return succ, res
            end
            facing = facing == 4 and 2 or 3
        end

        local forwardOffset = facing == 2 and -1 or 1
        local movement = forwardOffset * dZ

        local succ, res = moveFor(math.abs(dZ), movement > 0 and 3 or 2)
        dZ = 0
        if not succ then
            return succ, res
        end
    end
    
    if dX ~= 0 then
        if not (facing == 4 or facing == 5) then
            succ, res = robot.turn(true)
            if not succ then
                return succ, res
            end
            facing = facing == 3 and 4 or 5
        end

        local forwardOffset = facing == 4 and -1 or 1
        local movement = forwardOffset * dX

        local succ, res = moveFor(math.abs(dX), movement > 0 and 3 or 2)
        if not succ then
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

function actions.move(dir)
    robot.move(dir)
    return {
        status = true,
        reason = nil
    }
end 

function actions.count(slot)
    return {
        count = robot.count(slot),
        status = true
    }
end 

function actions.dropBelow(slot)
    robot.select(slot)
    local res = robot.drop(0, 64)
    return {
        status = res
    }
end

function actions.detect(side)
    block, name = robot.detect(side)
    return {
        status = true,
        canNotMove = block,
        name = name
    }
end
function actions.turnRight()
    robot.turn(true)
    return {
        status = true,
        reason = nil
    }
end 
function actions.turnLeft()
    robot.turn(false)
    return {
        status = true,
        reason = nil
    }
end 

function actions.chooseSlot(slot)
    return {
        status = true, 
        old = robot.select(slot) 
    }
end

function actions.swap()
    inv_controller.equip()
    return {
        status = true,
        reason = nil
    }
end 

function actions.attack()
    local succ, res = robot.swing(0)
    return {
        status = succ,
        reason = res
    }
end

function actions.use(side, shift)
    local succ, res = robot.use(side, 0, shift)
    return {
        status = succ,
        reason = res
    }
end

function actions.place()
    local succ, res = robot.use(0)
    return {
        status = succ,
        reason = res
    }
end

function actions.redstone(side, val)
    return {
        status = true, 
        old = redstone.setOutput(side, val)
    }
end

return { 
    status=true,
    reason = "Successfully loaded"
}