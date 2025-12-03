-- NAS: NekoPlanet Assistant System
-- Forked from ARES 1.4
-- CMOS: Colony Moderation On Storage

local version = "ARES 1.1a-modern + CMOS 2.1"

local player = peripheral.find("player_detector")
local chat = peripheral.find("chat_box")
local inventory = { peripheral.find("inventory_manager") }
local colony = peripheral.find("colony_integrator")
local AE = peripheral.find("me_bridge")
local storage = peripheral.find("inventory")

local mod = {"NeoForge"}
-- For moderation/debug only

local colors = {
  blue = "#AEEAFF",
  pink = "#F8BBD0",
  purple = "#CBA7FA",
  red = "#F55142",
  green = "#81F542",
  gray = "#AAAAAA"
}

local function has(arr, val)
  for i, v in ipairs(arr) do
    if v == val then
      return true
    end
  end
  return false
end

local function formatOnly(data)
  local message = '[{"text":"&&&blue&[&&&pink&NAS&&&blue&] &&'..data..'&&]'
  for k, v in pairs(colors) do
    message = string.gsub(message, "&"..k.."&", ',{"color":"'..v..'","text":"')
  end
  message = string.gsub(message, "&&", '"}')
  return message
end

local function send(data, user)
  local message = '[{"text":"&&&blue&[&&&pink&NAS&&&blue&] &&'..data..'&&]'
  for k, v in pairs(colors) do
    message = string.gsub(message, "&"..k.."&", ',{"color":"'..v..'","text":"')
  end
  message = string.gsub(message, "&&", '"}')
  chat.sendFormattedMessageToPlayer(message, user)
end

local cachedRequests = {}

local function chatEvent()
  while true do
    local event, username, message, uuid, isHidden = os.pullEvent("chat")
    if string.sub(message, 1, 1) == "~" then
      local split = {}
      for v in string.gmatch(message, "[^%s]+") do
        table.insert(split, v)
      end
      if split[1] == "~help" then
        send('&blue&\\n~help &&&gray&Send this help message\\n&&&blue&~version &&&gray&Shows version of NAS\\n&&&blue&~hello &&&gray&Say hello to world\\n&&&blue&~where &&&gray&Get all users location\\n&&&blue&~stack &&&purple&<count:int> [stacksize:int] &&&gray&Calculate divmod with input count and stacksize\\n&&&blue&~show &&&gray&Show item in hand to chat\\n&&&pink&~exit &&&gray&Exit Program\\n&&&blue&~req &&&gray&Shows currently exist requests\\n&&&blue&~refresh &&&gray&Refresh cached requests', username)
      elseif split[1] == "~version" then
        send('&purple&Currently running &&&pink&NAS '..version, username)
      elseif split[1] == "~hello" then
        send('&purple&Hello, world!', username)
      elseif split[1] == "~where" then
        local data = "&purple&Current players :"
        for k, v in pairs(player.getOnlinePlayers()) do
          local pos = player.getPlayerPos(v)
          if pos ~= nil then
            data = data..'\n&&&purple&'..v..' &&&gray&'..pos['x']..' '..pos['y']..' '..pos['z']..' &&&purple&in &&&green&'..pos['dimension']
          else
            data = data..'\n&&&purple&'..v..' &&&red&POSITION UNKNOWN'
          end
        end
        send(data, username)
      elseif split[1] == "~stack" then
        local count = tonumber(split[2])
        local max = 64
        if #split > 2 then
          max = tonumber(split[3])
        end
        if count ~= nil and max ~= nil then
          count = math.floor(count)
          max = math.floor(max)
          local stack = math.floor(count / max)
          local mod = count % max
          local data = '&purple&'..count..' &&&blue&= '..stack
          if mod > 0 then
            data = data..'&&&green&+'..mod
          end
          send(data..'&&&purple& with stacksize of &&&pink&'..max, username)
        else
          send('&red&Input is not number! &&&gray&Check your input.', username)
        end
      elseif split[1] == "~show" then
        local found = false
        for _, i in pairs(inventory) do
          if i.getOwner() == username then
            found = true
            local item = i.getItemInHand()
            if item.name ~= nil then
              local components = '{}'
              if item.components ~= nil then
                components = textutils.serialiseJSON(item.components)
              end
              local data = formatOnly('&blue&: &&&purple&'..item.name..'","hoverEvent":{"action":"show_item","contents":{"id":"'..item.name..'","components":'..components..'}}},{"text":"')
              chat.sendFormattedMessage(data)
            else
              send('&red&No item found in hand! &&&gray&Make sure item is on main hand.', username)
            end
          end
        end
        if not found then
          send('&red&Failed to read inventory! &&&gray&Add inventory manager and pput your memory card to use.', username)
        end
      elseif split[1] == "~exit" then
        if has(mod, username) then
          send('&purple&Exiting Program..', username)
          return
        else
          send('&red&Not allowed!', username)
        end
      elseif split[1] == "~req" then
        local req = colony.getRequests()
        if #req == 0 then
          send('&green&No requests for now! &&&purple&Have fun!', username)
        else
          local data = '&purple&Current requests:'
          for i, v in ipairs(req) do
            if cachedRequests[v.id] then
              data = data..'\n&&&green&'
            else
              data = data..'\n&&&red&'
            end
            local components = '{}'
            if v.items[1].components ~= nil then
              components = textutils.serialiseJSON(v.items[1].components)
            end
            data = data..v.target..'&&&blue&: &&&purple&'..v.name..'","hoverEvent":{"action":"show_item","contents":{"id":"'..v.items[1].name..'","components":'..components..'}}},{"text":"'
          end
          send(data, username)
        end
      elseif split[1] == "~refresh" then
        cachedRequests = {}
        send('&purple&Request cache has been refreshed!', username)
      else
        send('&red&Command not found&&&purple&, ~help to get list of commands', username)
      end
    end
  end
end

local function reqeustHandler()
  local timer = os.startTimer(0.05)
  while true do
    event, id = os.pullEvent("timer")
    if id == timer then
      local req = colony.getRequests()
      for i, v in ipairs(req) do
        if not cachedRequests[v.id] then
          local item = AE.getItem({
            name = v.items[1].name,
            components = v.items[1].components
          })
          if item ~= nil and item.count >= v.count then
            AE.exportItem({
              name = v.items[1].name,
              components = v.items[1].components,
              count = v.count
            }, peripheral.getName(storage))
            cachedRequests[v.id] = true
          end
        end
      end
      timer = os.startTimer(0.05)
    end
  end
end

print("Starting NAS "..version)
parallel.waitForAll(chatEvent, reqeustHandler)
print("Exit!")