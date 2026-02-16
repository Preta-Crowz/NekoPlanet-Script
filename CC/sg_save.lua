function main()
  local drive = peripheral.find("drive")

  if not drive.isDiskPresent() then
    print("No disk found")
    return
  end

  if not drive.hasData() then
    print("No data found on disk")
    return
  end

  local f = io.open("/disk/sgctrl", "rb")
  if f then f:close() end
  if f ~= nil then
    while prompt ~= "y" and prompt ~= "n" do
      print("Current disk has data inside, override? [y/n]")
      prompt = io.read()
    end
    if prompt ~= "y" then
      return
    end
  end

  print("Input gate name: ")
  local name = io.read()
  print("Input gate address: ")
  local addr = io.read()

  local f = io.open("/disk/sgctrl", "w")
  f:write(name, "\n", addr)
  local data = {}

  local prompt = ""
  while prompt ~= "y" and prompt ~= "n" do
    print("Dial stargate to there? [y/n]")
    prompt = io.read()
  end
  if prompt ~= "y" then
    return
  end

  local interface = peripheral.find("advanced_crystal_interface") or peripheral.find("crystal_interface")
  if interface == nil then
    print("Interface not found")
    return
  end
  for v in string.gmatch(addr, "\-(%d+)") do
    interface.engageSymbol(tonumber(v))
  end
  interface.engageSymbol(0)
end

main()