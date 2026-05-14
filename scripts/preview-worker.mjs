import http from "node:http";
import worker from "../worker.js";

const hostname = "127.0.0.1";
const port = Number(process.env.PORT || 8787);

const server = http.createServer(async (incoming, outgoing) => {
  try {
    const url = `http://${incoming.headers.host}${incoming.url}`;
    const request = new Request(url, {
      method: incoming.method,
      headers: incoming.headers
    });
    const response = await worker.fetch(request);

    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) {
      const body = Buffer.from(await response.arrayBuffer());
      outgoing.end(body);
    } else {
      outgoing.end();
    }
  } catch (error) {
    outgoing.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    outgoing.end(error.stack || String(error));
  }
});

server.listen(port, hostname, () => {
  console.log(`Worker preview running at http://${hostname}:${port}`);
});
