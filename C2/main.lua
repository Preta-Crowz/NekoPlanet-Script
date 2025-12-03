local tcp = component.proxy(component.list("internet")())
local cid = component.proxy(component.list("eeprom")()).getData()

local function connect()
  while true do
    log("Conn...")
    local sock = tcp.connect("115.139.146.62", 23587)
    while true do
      local status, message = tcp.finishConnect()
      if status then
        return sock
      end
      if message ~= nil then
        log(message)
        os.sleep(5)
        break
      end
    end
  end
end

local function send(sock, t)
  local data = serialization.serialize(t, false) .. "\n"
  sock.write(data)
end

local function listen(sock, commands)
  local buffer = ""
  while true do
    local chunk, msg = sock.read()
    if chunk == nil then
      log(chunk)
      return false
    end
    buffer = buffer .. chunk
    local nl = buffer:find("\n")
    while nl do
      local line = buffer:sub(1, nl - 1)
      buffer = buffer:sub(nl + 1)
      local ok2, msg = pcall(serialization.unserialize, line)
      if ok2 and type(msg) == "table" and msg.cmd then
        local res = commands[msg.cmd](table.unpack(msg.args))
        send(sock, res)
      end
      nl = buffer:find("\n")
    end 
  end
end

actions = {}
function actions.identify()
  return {cid=cid}
end

function actions.load(payload)
  return load(payload)()
end

while true do
  local sock = connect()
  handleCommands(sock, actions)
end