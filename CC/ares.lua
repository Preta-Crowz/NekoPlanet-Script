-- ARES: AE-RS Integration System
local version = "1.4"

local ae = peripheral.find("meBridge")
local rs = peripheral.find("rsBridge")
local player = peripheral.find("playerDetector")
local chat = peripheral.find("chatBox")

local team = {"Arfil","Blood_Crystal","NeoForge","Mizuki_Soru"}

local listen = {}
for i, v in ipairs(team) do
  listen[v] = false
end

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

local function send(data, user)
  local message = '[{"text":"&&&blue&[&&&pink&ARES&&&blue&] &&'..data..'&&]'
  for k, v in pairs(colors) do
    message = string.gsub(message, "&"..k.."&", ',{"color":"'..v..'","text":"')
  end
  message = string.gsub(message, "&&", '"}')
  chat.sendFormattedMessageToPlayer(message, user)
end

local function chat()
  while true do
    local event, username, message, uuid, isHidden = os.pullEvent("chat")
    if string.sub(message, 1, 1) == "~" then
      local split = {}
      for v in string.gmatch(message, "[^%s]+") do
        table.insert(split, v)
      end
      if split[1] == "~help" then
        send('&pink&Pink commands &&&purple&are only allowed to use from &&&pink&NekoPlanet team&&&blue&\\n~help &&&gray&Send this help message\\n&&&blue&~version &&&gray&Shows version of ARES\\n&&&blue&~hello &&&gray&Say hello to world\\n&&&pink&~listen &&&gray&Toggle status to listen autocrafting\\n&&&blue&~where &&&gray&Get all users location\\n&&&blue&~stack &&&purple&<count:int> [stacksize:int] &&&gray&Calculate divmod with input count and stacksize', username)
      elseif split[1] == "~version" then
        send('&purple&Currently running &&&pink&ARES '..version, username)
      elseif split[1] == "~hello" then
        send('&purple&Hello, world!', username)
      elseif split[1] == "~listen" then
        if has(team, username) then
          if listen[username] then
            listen[username] = false
            send('&purple&Listening for autocrafting has been &&&red&disabled', username)
          else
            listen[username] = true
            send('&purple&Listening for autocrafting has been &&&green&enabled', username)
          end
        else
          send('&red&Not allowed to use from other team', username)
        end
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
      else
        send('&red&Command not found&&&purple&, ~help to get list of commands', username)
      end
    end
  end
end

local function leave()
  while true do
    local event, username, dimension = os.pullEvent("playerLeave")
    if has(team, username) then
      local online = player.getOnlinePlayers()
      if not has(online, username) then
        listen[username] = false
      end
    end
  end
end

local function auto()
  while true do
    local arrItems = ae.listCraftableItems()
    for k,v in pairs(arrItems) do
      if v.name ~= "packagedauto:package" and v.name ~= "mekanism:creative_energy_cube" then
        local filter = {name=v.name}
        if ae.isItemCraftable(filter) then
          if pcall(ae.craftItem(filter)) then
            for l,w in pairs(listen) do
              if listen[l] then
                send('&purple&Start autocrafting : &&&green&'..v.displayName..'","hoverEvent":{"action":"show_item","contents":{"id":"'..v.name..'"}}},{"text":"', l)
              end
            end
          end
        end
      end
    end
    os.sleep(0.05)
  end
end

print("Starting ARES "..version)
parallel.waitForAll(chat, leave, auto)
print("Exit!")