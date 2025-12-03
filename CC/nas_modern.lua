-- NAS: NekoPlanet Assistant System
-- Forked from ARES 1.4
-- Removed AE-RS Integration
local version = "1.1-modern"

local player = peripheral.find("playerDetector")
local chat = peripheral.find("chatBox")
local inventory = { peripheral.find("inventoryManager") }

local team = {"Arfil","NeoForge","dakdulgi2"}

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

local function chatEvent()
  while true do
    local event, username, message, uuid, isHidden = os.pullEvent("chat")
    if string.sub(message, 1, 1) == "~" then
      local split = {}
      for v in string.gmatch(message, "[^%s]+") do
        table.insert(split, v)
      end
      if split[1] == "~help" then
        send('&pink&Pink commands &&&purple&are only allowed to use from &&&pink&NekoPlanet team&&&blue&\\n~help &&&gray&Send this help message\\n&&&blue&~version &&&gray&Shows version of NAS\\n&&&blue&~hello &&&gray&Say hello to world\\n&&&blue&~where &&&gray&Get all users location\\n&&&blue&~stack &&&purple&<count:int> [stacksize:int] &&&gray&Calculate divmod with input count and stacksize\\n&&&blue&~show &&&gray&Show item in hand to chat', username)
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
              local nbt = '{}'
              if item.nbt ~= nil then
                nbt = textutils.serialiseJSON(item.nbt):gsub('"','\\"')
              end
              local data = formatOnly('&blue&: &&&purple&'..item.name..'","hoverEvent":{"action":"show_item","contents":{"id":"'..item.name..'","tag":"'..nbt..'"}}},{"text":"')
              chat.sendFormattedMessage(data)
            else
              send('&red&No item found in hand! &&&gray&Make sure item is on main hand.', username)
            end
          end
        end
        if not found then
          send('&red&Failed to read inventory! &&&gray&Ask NekoPlanet member to add your memory card.', username)
        end
      else
        send('&red&Command not found&&&purple&, ~help to get list of commands', username)
      end
    end
  end
end

print("Starting NAS "..version)
parallel.waitForAll(chatEvent)
print("Exit!")