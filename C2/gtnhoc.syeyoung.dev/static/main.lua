local tcp = component.proxy(component.list("internet")())
local eepromdata = load(component.proxy(component.list("eeprom")()).getData())()

function c_require(val) 
  return load(net_get("https://gtnhoc.syeyoung.dev/" .. val))()
end

local serialization = c_require("serialization.lua")
c_require("screencheck.lua")

function sleep(timeout)
  local deadline = computer.uptime() + (timeout or 0)
  repeat
    computer.pullSignal(deadline - computer.uptime())
  until computer.uptime() >= deadline
end

local function connect()
  while true do
    print("Conn...")
    local sock = tcp.connect(eepromdata.ip, eepromdata.port)
    while true do
      local status, message = sock.finishConnect()
      if status then
        return sock
      end
      if message ~= nil then
        print(message)
        sleep(5)
        break
      end
    end
  end
end

local function send(sock, t)
  local data = serialization.serialize(t, false) .. "\n"
  local prefix = string.format("%05d", #data)
  sock.write(prefix .. data)
end

local function listen(sock, commands)
  local buffer = ""
  while true do
    local chunk, msg = sock.read()
    if chunk == nil then
      print(chunk)
      return false
    end
    buffer = buffer .. chunk
    while #buffer >= 5 do
      local len = tonumber(buffer:sub(1,5))
      if #buffer < 5 + len then break end
      
      local payload = buffer:sub(6, 5+len)
      buffer = buffer:sub(6+len)

      local ok2, msg = pcall(serialization.unserialize, payload)
      if ok2 and type(msg) == "table" and msg.cmd then
        print(msg.cmd)
        local ok3, res = pcall(commands[msg.cmd], table.unpack(msg.args))
        if ok3 then
          send(sock, res)
        else
          send(sock, {
            status= false,
            reason= res
          })
        end
      end
    end 
  end
end

actions = {}
function actions.identify()
  return eepromdata
end

function actions.load(payload)
  return load(payload)()
end

while true do
  local sock = connect()
  listen(sock, actions)
end