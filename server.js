import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '127.0.0.1';
const indexPath = new URL('./index.html', import.meta.url);

createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405).end();
    return;
  }
  const html = await readFile(indexPath);
  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(request.method === 'HEAD' ? undefined : html);
}).listen(port, host, () => {
  console.log(`recipe-flowchart listening on http://${host}:${port}`);
});
