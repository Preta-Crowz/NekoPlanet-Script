-- NAS: NekoPlanet Assistant System
-- Forked from ARES 1.4
-- Removed AE-RS Integration, Modified for use on 1.12
local version = "1.0"

local chat = peripheral.find("manipulator")
local drive = peripheral.find("drive")
chat.capture("^~")

local team = {"Arfil","Blood_Crystal","NeoForge","Mizuki_Soru","Korea_NeverGod"}

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

local function send(message, user)
  local message = '[NAS] '..message
  chat.say(message)
end

local function chat()
  while true do
    local _, message, pattern, username, uuid = os.pullEvent("chat_capture")
    if string.sub(message, 1, 1) == "~" then
      local split = {}
      for v in string.gmatch(message, "[^%s]+") do
        table.insert(split, v)
      end
      if split[1] == "~help" then
        -- send('Some commands are only allowed to use from NekoPlanet team')
        send('~help : Send this help message')
        send('~version : Shows version of NAS')
        send('~hello : Say hello to world')
        send('~stack <count:int> [stacksize:int] : Calculate divmod with input count and stacksize')
        send('~stop : Stop NAS')
        send('~cat : meow')
        send('~nocat : meow..')
      elseif split[1] == "~version" then
        send('Currently running NAS '..version, username)
        send('Forked from ARES 1.4', username)
      elseif split[1] == "~hello" then
        send('Hello, world!', username)
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
          local data = count..' = '..stack
          if mod > 0 then
            data = data..'+'..mod
          end
          send(data..' with stacksize of '..max, username)
        else
          send('Input is not number! Check your input.', username)
        end
      elseif split[1] == "~stop" then
        send('Stopping..')
        return
      elseif split[1] == "~cat" then
        drive.playAudio()
      elseif split[1] == "~nocat" then
        drive.stopAudio()
      else
        send('Command not found, ~help to get list of commands', username)
      end
    end
  end
end

print("Starting NAS "..version)
parallel.waitForAll(chat)
print("Exit!")