import { WebSocketServer } from "ws";

const wss=new WebSocketServer({port:3002})

export function broadcast(data:any){
    wss.clients.forEach((client)=>{
        if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
    })
}