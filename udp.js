const dgram = require('dgram');
const server = dgram.createSocket('udp4');


//Connect to p2p STUN server
var RELAY_IP = "";
var RELAY_PORT = 8080;
var PEERS = [];

module.exports = {
    SendAllPeers : function(json){
        for (index = PEERS.length - 1; index >= 0; --index) {
            var TempPeer = PEERS[index];
            var Args = TempPeer.split(":");
            var RHost = Args[0];//{Rhost}
            var RPort = Number(Args[1]);//{Rport}
            server.send(json,RPort,RHost);//Sends packet
        }
    },

    sendPacket : function(msg,port,address){
        server.send(msg,port,address);
    },

    startListen : function(uuid){
        server.bind(4646);
        sendPacket("|ADDPEER|PC-"+uuid+"|", RELAY_PORT, RELAY_IP);
    }
}



server.on('error', (err) => {
  console.log(`error:\n${err.stack}`);
  server.close();
});



server.on('message', (msg, rinfo) => {
    var IP = rinfo.address;
    var Port = rinfo.port;
  console.log(`Got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    var data = msg.toString;
    var Args = data.split("\\|");
    if(Args[1]=="PING"){
        sendPacket("|PONG|",Port,IP);
        //|PING|
        console.log("PING");
    }else if(Args[1]=="ADDPEER"){
        if(!($.inArray(Args[2], PEERS))){
            PEERS.push(Args[2]);
            console.log("AddedPeer: " + Args[2]);
            sendPacket("|PING|", Port, IP);
        }else{
            console.log("Could not add Peer due to it already being on list, PEER Addr: " + Args[2]);
        }
        //|ADDPEER|PeerIP:PeerPort|
    }else if(Args[1]=="GetPeerList"){
        //|GetPeerList|
        for (index = PEERS.length - 1; index >= 0; --index) {
            var Peer = PEERS[index];
            server.send("|ADDPEER|"+Peer+"|",Port,IP);
            console.log("Sending Peer List: " + Peer);
        }
    }else if(Args[1]=="ClearPeerList"){
        //|ClearPeerList|
        PEERS = [];
        console.log("Clearing Peers List");
    }else if(Args[1]=="SHUTDOWN"){
        //|SHUTDOWN|
        console.log("{Shutdown}");
    }
});

server.on('listening', () => {
  const address = server.address();
  console.log(`listening ${address.address}:${address.port}`);
});

function sendPacket(msg,port,address){
    server.send(msg,port,address);
}

