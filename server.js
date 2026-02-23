const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const url = require('url');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Simple status page
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head><title>WebSocket Proxy</title></head>
            <body style="background: #0a0a0f; color: #a78bfa; font-family: monospace; padding: 2rem;">
                <h1>✅ WebSocket Proxy Running</h1>
                <p>Status: 🟢 Online</p>
                <p>Server Time: ${new Date().toLocaleString()}</p>
                <p>Connect using: <code>wss://${req.headers.host}/?target=ws://64.188.90.166:2344</code></p>
            </body>
        </html>
    `);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// WebSocket proxy
wss.on('connection', (clientWs, req) => {
    const params = url.parse(req.url, true);
    const targetUrl = params.query.target;
    
    console.log(`[${new Date().toISOString()}] New connection - Target: ${targetUrl}`);
    
    if (!targetUrl) {
        clientWs.close();
        return;
    }
    
    try {
        const targetWs = new WebSocket(targetUrl);
        
        targetWs.on('open', () => {
            console.log('✅ Connected to target');
            clientWs.send(JSON.stringify({ type: 'system', message: 'Connected' }));
        });
        
        targetWs.on('message', (data) => {
            if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(data.toString());
            }
        });
        
        clientWs.on('message', (data) => {
            if (targetWs.readyState === WebSocket.OPEN) {
                targetWs.send(data.toString());
            }
        });
        
        targetWs.on('error', (err) => {
            console.error('Target error:', err.message);
        });
        
        targetWs.on('close', () => {
            clientWs.close();
        });
        
        clientWs.on('close', () => {
            targetWs.close();
        });
        
    } catch (err) {
        console.error('Error:', err.message);
        clientWs.close();
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Proxy running on port ${PORT}`);
});
