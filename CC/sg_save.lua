-- THIS FILE IS CORRUPTED!!
-- DO NOT USE AND IT MAY FIXED WHEN I NEED TO USE IT AGAIN

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
  if f == nil then
    print("Invalid disk")
    return
  end

  local index = 1
  local data = {}
  for line in io.lines("/disk/sgctrl") do
    data[index] = line
    index = index + 1
  end
  print("Found address data for "..data[1])
  print("Address: "..data[2])

  local prompt = ""
  while prompt ~= "y" and prompt ~= "n" do
    print("Dial stargate to there? [y/n]")
