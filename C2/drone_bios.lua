local web = component.proxy(component.list("internet")())
local drone = component.proxy(component.list("drone")())
local status = drone.setStatusText

local url = ""

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
      str.gsub(chunk, "\r\n", "\n")
      fr = fr .. chunk
    else
      break
    end
  end

  return fr
end
log = status

load(net_get(url))()