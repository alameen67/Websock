const { createServer } = require('http');
const WebSocket = require('ws');
const url = require('url');

const server = createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    const params = url.parse(req.url, true);
    const target = params.query.target;
    
    if (!target) {
        ws.close();
        return;
    }
    
    const client = new WebSocket(target);
    
    client.on('open', () => {
        client.on('message', (data) => ws.send(data));
        ws.on('message', (data) => client.send(data));
    });
    
    client.on('error', () => ws.close());
    ws.on('close', () => client.close());
});

server.listen(process.env.PORT || 3000);
