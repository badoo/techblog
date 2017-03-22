---
layout: post
title: WebRTC - Making a peer-to-peer game using JavaScript
author: Alexander Gutnikov
date:   2017-03-21
categories: JavaScript Game-development
excerpt: As a rule, when people talk about WebRTC, they mean the organisation of audio and video connections, but this technology can also be used for other interesting things as well. I decided to try to make a peer-to-peer game and to share my experience in creating it.
---
I recently had the chance to work on a prototype for a video chat service. It was an excellent opportunity to become more closely acquainted with WebRTC concepts and to try them out in practice. As a rule, when people talk about WebRTC, they mean the organisation of audio and video connections, but this technology can also be used for other interesting things as well. I decided to try to make a peer-to-peer game and to share my experience in creating it. Scroll down to see a video of the result and the details of how I did it.

<img class="no-box-shadow" src="{{page.imgdir}}/1.png"/>

<iframe width="560" height="315" src="https://www.youtube.com/embed/-kKUFLyCyJw" frameborder="0" allowfullscreen></iframe>

## Game engine

Some time ago I saw a demo version of a game with nice pixel art graphics. The game had been made using the JavaScript engine, <a href="http://impactjs.com/">Impact</a>.

<img class="no-box-shadow" src="{{page.imgdir}}/2.png"/>

The engine costs money and I had bought it a couple of years ago, but I hadn’t done anything useful with it. Now, finally, it would come in useful. I should say that in and of itself the process of creating a game using this engine is very absorbing and, for people like me who want – quickly and inexpensively – to feel like serious ‘game makers,’ it is just what you need. Having decided on which communication technology and game engine to use, you can move on to the implementation stage. As for me, I started with the game rooms.

## Game rooms

How does a player get into the game and how can they invite their friends? Lots of online games use what are called game rooms or channels, so that players can play one another. This requires a server which allows you to create the rooms in question and add/remove users. It is a pretty simple set-up: when the user launches the game, and, in our case, opens the game’s URL in the browser window, the following happens:

1.	A new player communicates to the server the name of the room in which they would like to play;
2.	The server responds by sending back a list of players in the room in question;
3.	The other players receive a message that a new participant has appeared.

<img class="no-box-shadow" src="{{page.imgdir}}/3.png"/>

All this is pretty simple to implement, for example using node.js + socket.io. You can see here how it turned out. After the player has joined the game room, they have to set up a peer-to-peer connection with each of the players present in the room. However, before we move on to implementing peer-to-peer data, I suggest we have a think about what, in principle, this data will be.

## Interaction protocol

The format and content of the messages sent between players very much depends on what happens in the game. In our case, it is a simple 2D shooting game in which players run around and shoot one another. So, in the first instance, you need to know the position of the players on the map:

{% highlight JavaScript %}

message PlayerPosition {
	int16 x;
	int16 y;
}

{% endhighlight %}

When you receive this message, you will know where a player is positioned, but you cannot know what they look like at the present time. So, for a full picture, you can add information on what animation the player has switched on at the present time, what frame it is in and which way they are looking:

{% highlight javascript %}

message PlayerPositionAndAnimation {
	int16 x;
	int16 y;
	int8 anim;
	int8 animFrame;
	bool flipped;
}

{% endhighlight %}

Excellent! What other messages do we need? Depending on what you are planning to do in the game, you will have your own set of messages. Here, basically, is my set:

- Player dies ();
- Player is born ( int16 x, int16 y );
- Player shoots ( int16 x, int16 y, boolean flipped );
- Player selects weapon ( int8 weapon_id).

## Standardised fields in messages

As you may have noticed, each of the fields in these messages has its own data type, for example *int16* — for fields which specify coordinates. Let’s look into this first of all, and along the way I will tell you a little bit about WebRTC API. The thing is, that to transfer data between peers an object such as RTCDataChannel is used, which, in turn, is able to work with data such as *USVString, BLOB, ArrayBuffer or ArrayBufferView*. And in order to use *ArrayBufferView* you need to be clear about what format the data will be in.

Right, having described all the messages, we are ready to continue and to move on to the actual organisation of the interaction between peers. Here I will try to describe the technical side as briefly as I can. In actual fact, trying to discuss every aspect of WebRTC in detail is a long and complicated process, particularly in the light of the fact that <a href="https://hpbn.co/">Ilya Grigorik's book</a> is available in the public domain – a real treasure trove of information on this and other subjects in respect of network interaction. My aim, as I have already stated, is to describe in brief the basic workings of WebRTC – studying these is the starting point for everyone.

## Setting up a connection

What do users A and B need to set up a peer-to-peer connection between themselves? Well, each of the users needs to know at least the address and port where his opponent is listening and is able to receive incoming data. But how can A and B communicate this information to one another if the connection has not yet been set up? To transfer this information, a server is required. In WebRTC jargon this is called a signalling server. And since a server has already been set up for the game rooms, this same server may also be used as a signalling server.

Also, besides addresses and ports, A and B must agree the parameters of the session to be set up (for example, in respect of the use of various codecs and their parameters in the case of audio and video connections). The format of the data describing all sorts of different connection characteristics is called SDP — Session Description Protocol. You can find out more about this at <a href="https://webrtchacks.com/sdp-anatomy/">webrtchacks.com</a>. Right, based on what we have said above, the procedure for data exchange via signalling is as follows:

1.	User A sends a request for connection to user B;
2.	User B confirms the request from A;
3.	Having received confirmation, user A identifies their IP, port, any session parameters and sends these to user B;
4.	User B responds by sending their address, port and session parameters to user A.

Once these operations have been completed, both users know each other’s address and parameters and can start exchanging data. However, before moving on to the implementation stage, it is worth finding out some more about identifying IP address + port pairings.

## Address identification and verifying accessibility

When each of the users is available via a public IP address or if both are on a single subnet — everything is simple. If this is the case, they can each request their own IP from the operating system and send it via signalling to their opponent. But what do you do if the user is not available directly, but is behind a NAT, and they have two addresses: one local, on the subnet **(192.168.1.1)**, and a second, namely the address of the NAT **(50.76.44.114)**? In this case, they have to somehow identify their public address and port.

The idea for solving this quandary is quite simply: you need a publicly available server which, on receiving a request from you, will respond by sending the public address and port we need.

<img class="no-box-shadow" src="{{page.imgdir}}/4.png"/>

These servers are called STUN (<a href="https://en.wikipedia.org/wiki/STUN">Session Traversal Utilities for NAT</a>). There are ready-to-use solutions, such as coTURN, which can be enabled as your STUN server. But, even simpler, you can use already enabled and accessible servers such as those from Google.

In this way, each one may obtain their own address and send it to their opponent. However, this is not sufficient, since, after having received an address from an opponent, you still need to check whether they can be reached at the address in question.

Fortunately, the ICE (<a href="https://en.wikipedia.org/wiki/Interactive_Connectivity_Establishment">Interactive Connectivity Establishment</a>) framework, which is integrated into the browser, assumes the task of interacting with STUN and verifying accessibility. All that we need to do is to process the events of this framework. Right, let’s move on to the implementation stage …

## Setting up a connection

Initially, it might seem that the process of setting up a connection is quite complex. However, fortunately, the complexity is limited to the RTCPeerConnection interface and in practice everything is simpler than it might appear at first glance. You can view the full code of the class which sets up peer-to-peer connection <a href="https://github.com/gutnikov/webrtc-shooter/blob/master/lib/net/peer-connection.js">here</a>. I will now go on to explain it.

As I have already said, setting up, monitoring and closing down a connection, and also working with SDP and ICE candidates — all this is done via RTCPeerConnection. You can obtain more detailed information about the configuration <a href="https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/RTCPeerConnection">here</a>. However, in terms of configuration, we only need the address of the Google STUN server which I spoke about earlier.

{% highlight JavaScript %}

iceServers: [{
	url: 'stun:stun.l.google.com:19302'
}],
connect: function() {
	this.peerConnection = new RTCPeerConnection({
  	iceServers: this.iceServers
	});
	// ...
}

{% endhighlight %}

RTCPeerConnection offers a range of call-backs for various events in the life cycle of the connection – of which we need the following:

1.	icecandidate — for processing the candidate found;
2.	iceconnectionstatechange — for monitoring the state of the connection;
3.	datachannel — for processing the open data channel.

{% highlight JavaScript %}

init: function(socket, peerUser, isInitiator) {
	// ...
	this.peerHandlers = {
  	'icecandidate': this.onLocalIceCandidate,
  	'iceconnectionstatechange': this.onIceConnectionStateChanged,
  	'datachannel': this.onDataChannel
	};
	this.connect();
  },
  connect: function() {
	// ...
	Events.listen(this.peerConnection, this.peerHandlers, this);
	// ....
}

{% endhighlight %}


## Sending a connection request

The first two points on the list of operations for a connection were sending a request for setting up a connection and confirmation of that request. Let’s simplify the process a bit, and let’s say that if the user knows the address of the game room, then someone gave them the link, and so the request for setting up a connection is not required, and you can move straight on to exchanging session data and addresses.

## Identifying session parameters

For the purposes of receiving session parameters in *RTCPeerConnection*, createOffer has methods for the initiating party to create an offer, and createAnswer for the responding party to create an answer. These methods generate data in SDP format, which must be sent to the opponent via signalling. *RTCPeerConnection* saves both the local session description and the remote session description received via signalling from the opponent. For setting up these fields the *setLocalDescription* and *setRemoteDescription* methods are available. Okay, let’s say that client A initiates a connection. The list of operations would be as follows:

**1.**
Client A creates an SDP offer, sets a local session description in their *RTCPeerConnection*, after which they send it to client B:

{% highlight JavaScript %}

connect: function() {
	// ...
	if (this.isInitiator) {
  	this.setLocalDescriptionAndSend();
	}
  },

  setLocalDescriptionAndSend: function() {
	var self = this;
	self.getDescription()
  	.then(function(localDescription) {
        self.peerConnection.setLocalDescription(localDescription)
      	.then(function() {
        	self.log('Sending SDP', 'green');
            self.sendSdp(self.peerUser.userId, localDescription);
      	});
  	})
  	.catch(function(error) {
    	self.log('onSdpError: ' + error.message, 'red');
  	});
  },

  getDescription: function() {
	return this.isInitiator ?
  	this.peerConnection.createOffer() :
  	this.peerConnection.createAnswer();
  }

{% endhighlight %}

**2.**
Client B receives an offer from client A and sets a remote session description. After this they create an SDP answer, set it as a local session description and send it to client A:

{% highlight JavaScript %}

setSdp: function(sdp) {
	var self = this;
	// Create session description from sdp data
	var rsd = new RTCSessionDescription(sdp);
	// And set it as remote description for peer connection
    self.peerConnection.setRemoteDescription(rsd)
  	.then(function() {
    	self.remoteDescriptionReady = true;
    	self.log('Got SDP from remote peer', 'green');
    	// Add all received remote candidates
    	while (self.pendingCandidates.length) {
          self.addRemoteCandidate(self.pendingCandidates.pop());
    	}
    	// Got offer? send answer
    	if (!self.isInitiator) {
          self.setLocalDescriptionAndSend();
    	}
  	});
  }

{% endhighlight %}

**3.**
After client A has received an SDP answer from client B, they also set it as a remote session description. As a result, each of the clients has set a local session description and a remote session description received from their opponent:

<img class="no-box-shadow" src="{{page.imgdir}}/5.png"/>

## Collecting ICE candidates

Each time an ICE agent from client A finds a new IP+port pairing which can be used for a connection, RTCPeerConnection triggers an *icecandidate* event. The candidate’s data looks like this:

{% highlight html %}

candidate:842163049 1 <b>udp</b> 1677729535 <b>94.221.38.159 60478 typ srflx raddr
192.168.1.157 rport 60478</b> generation 0 ufrag KadE network-cost 50

{% endhighlight %}

This is what we can glean from this data:

1. **udp**: if the ICE agent opts to use this candidate for a connection, then udp transport will be used for the connection;
2. **typ srflx** — this is a candidate obtained by requesting the STUN server to identify the NAT address;
3. **94.221.38.159 60478** — NAT address and port which will be used for the connection;
4. **raddr 192.168.1.157 rport 60478** — address and port inside NAT.

You can read up in more detail about the ICE candidates’ description protocol <a href="https://tools.ietf.org/html/rfc5245#section-1">here</a>.

This data needs to be transferred via signalling to client B, so that they can add them to their RTCPeerConnection. Client B does exactly the same thing when they discover their own IP+port pairings:

{% highlight JavaScript %}

// When ice framework discovers new ice candidate, we should send it
  // to opponent, so he knows how to reach us
  onLocalIceCandidate: function(event) {
	if (event.candidate) {
  	this.log('Send my ICE-candidate: ' + event.candidate.candidate, 'gray');
      this.sendIceCandidate(this.peerUser.userId, event.candidate);
	} else {
  	this.log('No more candidates', 'gray');
	}
  }


 addRemoteCandidate: function(candidate) {
	try {
      this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  	this.log('Added his ICE-candidate:' + candidate.candidate, 'gray');
	} catch (err) {
  	this.log('Error adding remote ice candidate' + err.message, 'red');
	}
  }

{% endhighlight %}

## Creating a data channel

The final thing to draw attention to is *RTCDataChannel*. This interface offers us API, which helps us to transfer random data, and also to configure the data transfer settings:

- Full or partial guarantee for message delivery;
- Ordered or non-ordered message delivery.

You can find out more details about the *RTCDataChannel* configuration here, for example. For now, it will be sufficient to configure the setting ordered = false, to retain UDP semantics when transferring your data. Like *RTCPeerConnection, RTCDataChannel* offers a range of events describing the life cycle of a data channel. Of these open, close and message are required for opening and closing a channel and receiving a message, respectively:

{% highlight JavaScript %}

init: function(socket, peerUser, isInitiator) {
	// ...
	this.dataChannelHandlers = {
  	'open': this.onDataChannelOpen,
  	'close': this.onDataChannelClose,
  	'message': this.onDataChannelMessage
	};
	this.connect();
  },
  connect: function() {
	// ...
	if (this.isInitiator) {
  	this.openDataChannel(
          this.peerConnection.createDataChannel(this.CHANNEL_NAME, {
    	ordered: false
  	}));
	}
  },
  openDataChannel: function(channel) {
	this.dataChannel = channel;
	Events.listen(this.dataChannel, this.dataChannelHandlers, this);
  }

{% endhighlight %}

And, finally, once a data channel has successfully been opened between players, they can start exchanging game messages.

## More players

We have considered how to set up a connection between two players and this is basically enough, if you are playing one-on-one. But what if we want there to be several players in a given room? What does that change? In actual fact, it doesn’t change anything; it’s just that every pair of players has to have their own connection. This mean, if you are playing in a room with 3 other players, you have to have 3 peer-to-peer connections – one for each of them. You can view the full code of the class responsible for interaction with all the opponents in the room <a href="https://github.com/gutnikov/webrtc-shooter/blob/master/lib/net/room-connection.js">here</a>.

<img class="no-box-shadow" src="{{page.imgdir}}/6.png"/>

Right, so the signalling server with the rooms is ready, and we have discussed the message format and how to deliver the messages. Now, based on all that, how do we make sure the players can see one another?

## Synchronising location

The idea of synchronisation is quite simple: in the space of a given time period you need to send opponents your coordinates once, and then, based on those coordinates, they can display your true location.

How often do you need to send synchronised messages? Ideally the opponent should see updates as often as the player themselves, i.e. if the game is operating at a frame rate of 30-60 frames per second, then messages should be sent at that same frequency. However, this is a rather naïve solution, and in the end a lot depends on the dynamic of the game itself. For example, is it worth sending coordinates so frequently, if they only change every 10-20 seconds? If that’s the case, it’s probably not worth it. In my case, the animation and the position of the players change relatively frequently, and so I opted for the simple answer: sending a message with coordinates for every frame.

Sending a synchronised message:

{% highlight JavaScript %}

update: function() {
	// ...
	// Broadcast state
    this.connection.broadcastMessage(MessageBuilder.createMessage(MESSAGE_STATE)
  	.setX(this.player.pos.x * 10)
  	.setY(this.player.pos.y * 10)
  	.setVelX((this.player.pos.x - this.player.last.x) * 10)
  	.setVelY((this.player.pos.y - this.player.last.y) * 10)
      .setFrame(this.player.getAnimFrame())
  	.setAnim(this.player.getAnimId())
      .setFlip(this.player.currentAnim.flip.x ? 1 : 0));
	// ...
  }

{% endhighlight %}

Receiving a synchronised message:

{% highlight JavaScript %}

onPeerMessage: function(message, user, peer) {
  // ...
  switch (message.getType()) {
  	case MESSAGE_STATE:
    	this.onPlayerState(remotePlayer, message);
    	break;

  	// ...
	}
  },

  onPlayerState: function(remotePlayer, message) {
	remotePlayer.setState(message);
  },

  // in RemotePlayer class:
  setState: function(state) {
  	var x = state.getX() / 10;
  	var y = state.getY() / 10;
  	this.dx = state.getVelX() / 10;
  	this.dy = state.getVelY() / 10;
  	this.pos = {
    	x: x,
    	y: y
      };
  	this.currentAnim = this.getAnimById(state.getAnim());
  	this.currentAnim.frame = state.getFrame();
  	this.currentAnim.flip.x = !!state.getFlip();
  	this.stateUpdated = true;
 }

{% endhighlight %}

Unfortunately, it worked out that this only operates without a time-lapse as long as you don’t start playing with a real person who is sitting at another computer and not on the same network as you. Because in that case it starts working like this:

<img class="no-box-shadow" src="{{page.imgdir}}/7.gif"/>

The thing is, that for the image to be uninterrupted, the messages need to be delivered at a consistent frequency – with the same frequency as they are being sent. It is practically impossible to achieve this under real-world conditions, and so the time gaps between incoming messages are constantly changing, creating an effect which is unpleasant for the eyes. This can be overcome using coordinate extrapolation.

## Coordinate extrapolation  

To start off with, you need to get to the bottom of how the delay with the messages has an effect on the quality of the image which the player sees. In order for the movement of the image to be uninterrupted, messages need to arrive at an even interval which is also close to the rate at which the frames are updated in the game:

<img class="no-box-shadow" src="{{page.imgdir}}/8.png"/>

In practice, it works out differently. The intervals between the messages are distributed unevenly which makes the animation ‘jump’ and the coordinates change:

<img class="no-box-shadow" src="{{page.imgdir}}/9.png"/>

Looking at the second diagram, you can see what happens when there is an increased time-lapse with the messages: first of all the player sees the image freeze, and then the image jumps. This is what produces the unpleasant effect.

The movement would be much more uninterrupted, if, when the messages are delayed, the player's coordinates changed proportionally, even if they are not always reliably accurate:

<img class="no-box-shadow" src="{{page.imgdir}}/10.png"/>

And, actually, if you analyse the players’ movement, you realise that they don’t usually suddenly change direction and that means that, if, at a given moment, the following coordinate message has not been received, then we can estimate the coordinates on the basis of, for example, the speed at which they were travelling in the previous frame. To do this, you either need to calculate the speed on the receiving end or simply send it along with the coordinates. As usual, I go for the simplest option and send the speed along with the coordinates. And now, if in a given frame, there was no message updating the coordinates, then the coordinates can be calculated based on the speed at which the player was travelling in the previous frame:

{% highlight JavaScript %}

setState: function(state) {
   	var x = state.getX() / 10;
   	var y = state.getY() / 10;
   	this.dx = state.getVelX() / 10;
   	this.dy = state.getVelY() / 10;
   	this.pos = {
          	x: x,
          	y: y
   	};
   	this.currentAnim = this.getAnimById(state.getAnim());
   	this.currentAnim.frame = state.getFrame();
   	this.currentAnim.flip.x = !!state.getFlip();
   	this.stateUpdated = true;
},
update: function() {
   	if (this.stateUpdated) {
          	this.stateUpdated = false;
   	} else {
          	this.pos.x += this.dx;
          	this.pos.y += this.dy;
   	}
   	if( this.currentAnim ) {
          	this.currentAnim.update();
   	}
}

{% endhighlight %}

And this is what it looks like after extrapolation:

<img class="no-box-shadow" src="{{page.imgdir}}/11.gif"/>

Of course, this method has lots of drawbacks and, if the connection is particularly slow, then this can happen:

<img class="no-box-shadow" src="{{page.imgdir}}/12.gif"/>

However, performing extrapolation is far beyond the scope of the present article, and so I suggest that we stop here.

## Other game actions

Besides moving around on the map, it would also be good to get some ammunition and shoot someone. What I mean by that, is that there is a whole range of actions which the player performs in the game, and they also relate to the issue of synchronisation. Fortunately, this presents far fewer problems than in the case of movement synchronisation: it is sufficient simply to reproduce the event received via a message. That is why I am not going to go into detail, but will simply direct you to the project code.

## How it all worked out

You can view the code (apart from the source code of ImpactJS itself) and instructions for launching it on <a href="https://github.com/gutnikov/webrtc-shooter">github</a>.

I will take the risk of giving out the link where you can try to play it <a href="https://138.68.96.105/">here</a>. I don’t know what will happen to my single-core Droplet, but *que sera, sera* =)

If you have read this right to the end – thank you! That means my work has not been wasted and you have found something interesting for yourself. Feel free to write any questions, feedback and suggestions in the comments section.

**Alexander Gutnikov, Frontend developer.**
