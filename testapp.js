var Server = require('ws').Server;
var port = process.env.PORT || 8080;
var ws = new Server({port: port});
var clientinfo = {};
var clientsLibrary = [];
var id = 0;
var mysql = require('mysql');


var sockets = [];
ws.on('connection', function(socket){
  //assign id;
  var tagid = getId();
  var tagInstruction = {
    your_uid:tagid
  }
  socket.send(JSON.stringify(tagInstruction));

  //socket.id = tagid;
  clientinfo = {
    uid:tagid,
    gender:'Male',
    preferedgender:'All',
    sessionmode:'default',
    status:'Idle',
    type: '',
    intrests:'',
    attempts: 0,
    connectedTo:'',
    connectionKing:'',
    socket:socket
  }
  clientsLibrary.push(clientinfo);
  //clientsLibrary[0].socket.send("Boss");
  //console.log(" - just connected, with id: "+ socket.id);
  //clients[0].send(lookup[id]);

  socket.on('message', function(msg){
    try {
      msg = JSON.parse(msg);
    }catch (e) {
      console.log("Invalid JSON: " + msg);
      msg = {};
    }
    if ('instruction' in msg) {
      if (msg.instruction == "Pair") {
        var type;
        var index = clientsLibrary.findIndex(x => x.uid == msg.uid);
        if (clientsLibrary[index].status != "Searching" && clientsLibrary[index].connectedTo == '') {
          clientsLibrary[index].status = "Searching";
          clientsLibrary[index].type = msg.type;
          clientsLibrary[index].intrests = msg.intrests;
          var message = {
            instruction:'Pairing'
          }
          var uid =  msg.uid;
          socket.send(JSON.stringify(message));
        }
        var uid =  msg.uid;
        if ('attemps' in msg) {
        }else {
          attempts = 0;
        }
        findPair(uid, index, attempts, clientsLibrary[index].intrests, msg.type);
      }
      else if (msg.instruction == "Disconnected") {
        console.log("Disconnected");
        var connecteduid;
        var index = clientsLibrary.findIndex(x => x.uid == msg.uid);
        if (index >= 0) {
          if (clientsLibrary[index].socket.readyState === socket.OPEN) {
            connecteduid = clientsLibrary[index].connectedTo;
            clientsLibrary[index].connectionKing = "";
            clientsLibrary[index].type = "";
            clientsLibrary[index].connectedTo = "";
            clientsLibrary[index].status = "Idle";
          }
        }

        index = clientsLibrary.findIndex(x => x.uid == connecteduid);
        if (index >= 0) {
          if (clientsLibrary[index].socket.readyState === socket.OPEN) {
            connecteduid = clientsLibrary[index].connectedTo;
            clientsLibrary[index].connectionKing = "";
            clientsLibrary[index].type = "";
            clientsLibrary[index].connectedTo = "";
            clientsLibrary[index].status = "Idle";
          }
          var message = {
            instruction: 'Connection Lost'
          }
          clientsLibrary[index].socket.send(JSON.stringify(message));
        }
      }
      else if (msg.instruction == "Change gender") {
        var index = clientsLibrary.findIndex(x => x.uid == msg.uid);
        if (index >= 0) {
          clientsLibrary[index].gender = msg.gender;
        }
      }
      else if (msg.instruction == "Prefered gender") {
        var index = clientsLibrary.findIndex(x => x.uid == msg.uid);
        if (index >= 0) {
          clientsLibrary[index].preferedgender = msg.gender;
          console.log("PREFERED GENDER IS " + msg.gender);
        }
      }
      else if (msg.instruction == "Change session") {
        var index = clientsLibrary.findIndex(x => x.uid == msg.uid);
        if (index >= 0) {
          clientsLibrary[index].sessionmode = msg.sessionmode;
        }
      }
      else if (msg.instruction == "Typing") {
        var index = clientsLibrary.findIndex(x => x.uid == msg.uid);
        if (clientsLibrary[index].socket.readyState === socket.OPEN) {
          var message = {
            instruction: 'Typing'
          }
          clientsLibrary[index].socket.send(JSON.stringify(message));
        }
      }
      else if (msg.instruction == "candidate") {
        var index = clientsLibrary.findIndex(x => x.uid == msg.pairid);
        if (index >= 0) {
          console.log("Sending candidate to " + clientsLibrary[index].gender);
          if (clientsLibrary[index].socket.readyState === socket.OPEN) {
            var message = {
              instruction: "candidate",
              candidate: msg.candidate
            }
            clientsLibrary[index].socket.send(JSON.stringify(message));
          }
        }
      }
      else if (msg.instruction == "answer") {
        var index = clientsLibrary.findIndex(x => x.uid == msg.pairid);
        if (index >= 0) {
          if (clientsLibrary[index].socket.readyState === socket.OPEN) {
            var message = {
              instruction: 'answer',
              answer: msg.answer,
            }
            console.log("Sending answer to " + clientsLibrary[index].gender);
            clientsLibrary[index].socket.send(JSON.stringify(message));
          }
        }
      }else if (msg.instruction == "End video") {
        var index = clientsLibrary.findIndex(x => x.uid == msg.pairid);
        if (index >= 0) {
          if (clientsLibrary[index].socket.readyState === socket.OPEN) {
            clientsLibrary[index].connectionKing = "";
            clientsLibrary[index].type = "";
            clientsLibrary[index].connectedTo = "";
            var message = {
              instruction: 'Video ended',
            }
            clientsLibrary[index].socket.send(JSON.stringify(message));
          }
        }

        index = clientsLibrary.findIndex(x => x.uid == msg.uid);
        if (index >= 0) {
          if (clientsLibrary[index].socket.readyState === socket.OPEN) {
            clientsLibrary[index].connectionKing = "";
            clientsLibrary[index].type = "";
            clientsLibrary[index].connectedTo = "";
          }
        }
      }else {
        console.log("Unkown instruction");
      }
    }
    else if ('sendTo' in msg) {
      var index = clientsLibrary.findIndex(x => x.uid == msg.sendTo);
      if (clientsLibrary[index].socket.readyState === socket.OPEN) {
        var message = {
          message: msg.message
        }
        clientsLibrary[index].socket.send(JSON.stringify(message));
      }else {
        index = clientsLibrary.findIndex(x => x.uid == msg.uid);
        if (index >= 0) {
          if (clientsLibrary[index].socket.readyState === socket.OPEN) {
            connecteduid = clientsLibrary[index].connectedTo;
            clientsLibrary[index].connectionKing = "";
            clientsLibrary[index].type = "";
            clientsLibrary[index].connectedTo = "";
            clientsLibrary[index].status = "Idle";
          }
          var message = {
            instruction: 'Connection Lost'
          }
          clientsLibrary[index].socket.send(JSON.stringify(message));
        }
      }
    }
    else if ('offer' in msg) {
      var index = clientsLibrary.findIndex(x => x.uid == msg.pairid && x.connectionKing != msg.pairid);
      if (index >= 0) {
        console.log("Sending offer to " + clientsLibrary[index].gender);
        if (clientsLibrary[index].socket.readyState === socket.OPEN) {
          var message = {
            instruction: "offer",
            offer: msg.offer,
            uid: msg.uid
          }
          clientsLibrary[index].socket.send(JSON.stringify(message));
        }
      }
    }else {
      console.log("Unknown object sent");
    }
    //clients[0].send('message');
  });

  socket.on('close', function() {
    clientsLibrary.forEach((item, i) => {
      if (item.socket.readyState === socket.CLOSED) {
        if (item.connectedTo != '') {
          var index = clientsLibrary.findIndex(x => x.uid == item.connectedTo);
          if (index >= 0) {
            if (clientsLibrary[index].socket.readyState === socket.OPEN) {
              clientsLibrary[index].connectionKing = "";
              clientsLibrary[index].type = "";
              clientsLibrary[index].connectedTo = "";
              clientsLibrary[index].status = "Idle";
              var message = {
                instruction: 'Connection Lost'
              }
              clientsLibrary[index].socket.send(JSON.stringify(message));
            }
          }
        }
        clientsLibrary.splice(i,1);
        console.log("Client lost is " + item.uid);
        console.log("Number of clients is now " + clientsLibrary.length);
      }
    });
  });

});

function getId() {
  function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  return s4() + s4() + '-' + s4();
}

function findPair(uid, searcherIndex, attempts, intrests, type) {
  var sessionmode = clientsLibrary[searcherIndex].sessionmode;
  var isFound = false;
  let findAny = false;
  var message1;
  var message2;
  var message;
  var isGenderPaired = false;
  var ignoreGender = false;
  if (intrests.includes(",")) {
    intrests = intrests.split(",");
  }
  var attempts = clientsLibrary[searcherIndex].attempts;
  attempts++;
  if (attempts >= 10 && clientsLibrary[searcherIndex].intrests != '') {
    findAny = true;
  }
  if (attempts >= 15 && clientsLibrary[searcherIndex].intrests != '') {
    ignoreGender = true;
  }
  clientsLibrary[searcherIndex].attempts = attempts;
  if (clientsLibrary[searcherIndex].status == "Paired") {
  }else {
    if (clientsLibrary[searcherIndex].intrests == '' || findAny == true) {
      var index;
      if (findAny == true) {
        if (clientsLibrary[searcherIndex].preferedgender == "All") {
          index = clientsLibrary.findIndex(x => x.status === 'Searching' && x.uid != uid && x.sessionmode == sessionmode && x.type == type && x.attempts > 10 && x.preferedgender == 'All');
        }else {
          index = clientsLibrary.findIndex(x => x.status === 'Searching' && x.uid != uid && x.sessionmode == sessionmode && x.type == type && x.gender == clientsLibrary[searcherIndex].preferedgender && x.attempts > 10);
          isGenderPaired = true;
        }
      }else {
        if (clientsLibrary[searcherIndex].preferedgender == "All") {
          index = clientsLibrary.findIndex(x => x.status === 'Searching' && x.uid != uid && x.sessionmode == sessionmode && x.intrests == '' && x.type == type && x.preferedgender == "All");
          console.log(isGenderPaired + " (1)for a person who preferes " + clientsLibrary[searcherIndex].preferedgender);
        }else {
          index = clientsLibrary.findIndex(x => x.status === 'Searching' && x.uid != uid && x.sessionmode == sessionmode && x.intrests == '' && x.type == type && x.gender == clientsLibrary[searcherIndex].preferedgender);
          isGenderPaired = true;
          console.log(isGenderPaired + " (2)for a person who preferes " + clientsLibrary[searcherIndex].preferedgender);

        }
      }
      if (index < 0) {
      }else {
        console.log(isGenderPaired + " (3)for a person who preferes " + clientsLibrary[searcherIndex].preferedgender);

        clientsLibrary[searcherIndex].attempts = 0;
        clientsLibrary[index].status = "Paired";
        clientsLibrary[searcherIndex].status = "Paired";
        clientsLibrary[index].connectionKing = clientsLibrary[searcherIndex].uid;
        clientsLibrary[searcherIndex].connectionKing = clientsLibrary[searcherIndex].uid;
        clientsLibrary[index].connectedTo = clientsLibrary[searcherIndex].uid;
        clientsLibrary[searcherIndex].connectedTo = clientsLibrary[index].uid;
        message1 = {
          instruction: 'Connected',
          uid: clientsLibrary[index].uid
        }
        message2 = {
          instruction: 'Connected',
          uid: clientsLibrary[searcherIndex].uid
        }
        if (isGenderPaired == true) {
          message1.genderPaired = "a " + clientsLibrary[index].gender + " stranger";
          message2.genderPaired = "a person who prefers your gender.";
        }
        if (sessionmode == 'question') {
          message1.questionComing = '';
          message2.questionComing = '';
          clientsLibrary[searcherIndex].socket.send(JSON.stringify(message1));
          clientsLibrary[index].socket.send(JSON.stringify(message2));
          var questionsCount;
          var questionIndex;
        }else {
          clientsLibrary[searcherIndex].socket.send(JSON.stringify(message1));
          clientsLibrary[index].socket.send(JSON.stringify(message2));
        }
        isFound = true;
      }
    }else {
      for (var i = 0; i < clientsLibrary.length; i++) {
         var skip = false;
        if (clientsLibrary[i].status == "Searching" && clientsLibrary[i].intrests != "" && clientsLibrary[i].uid != uid && clientsLibrary[i].sessionmode == sessionmode && clientsLibrary[i].type == type) {
          if (clientsLibrary[searcherIndex].preferedgender != "All") {
            if (clientsLibrary[searcherIndex].preferedgender != clientsLibrary[i].gender) {
              skip = true;
            }else {
              isGenderPaired = true;
            }
          }else {
            if (clientsLibrary[i].preferedgender != "All") {
              if (clientsLibrary[searcherIndex].preferedgender != clientsLibrary[i].gender) {
                skip = true;
              }else {
                isGenderPaired = true;
              }
            }
          }

          if (skip == false) {
            if (clientsLibrary[i].intrests.includes(",") && intrests.constructor === Array) {
              var compareArray = clientsLibrary[i].intrests.split(",");
              let intersection = compareArray.filter(x => intrests.includes(x));
              if (intersection.length > 0) {
                clientsLibrary[searcherIndex].attempts = 0;
                clientsLibrary[i].status = "Paired";
                clientsLibrary[searcherIndex].status = "Paired";
                clientsLibrary[i].connectionKing = clientsLibrary[searcherIndex].uid;
                clientsLibrary[searcherIndex].connectionKing = clientsLibrary[searcherIndex].uid;
                clientsLibrary[i].connectedTo = clientsLibrary[searcherIndex].uid;
                clientsLibrary[searcherIndex].connectedTo = clientsLibrary[i].uid;
                message1 = {
                  instruction: 'Connected',
                  uid: clientsLibrary[i].uid,
                  matchingIntrests: intersection.toString()
                }
                message2 = {
                  instruction: 'Connected',
                  uid: clientsLibrary[searcherIndex].uid,
                  matchingIntrests: intersection.toString()
                }
                if (isGenderPaired == true) {
                  message1.genderPaired = "a " + clientsLibrary[i].gender + " stranger";
                  message2.genderPaired = "a person who prefers your gender.";
                }
                if (sessionmode == 'question') {
                  var questionsCount;

                }
                clientsLibrary[searcherIndex].socket.send(JSON.stringify(message1));
                clientsLibrary[i].socket.send(JSON.stringify(message2));
                isFound = true;
                break;
              }
            }else {
              var breakOff = false;
              var matchesFound;
              if (clientsLibrary[i].intrests.includes(",") && intrests.constructor !== Array) {
                var compareArray = clientsLibrary[i].intrests.split(",");
                for (var j = 0; j < compareArray.length; j++) {
                  if (compareArray[j] == intrests) {
                    matchesFound = intrests;
                    breakOff = true;
                    console.log("Noda f1");
                  }
                }
              }else if (!clientsLibrary[i].intrests.includes(",") && intrests.constructor === Array) {
                for (var k = 0; k < intrests.length; k++) {
                  if (intrests[k] == clientsLibrary[i].intrests) {
                    matchesFound = clientsLibrary[i].intrests;
                    breakOff = true;
                  }
                }
              }else if (!clientsLibrary[i].intrests.includes(",") && intrests.constructor !== Array) {
                if (clientsLibrary[i].intrests == intrests) {
                  matchesFound = intrests;
                  breakOff = true;
                  console.log("Noda f3");
                }
              }else {

              }
              if (breakOff == true) {
                message1 = {
                  instruction: 'Connected',
                  uid: clientsLibrary[i].uid,
                  matchingIntrests: matchesFound
                }
                message2 = {
                  instruction: 'Connected',
                  uid: clientsLibrary[searcherIndex].uid,
                  matchingIntrests: matchesFound
                }
                if (isGenderPaired == true) {
                  message1.genderPaired = "a " + clientsLibrary[i].gender + " stranger";
                  message2.genderPaired = "a person who prefers your gender.";
                }
                if (sessionmode == 'question') {
                  var questionsCount;

                }
                clientsLibrary[searcherIndex].attempts = 0;
                clientsLibrary[i].status = "Paired";
                clientsLibrary[searcherIndex].status = "Paired";
                clientsLibrary[i].connectionKing = clientsLibrary[searcherIndex].uid;
                clientsLibrary[searcherIndex].connectionKing = clientsLibrary[searcherIndex].uid;
                clientsLibrary[i].connectedTo = clientsLibrary[searcherIndex].uid;
                clientsLibrary[searcherIndex].connectedTo = clientsLibrary[i].uid;
                clientsLibrary[searcherIndex].socket.send(JSON.stringify(message1));
                clientsLibrary[i].socket.send(JSON.stringify(message2));
                isFound = true;
                break;
              }
            }
          }
        }
      }
    }
    if (isFound == false) {
      message = {
        instruction: 'No pair',
        attemps: attempts
      }
      clientsLibrary[searcherIndex].socket.send(JSON.stringify(message));
    }
  }
}


function send(arguments) {

}

console.log("Runing on port 8080");
