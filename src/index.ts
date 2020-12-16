import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import ionSfu from 'ion-sfu-nodejs';
import { Base64 } from 'js-base64';

const app = express();

app.use(express.static(__dirname + '/www'));

//initialize a simple http server
const server = http.createServer(app);
//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: WebSocket) => {
  const sfu = new ionSfu();

  ws.on("close", () => {
  })

  /// events from ion-sfu event listener
sfu.event.on("onJoin", (ID, Desc) => {
   //console.log("answer", ID, Desc);
  const desc = JSON.parse(Desc)
  const message = {
    type: "answer",
    id: ID,
    data: desc
  }

      ws.send(JSON.stringify(message));
})

sfu.event.on("onDescription", e => {
 // console.log("onAswer", e);
  const desc = JSON.parse(e)
  let message = {
        type: "offer",
        data: desc,
              }
      ws.send(JSON.stringify(message));
});


sfu.event.on("onTrickle", (target, trickle) => {
   const can = JSON.parse(trickle)
  let message = {
    type: "trickle",
    data: {
      target: target,
      candidate: can,
    }
  }
      ws.send(JSON.stringify(message));
})

sfu.event.on("onIceconnectionstate", e => {
  console.log("icechanged!!", e);
})

sfu.event.on("onError", e => {
  console.log(e);
})

const Join =(event: any) => {
  const offer = JSON.stringify(event.offer);
    sfu.Join(offer, event.id, event.sid)
  }

  const Offer = (event: any) => {
    const desc = JSON.stringify(event.desc)
    sfu.Description(desc);
  }

  const Trickle = (event: any) => {
    const tickle = JSON.stringify(event.candidate);
    sfu.Trickle(event.target,  tickle);
  }

  const Answer = (event: any) => {
    const desc = JSON.stringify(event.desc)
    sfu.Description(desc)
  }

   // socket events from client
    ws.on('message', (message: string) => {
      const event = JSON.parse(message)

      switch (event.type) {
        case "joinRoom":
          Join(event.data)
          break;
        case "offer":
          Offer(event.data)
          break;
        case "answer":
          Answer(event.data)
          break;
        case "trickle":
          Trickle(event.data)
          break;
        default:
          break;
      }

    });
});

// end ion-sfu events listener


//start our server
server.listen(8080, () => {
    console.log(`Server started on port 8080`);
});