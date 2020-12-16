import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import ionSfu from 'ion-sfu-nodejs';
import { Base64 } from 'js-base64';

const app = express();
function uuid() {
  var uuid = "", i, random;
  for (i = 0; i < 32; i++) {
      random = Math.random() * 16 | 0;

      if (i == 8 || i == 12 || i == 16 || i == 20) {
          uuid += "-"
      }
      uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
  }
  return uuid;
}

// app.get('/', function(req, res) {
//   res.sendFile(path.join(__dirname + '/www/index.html'));
// });

app.use(express.static(__dirname + '/www'));

//initialize a simple http server
const server = http.createServer(app);
const connectedPeers = new Map();
//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: WebSocket) => {
  const sfu = new ionSfu();
  const socketID = uuid();
  connectedPeers.set(socketID, ws);

  ws.on("close", () => {
    connectedPeers.delete(socketID);
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

  for (const [socketid, ws] of connectedPeers.entries()) {
    if (socketid === socketID) {
      ws.send(JSON.stringify(message));
    }
   }

    // ws.send(JSON.stringify(message));
})

sfu.event.on("onDescription", e => {
 // console.log("onAswer", e);
  const desc = JSON.parse(e)
  let message = {
        type: "offer",
        data: desc,
                  }
                for (const [socketid, ws] of connectedPeers.entries()) {
                 if (socketid !== socketID) {
                 ws.send(JSON.stringify(message));
                 }
      }
})

// const bouncer = (arr: any) => {
//   return arr.filter(Boolean)
// }

sfu.event.on("onTrickle", (target, trickle) => {
 // console.log("on trickle###", target, trickle);
   const can = JSON.parse(trickle)
   console.log("server trickle@@@@=> ",target, can)
  let message = {
    type: "trickle",
    data: {
      target: target,
      candidate: can,
    }
  }
   for (const [socketid, ws] of connectedPeers.entries()) {
     if (socketid === socketID) {
      ws.send(JSON.stringify(message));
     // console.log("Trickle sending@@", socketid)
   }  }
   //ws.send(JSON.stringify(message));
})

sfu.event.on("onIceconnectionstate", e => {
  console.log("icechanged!!", e);
})

sfu.event.on("onError", e => {
  console.log(e);
})

const Join =(event: any) => {
  //  console.log("join print=> ", event)
  // console.log("-----------------------")
  // console.log("income payload===>> ", JSON.stringify(event))
  // console.log("-----------------------")
  const offer = JSON.stringify(event.offer);
  // console.log("-----------------------")
  //   console.log("offer ", offer, event.id, event.sid)
  //   console.log("-----------------------")
    sfu.Join(offer, event.id, event.sid)
  //   const message = {
  //       type: "offer",
  //       data: event
  //   }
  //  conn.send(JSON.stringify(message));
  }

  const Offer = (event: any) => {
    const desc = JSON.stringify(event.desc)
   // console.log("reoffer: ", desc);
    sfu.Description(desc);
  }

  const Trickle = (event: any) => {
    const tickle = JSON.stringify(event.candidate);
    sfu.Trickle(event.target,  tickle);
  }

  const Answer = (event: any) => {
    // console.log("answer recieved", event)
    const desc = JSON.stringify(event)
    // console.log(desc)
    sfu.Description(desc)
  }

   // socket events from client
    ws.on('message', (message: string) => {
      const event = JSON.parse(message)

      switch (event.type) {
        case "joinRoom":
          Join(event.data)
          // console.log(event.data)
          break;
        case "offer":
          console.log("@@@@@reoffer ")
          Offer(event.data)
          break;
        case "answer":
          Answer(event.data)
         // console.log(event.data)
          break;
        case "trickle":
          Trickle(event.data)
          // console.log(event.data)
          break;
        default:
          break;
      }
        //log the received message and send it back to the client
       //  console.log('received: %s', message);
       // ws.send(`Hello, you sent -> ${message}`);
    });

    //send immediatly a feedback to the incoming connection
    // ws.send('Hi there, I am a WebSocket server');
});

// end ion-sfu events listener


//start our server
server.listen(8080, () => {
    console.log(`Server started on port 8080`);
});