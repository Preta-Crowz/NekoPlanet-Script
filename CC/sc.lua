-- Storage Checker

local version = "1.0"

local reader = peripheral.find("blockReader")
local monitor = { peripheral.find("monitor") }

local index = -1
local prevIndex = -1

local function split(s, sep)
  local r = {}
  for p in (string.gmatch(s, "[^"..sep.."]+")) do table.insert(r, p) end
  return unpack(r)
end

local function getLimit(type, sizeText)
  local mult = 8000
  if type == "item" or type == drive then mult = 8 end
  local size = string.match(sizeText, "%d+")
  return tonumber(size) * 1024 * mult
end

local function display(size, type, limit, count)
  for _, v in pairs(monitor) do
    v.clear()
    v.setCursorPos(1,2)
    v.write(size.." "..type)
    v.setCursorPos(1,4)
    v.write(count)
    v.setCursorPos(1,5)
    v.write("    /"..limit)
  end
end

local function work(inv)
  while index do
    index = index + 1
    if index > 19 then index = 0 end
    if inv["item"..index].id ~= nil then
      local curr = inv["item"..index]
      local namespace, id = split(curr.id, ":")
      if namespace == "ae2additions" then
        local base, type, size = split(id, "_")
        if base == "disk" then
          local limit = getLimit(type, size)
          local count = curr.tag.ic
          if count == nil then count = 0 end
          display(size, type, limit, count)
          prevIndex = index
          return
        end
      end
    end
    if prevIndex == -1 and index == 19 then error("Disk not found!!") end
  end
end

local function loop()
  while true do
    local inv = reader.getBlockData().inv
    if inv ~= nil then
      work(inv)
    end
    os.sleep(3)
  end
end

for _, v in pairs(monitor) do
  v.setTextScale(3)
end

parallel.waitForAll(loop)
