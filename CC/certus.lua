local drawer = peripheral.find("functionalstorage:storage_controller")
local reactor = peripheral.find("advanced_ae:reaction_chamber")

local charged = "ae2:charged_certus_quartz_crystal"
local dust = "ae2:certus_quartz_dust"

local function findIndex(id)
  for k, v in pairs(drawer.list()) do
    if v.name == id then return k end
  end
  return -1
end

local function getReactorCount(id)
  local count = 0
  for _, v in pairs(reactor.list()) do
    if v.name == id then
      count = count + v.count
    end
  end
  return count
end

local next = charged

local function loop()
  while true do
    local count = getReactorCount(next)
    if count <= 64 and findIndex(next) ~= -1 then
      drawer.pushItems(peripheral.getName(reactor), findIndex(next), 256 - count)
    end
    if next == charged then next = dust else next = charged end
    os.sleep(0.05)
  end
end

parallel.waitForAll(loop)