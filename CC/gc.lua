-- Gaia Counter

local version = "1.0"

local detector = peripheral.find("environmentDetector")
local speaker = peripheral.find("speaker")
local monitor = { peripheral.find("monitor") }

local phase = -1
local count = 0
local difficulty = 0

local adjustConstant = 10

local function getDifficulty(mhp)
  local multipler = (1-(mhp/300))*4
  if multipler < 1 then return 1 end
  return multipler
end

local function updatePhase(e)
  if phase == -1 then
    phase = 0
    count = 120 - adjustConstant
    difficulty = getDifficulty(e.maxHealth)
  end
  if phase == 1 and (e.health / e.maxHealth) <= 0.2 then
    phase = 2
    count = 900 - adjustConstant
  end
end

local function getDisplayText()
  if phase == -1 then
    return {"Ready to fight!", "Running GC v"..version}
  end
  if phase == 0 then
    if count > 0 then return {"Spawning Guardian..", "Remain: "..count} end
    phase = 1
  end
  if phase == 1 then
    return {"Good luck!!", "Difficulty: "..difficulty}
  end
  if phase == 2 then
    if count > 0 then return {"Spawning mobs!!", "Remain: "..count} end
    phase = 3
  end
  if phase == 3 then
    return {"Done spawning!","Almost done!!"}
  end
end

local function displayCounter()
  local text = getDisplayText()
  for _, v in pairs(monitor) do
    v.clear()
    v.setCursorPos(1,3)
    v.write(text[1])
    v.setCursorPos(1,4)
    v.write(text[2])
  end
end

local function loop()
  while true do
    local entities, err = detector.scanEntities(15)
    if err == nil then
      local found = false
      for _, v in pairs(entities) do
        if v.name == "Guardian of Gaia" then
          updatePhase(v)
          found = true
        end
      end
      if not found then phase = -1 end
    end
    if count > 0 then count = count - 1 end
    displayCounter()
    os.sleep(0.05)
  end
end

for _, v in pairs(monitor) do
  v.setTextScale(3)
end

parallel.waitForAll(loop)
