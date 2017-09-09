const http = require('http');
const { URL } = require('url');
const trumpet = require('trumpet');

const serverUrl = new URL('http://localhost:3000');
const TAG_NAME = 'pw';

const server = http.createServer((sourceReq, sourceRes) => {
  const options = {
    hostname: serverUrl.hostname,
    port: serverUrl.port,
    path: serverUrl.path,
    method: sourceReq.method,
    headers: sourceReq.headers,
  };

  const tr = trumpet();

  tr.selectAll(TAG_NAME, (elem) => {
    elem.getAttribute('url', (url) => {
      const downstreamUrl = new URL(url);
      const ws = elem.createWriteStream({ outer: true });

      const opts = {
        hostname: downstreamUrl.hostname,
        port: downstreamUrl.port,
        path: downstreamUrl.path,
      };

      http.request(opts, (downstreamRes) => {
        downstreamRes.pipe(ws);
      }).end();
    });
  });

  const destReq = http.request(options, (destRes) => {
    destRes
      .pipe(tr)
      .pipe(sourceRes);
  });

  sourceReq.pipe(destReq);
});

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(8000, () => {
  process.send({ started: true });
});
