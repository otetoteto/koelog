import { Hono } from 'hono';
import { createNodeWebSocket } from '@hono/node-ws';
import { cors } from 'hono/cors';

export const app = new Hono();

app.use('*', cors({ origin: [
  'http://localhost:5172',
] }));


app.get('/', (c) => c.text('Hello World!'));

const {upgradeWebSocket} = createNodeWebSocket({
  app: app,
})

const wsApp = app.get(
  '/ws',
  upgradeWebSocket((c) => {
    return {
      onMessage(event, ws) {
        console.log(`Message from client: ${event.data}`)
        ws.send('Hello from server!')
      },
      onClose: () => {
        console.log('Connection closed')
      },
    }
  })
)

export type App = typeof wsApp;