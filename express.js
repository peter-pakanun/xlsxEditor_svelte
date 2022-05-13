import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { parse } from 'cookie';
import clientPromise from './src/lib/db.js';

const app = express();
const server = createServer(app);
const io = new Server(server);

io.use(async (socket, next) => {
  const cookies = parse(socket?.handshake?.headers?.cookie ?? '');
  if (cookies.session_id) {
    const client = await clientPromise;
    const Users = client.db().collection('users');
    const Sessions = client.db().collection('sessions');

    const session = await Sessions.findOne({ id: cookies.session_id }).catch(err => { console.error(err) });
    if (session) {
      socket.user = await Users.findOne({ username: session.username }).catch(err => { console.error(err) });
    }
  }
  next();
});

io.on('connection', (socket) => {
  if (socket.user) {
    console.log(`${socket.user.username} connected`);
  } else {
    console.log('Anonymous connected');
  }
});

async function start() {
  await clientPromise;

  let port;

  if (process.env.NODE_ENV === 'production') {
    let { handler } = await import('./build/handler.js');
    app.use(handler);
    port = process.env.PORT || 3000;
  } else {
    port = 3001;
  }

  server.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}

start();