-- Colony Moderation On Storage V2
local VERSION = "2.0a"

local Colony = peripheral.find("colonyIntegrator")
local Chat = peripheral.find("chatBox")
local AE = peripheral.find("meBridge")
local Players = peripheral.find("playerDetector")
local Storage = peripheral.find("inventory")

local Team = {"Arfil","NeoForge","Blood_Crystal","Mizuki_Soru"}

local Colors = {
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
  local message = '[{"text":"&&&blue&[&&&pink&CMOS&&&blue&] &&'..data..'&&]'
  for k, v in pairs(Colors) do
    message = string.gsub(message, "&"..k.."&", ',{"color":"'..v..'","text":"')
  end
  message = string.gsub(message, "&&", '"}')
  Chat.sendFormattedMessageToPlayer(message, user)
end

local cachedRequests = {}

local function ChatHandler()
  while true do
    local event, username, message, uuid, isHidden = os.pullEvent("chat")
    if string.sub(message, 1, 1) == "~" then
      local split = {}
      for v in string.gmatch(message, "[^%s]+") do
        table.insert(split, v)
      end
      split[1] = string.lower(split[1])
      if split[1] == "~help" then
        send('&pink&Pink commands &&&purple&are only allowed to use from &&&pink&NekoPlanet team&&&blue&\\n~help &&&gray&Send this help message\\n&&&blue&~version &&&gray&Shows version of CMOS\\n&&&blue&~hello &&&gray&Say hello to world\\n&&&blue&~where &&&gray&Get all users location\\n&&&blue&~stack &&&purple&<count:int> [stacksize:int] &&&gray&Calculate divmod with input count and stacksize\\n&&&pink&~exit &&&gray&Exit Program\\n&&&pink&~req &&&gray&Shows currently exist requests\\n&&&pink&~refresh &&&gray&Refresh cached requests and process them again', username)
      elseif split[1] == "~version" then
        send('&purple&Currently running &&&pink&CMOS '..VERSION, username)
      elseif split[1] == "~hello" then
        send('&purple&Hello, world!', username)
      elseif split[1] == "~where" then
        local data = "&purple&Current players :"
        for k, v in pairs(Players.getOnlinePlayers()) do
          local pos = Players.getPlayerPos(v)
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
      elseif split[1] == "~exit" then
        if has(Team, username) then
          send('&purple&Exiting Program..', username)
          return
        else
          send('&red&Not allowed to use from other team', username)
        end
      elseif split[1] == "~req" then
        if has(Team, username) then
          local req = Colony.getRequests()
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
              data = data..v.target..'&&&blue&: &&&purple&'..v.name..'","hoverEvent":{"action":"show_item","contents":{"id":"'..v.items[1].name..'"}}},{"text":"'
            end
            send(data, username)
          end
        else
          send('&red&Not allowed to use from other team', username)
        end
      elseif split[1] == "~refresh" then
        if has(Team, username) then
          cachedRequests = {}
          send('&purple&Request cache has been refreshed!', username)
        else
          send('&red&Not allowed to use from other team', username)
        end
      else
        send('&red&Command not found&&&purple&, ~help to get list of commands', username)
      end
    end
  end
end

local function ReqeustHandler()
  local timer = os.startTimer(0.05)
  while true do
    event, id = os.pullEvent("timer")
    if id == timer then
      local req = Colony.getRequests()
      for i, v in ipairs(req) do
        if not cachedRequests[v.id] then
          local item = AE.getItem({
            name = v.items[1].name,
            nbt = v.items[1].nbt
          })
          if item ~= nil and item.count >= v.count then
            AE.exportItemToPeripheral({
              name = v.items[1].name,
              nbt = v.items[1].nbt,
              count = v.count
            }, peripheral.getName(Storage))
            cachedRequests[v.id] = true
          end
        end
      end
      timer = os.startTimer(0.05)
    end
  end
end

print("Starting CMOS "..VERSION)
parallel.waitForAny(ChatHandler, ReqeustHandler)
print("Exit!")