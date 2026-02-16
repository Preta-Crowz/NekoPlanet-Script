local web = component.proxy(component.list("internet")())
local status = nil
if component.list("drone")() then
  local drone = component.proxy(component.list("drone")())
  status = drone.setStatusText
else
  status = function(text) end
end
local url = "https://gtnhoc.syeyoung.dev/main.lua"

function net_get(address)
  local req = web.request(address)
  status "Updating"
  req.finishConnect()
  status "Connected"

  local fr = ""
  while true do
    status "Processing"
    local chunk = req.read()
    if chunk then
      string.gsub(chunk, "\r\n", "\n")
      fr = fr .. chunk
    else
      break
    end
  end

  return fr
end
print = status

load(net_get(url))()