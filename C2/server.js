var net = require('net'); // net 모듈 로드

var server = net.createServer((socket) => { // TCP 서버를 만든다.
  socket.write('hello world');
  socket.on("data", (buf) => {
    console.log(buf)
  })
});

server.on('error', (err) => { // 네트워크 에러 처리
  console.log(err);
});

server.listen(23587, "0.0.0.0", () => {
  console.log('listen', server.address());
});