---
layout: post
title:  Crazy Agile API
author: Ivan Biryukov, Orene Gauthier
date:   2016-05-11
categories: api process
excerpt: There are lots of articles and books on how to properly design APIs, but only few of them cover the case of a constantly changing API. In fast moving companies, releasing many features per week/day and changing the API is often a necessity. This article will explain how we’ve handled this at Badoo, some mistakes we’ve made along the way and lessons we’ve learned.
---
There are lots of articles and books on how to properly design APIs, but only few of them cover the case of a constantly changing API. In fast moving companies, releasing many features per week/day and changing the API is often a necessity. This article will explain how we’ve handled this at Badoo, some mistakes we’ve made along the way and lessons we’ve learned.

Firstly, let me provide a general description  of how things work at Badoo, who are the API consumers and why does has it changed so frequently.

## API and Consumers
As wikipedia states, “...API is a set of routines, protocols, and tools for building software applications. The API specifies how software components should interact…”.
Our Badoo API is a set of data structures (messages) and values (enum values) that the client and the server send to each other. It is written in Google [protobuf](https://developers.google.com/protocol-buffers/) definitions and stored in a separate git repository.

We have 6 consumer platforms for our API - Server and 5 clients: Android, iOS, Windows Phone, Mobile Web and Desktop Web. We also have multiple apps which all use the same API.
To make them work together we have quite big API in place, here are some numbers:

- 450 messages, 2665 fields
- 135 enums, 2096 values
- 125 features flags that can be controlled from server
- 165 functionality flags. We call them supported features

## This feature should’ve been done yesterday!
At Badoo, we value fast delivery of features. The logic behind it is simple: the faster something is on production the sooner the users will get value from it. We also run loads of A/B tests in parallel but that's out of the scope of this article.

Idea to production can take a week, this includes writing the spec, getting the designs, developing the API, writing tech documentation, implementing it on the various clients, testing, and releasing. On average it would take about a month though. This doesn't mean we release one feature per month as we work on loads of features in parallel.

## How to do the impossible?
Let’s say that the product owner has a new idea and comes to API team asking to update the protocol so that all clients can start implementing it.

First of all, there’re a lot of people who usually work on the feature:

- Product owner
- Designers
- Server side developers
- Client side developers for different platforms
- QA
- Data analysts

How can we ensure that we all understand each other and speak the same language? We need requirements.
Proper requirements
To address that product owners (POs) create [Product requirements document](https://en.wikipedia.org/wiki/Product_requirements_document) (PRD).
Basically they create a wiki page with different requirements, use cases, flow descriptions, designs sketches, etc.

Then, based on the PRD we can start implementing the required API changes.

<div style="clear:both"></div>
<br/>

### Protocol design approach.
There are endless ways to split the responsibilities between the client and the server. They range between “Server implements most of the logic” and “Client implements most of the logic”. Let’s examine pros and cons of each approach:

1. “Server implements most of the logic” - The clients act more like a View from MVC pattern.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + Implement functionality only once for all platforms - on the server.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + Can update server-side logic and lexemes without changing and releasing client app (Big plus when it comes to native apps).

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; - More complex protocol - usually more steps in the flow and more data passed.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; - If the behaviour is different on different clients, server still has to have and support separate implementation for the feature for every client and it’s supported versions.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;  - Can affect user experience on slow/unstable networks.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;  - Keeping business logic on the server side makes it hard or even impossible for some features to have some offline behaviour.

<div style="clear:both"></div>
<br/>

&nbsp;&nbsp;&nbsp;2. “Client implements most of the logic” - Client has all the logic and uses server as data source (like many public data-oriented APIs).

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + Better user experience due to less waiting on server replies.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + Works much better offline and poor connections.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + Caching is much simpler.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + Easier to implement different behaviour on different platforms and versions of the clients if required.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + less complex flows - teams can be more autonomous.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; - Slower - every client has to make complete own implementation of all logic rather than only once on the server.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; - To make some even minor changes,all clients need to be updated separately.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; - More bug prone - every client has to make their complete own implementation of all logic.

On one hand, using the first approach means you only need to implement certain business logic once on the server which is then used on all the clients. On the other hand specific platforms often have their own peculiar properties, specialised lexemes structure, different functionality and features implemented at different points in time. Thus it makes it easier to make protocol more data-oriented so clients have some freedom for doing things their own way.

It turns out that there is no silver bullet, as usual, and in Badoo we balance the two approaches to maximise the advantages.

<div style="clear:both"></div>
<br/>

### Technical documentation

Several years ago when we were smaller we only had the server and two clients (Android, iOS) using the protocol. It was easy to communicate verbally on how to use it, so the documentation only included some generic logic in the comments for proto definitions. Here is an example of what it looked like:

<img class="no-box-shadow" src="{{page.imgdir}}/1.png"/>

Later three more client platforms joined - Windows Phone, Mobile Web and Desktop Web. Communicating everything verbally was very costly so we started writing better documentation. This documentation was more than just comments about fields but it included an overview of the feature, flow diagrams, screenshots and message examples.
Here is an example of what it looks like:

<img class="no-box-shadow" src="{{page.imgdir}}/2.png"/>

All six platforms and QA use this documentation as a technical reference alongside the PRD when starting to implement features.

The documentation is not only used for new feature implementation but also for redesigns or refactorings when historical information is required. We can now easily tell developers to RTFM which saves the company a great deal of time. Without it, the clients would have to check how things are implemented on the server to understand what is or isn’t safe to do. It’s especially risky when it comes to edge cases. It’s also a great way for new joiners to understand how things are suppose to work.

<div style="clear:both"></div>
<br/>
**Tools we use to make our documentation sexy**

We write technical documentation in [eStructuredText](https://en.wikipedia.org/wiki/ReStructuredText) format and keep it in git repo together with protocol definitions. Using [Sphinx](http://www.sphinx-doc.org/en/stable/) we compile it to html pages that all developers can access in our company’s internal network.

The documentation is split into several major sections that cover different aspects of the protocol and other stuff:

- **Protocol** - contains generated documentation from comments in proto definitions
Product features - contains technical documentation on how features should be implemented. Flow diagram etc..
- **Common** - contains docs about protocol and flows not specific for particular product features.
- **App specifics** - Badoo has more than one product, this section highlights the differences between the products. As mentioned above the protocol is shared.
- **Statistics** - general description on how analytics and stats should be processed and collected in our apps.
- **Push** - documentation regarding native push notifications
- **Architecture and infrastructure** - top-level structure of the protocol, binary protocol formats, ab-testing framework, etc.

<div style="clear:both"></div>
<br/>

### OK, we did the API changes. Are we good to go?

At this point we have designed the protocol and written the technical documentation based on the product specifications.
The PRD and the protocol get reviewed. In the first stage at least one API team member reviews the changes. Then every platform which will be implementing the feature has to review documentation, protocol and approve it.

This stage helps us to get feedback on:

- How the changes correspond to the existing code on each platform
- Check if the proposed protocol is optimal for each of the platforms. We have had cases in the past where we’ve tried to reuse a message, as it was the cleanest solution, but it affected server performance.
- Ensure the change is backwards compatible.

After the review is complete, clients and server can start implementing the feature itself.

But is our job done? No!

As we work in an agile environment, situations often occur where a product owner will want to change the workings of a feature that is being implemented, but at the same time they want to release what we have now. Or even better, sometimes they decide to change this feature on one platform and leave it as is on the others.

<div style="clear:both"></div>
<br/>

### A feature is like a baby - It keeps evolving.

Features evolve. We run A/B tests and/or learn from the data we get after releasing new features. Looking at the data we understand that the feature needs some tweaking. So the product team changes the PRD. This creates a “problem”. The newly revised PRD no longer matches the protocol definition and documentation. Moreover, some platforms may have already implemented the previous PRD, where some have yet to start. To overcome this problem we decided to version the PRDs. Let’s say the feature is released on one platform as version R3 of the PRD. After some time the product owner decides to tweak the feature and updates the PRD to version R5. At this point we also need to update the protocol and technical documentation to match the updated PRD.

For tracking PRD updates we use versioning in [Confluence](https://www.atlassian.com/software/confluence) (Atlassian’s wiki like product). In the protocol technical documentation we add links to a specific revision of the PRD by just adding ?pageVersion=3 to the wiki page address or obtain a diff link through history. This way every developer knows which version or part of the PRD protocol that has been done.

PRD diff are treated like a new feature. Product owners accumulate changes (R1, R2, …) until they decide it should go to development. They create an API task, where changes to the protocol are implemented and then they get to platforms as a single unit of work. When product adds the next set of changes, another API ticket is created and then change is implemented  to platforms in same way:

<img class="no-box-shadow" src="{{page.imgdir}}/3.png"/>

After we’ve got the link to PRD diff, we start the flow again from the protocol changes and so on. It is a bit more complicated as we still need to support previous functionality and not break already released client apps that have versions R3. Basically at our disposal we have several levels of protocol changes management.

<div style="clear:both"></div>
<br/>

### Protocol changes management

In the previous section we looked at the PRD versioning. In order to implement those changes in the API we need to examine our options for protocol versioning. There are three main options (levels) here, each of them have their own pros and cons.

<div style="clear:both"></div>
<br/>

**Protocol level**

This approach is widely used for slow-changing public APIs. When new version of protocol are released, all the clients are suppose to start using it instead of the old one. We can’t use it as different client platforms have different sets of features implemented. Let’s say we have set of protocol versions:

V1. Supports features A, B, C<br>V2. Supports features B’, C and D, where B’ is an updated feature B (which has a different flow)

So if the client needs to implement feature D, it will also have to upgrade feature B to B’, which might be not needed at the moment.

At Badoo we never used this versioning approach. For our situation, the two options described below are a better fit.

<div style="clear:both"></div>
<br/>

**Versioning by message**

Another approach would be to create new message ([data structure](https://developers.google.com/protocol-buffers/docs/proto#simple) in protobuf) with an updated set of fields when the feature has changed. This works quite well if the requirements change significantly.

Code sample:

At Badoo every user has albums. In the past users could create their own albums and put photos in them:

{% highlight html %}

  AddPhotoToAlbumV1 {
	required string album_id = 1;
	required string photo_id = 2;
}

{% endhighlight %}

Later on our product team decided to have only 3 predefined album types: my photos, other photos and private photos. For the clients to be able to distinguish between those types, we prefer using an enum so the next version of the message may look like this:

{% highlight html %}

AddPhotoToAlbumV2 {
	required AlbumType album_type = 1;
	required string photo_id = 2;
}

{% endhighlight %}

This approach sometimes works well, but be careful! If the change is not implemented on all platforms in a short time, you will end up supporting (adding more changes to) both old and new versions, which will create even more mess.

**Field/value level.**

If it is possible, we reuse the same message/enum, maybe deprecate some fields/values in it or add new ones. This is probably the  most common approach in our protocol.
<br/>
For example:

{% highlight html %}

AddPhotoToAlbum {
	optional string album_id = 1 [deprecated=true];
	optional string photo_id = 2;
	optional AlbumType album_type = 3;
}

{% endhighlight %}

In this case clients can keep using same message, but new client versions can switch to
album_type instead of album_id.

On a side note we always use the optional fields. This gives us the flexibility to deprecate fields.
([Google reached the same conclusion](https://developers.google.com/protocol-buffers/docs/proto#simple)).

<div style="clear:both"></div>
<br/>

### Supporting protocol changes

Our protocol is shared between our server and our 5 client platforms. As our clients release a new version each week (resulting in ~20 app versions per month, all of which can behave differently and use different parts of the protocol), we can’t just create a different protocol version for every app release. Such protocol versioning will require server to support thousands of various combinations of apps behaviours, which is far not ideal.

A better option—the one we decided implement— would be for each client to declare at the start which versions of the protocol bits they support. This allows the server to be client agnostic when it comes to feature support and just rely on the list of supported features provided by the client..

E.g. A while ago we implemented the “What’s New” feature. This allows us to inform the user of new features in the app. Clients that support it send the server a SUPPORTS_WHATS_NEW flag. The server then knows that it can send What’s New messages to the client and that they be displayed correctly.

<img class="no-box-shadow" src="{{page.imgdir}}/4.png"/>

<div style="clear:both"></div>
<br/>

### How to keep the protocol clean?
For public API the deadline is usually set and an old part stops working on this date. At Badoo this is not always possible as tasks to implement new features often have a much higher priority then removing old features. Thus we have a 3 stage process for that.

For the first stage as soon as it is clear that part of the protocol is to be removed, it is marked as “deprecated” and tickets for all client platforms are created to remove the code.

During the second stage, all the clients should remove deprecated protocol usage from their code. At this point server can’t remove code as some older versions of apps can still be in production.

During the last stage when all clients have removed their code and no production versions left that use the protocol, it can then be removed from server code and protocol itself.

## Patience and people!
Above we presented several technical and organizational approaches that we have adopted or invented here at Badoo. However we haven’t talked at all about communication. Communication is 80% of our work. It is very important that you have people on your side to move things fast. Luckily many of our developers support us with what we need as they remember well the pain associated with non-standardized solutions across platforms.

We’ve realised that a well documented API also helps non developers understand it and it’s development workflow. QA uses it to improve testing and our product team uses it as a reference to understand what can be done with minimal protocol changes.

## Conclusion
When designing a protocol and the processes around it, you need patience and pragmatism. The protocol and process have to cater all combinations of teams, versions and platforms dealing with legacy clients and more. Nevertheless it is a very interesting and challenging task. With little literature on how to design fast-changing APIs, we hope you find this article interesting and that it has given you some useful insights on how to make this task a little easier.

Thank you for reading and any comments are more than welcome.

**Ivan Biryukov** - Mobile Architect<br>**Orene Gauthier** - Head of Mobile Engineer
