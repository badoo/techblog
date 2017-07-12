---
layout: post
title: Behind the scenes with importing Adobe After Effects animation into Badoo iOS app
author: Radoslaw Cieciwa
date:   2017-07-12
categories: iOS
excerpt: We've updated the front façade of our app, rethinking everything along the way. Changes have affected the iOS app, and indeed all platforms. We have made everything new and we have called this project: Re-think.
---
## Re - think, Re - design, Re - fresh.

<img class="no-box-shadow" src="{{page.imgdir}}/1.png">

Although I’m not the biggest fan of TV in general, there are shows that amuse me. “Let’s make a deal” will always be number one. But here I want to point out the “transformation” shows, where they turn normal people into prettiest, fanciest dating candidates. I love how brave those people are. How they expose all their weaknesses and flaws to become better, stronger, more confident and… all of that in front of the camera!

We’ve just had a similar transformation here at Badoo and I’m setting up the camera for you. We've updated the front façade of our app, rethinking everything along the way. Changes have affected the iOS app, and indeed all platforms. We have made everything new and we have called this project: Re-think.

There are many reasons why we picked this name, but we’re leaving this part for your imagination. Along with those changes we’ve also reconsidered the loading animation. This is a short episode from the story of these changes.

# Start here

The story begins with the designer’s MacBook. Adobe After Effects mixed with some designer VooDoo magic and the result was this:

<img class="no-box-shadow" src="{{page.imgdir}}/2.gif">

You cannot tell me it’s not appealing. It goes without saying that we loved the animation and we wanted to have it exactly like this. Unfortunately, though, it seems to be really complex.

On top of that, we had additional requirements: e.g. whilst displaying animation, we need to perform additional actions in the background.
From the user perspective we needed to finish the animation as soon as possible, but … from our brand consistency perspective, we had to finish it at one of the 4 points of the animation transitions i.e. we couldn’t close animation while we were still drawing letters letters of our Badoo logo.

We achieved a freshly baked Adobe After Effects animation, and some additional description of how that animation should act. Now we needed to start the implementation. But first, let’s learn some theory.

*Ah, and the number of users in the last phase of animation (the counter) is real (and is updated to the current number whenever you open the app).*

## Short theory: Keyframes & Vector Based

### What does it mean to animate with keyframes?

At a given point in time your object has a state (properties like opacity, position, scale). This moment in time is called a keyframe. Animating between keyframes is just changing the values of animated properties for intermediate frames.

<img class="no-box-shadow" src="{{page.imgdir}}/3.png">
<em> iOS have a custom animation for keyframe animations called <a href="https://developer.apple.com/reference/quartzcore/cakeyframeanimation">CAKeyframeAnimation</a>.</em>

In Adobe After Effects, our animations have a speed of 25 fps. This means that for every 40 ms (1/25 [s]) it computes the values for all elements of the animation.

> Note: When you think about fps (frames per second), most of the time you think about performance. 60 fps is the magic number. It means that you have a little more than 16.6 ms (1/60 [s]) to render a frame and send it for display. If your rendering time (calculation on the main thread) is more than that, it will not be able to produce 60 frames per second, and so the number drops.

### Vector based

The animation should be scalable (in terms of size, not architecture, you architectural freaks ;)). That's why we want to use shapes and support vector graphic (e.g. <a href="https://developer.apple.com/reference/quartzcore/cashapelayer">CAShapeLayer</a>) not raster images.

## How have we made it work?

### Initial phase - planning

If we could sketch our general idea at this point, it would look like this:

<img class="no-box-shadow" src="{{page.imgdir}}/4.png">

Fairly simple… on a diagram, but writing this kind of software from scratch is not that simple. We already have an in-house solution for keyframes animation. It was capable of supporting animations more or less like this, but in order to save time we wanted something that had more features to support the whole range of vector operations that are presented in the designer animation.

Let’s look for an existing solution.

<br>

### Research - which one to pick?

Our main factors in picking were: does the library support all the features we need? Can we use supported exporter? And of course we wanted one powered by a huge community, getting a lot of stars, PR’s and issues.

Do you know these guys?

<img class="no-box-shadow" src="{{page.imgdir}}/5.gif">

OMG, LOL, OFC. Reactions from Facebook. Looks nice? Yes, they are built with a Facebook framework called <a href="https://github.com/facebookincubator/Keyframes">Keyframes</a>. It’s strongly recommend that you check it out! But... it wasn’t our final pick. Why? Two reasons. Most important is the lack of support for path trimming. Animated letters were done with this Adobe After Effects feature. The second reason was a suggestion from the authors to use this framework only for really simple animations, which wasn’t the case for us initially.

Next, <a href="https://github.com/airbnb/lottie-ios">Lottie-iOS</a>. This one was a fit for us. *“An iOS library to natively render After Effects vector animations”. We thought this looked more promising.*

When we were at the research stage, we thought it had all of the features that we needed. It’s also slightly less performant than the first proposition.

> Note: Both libraries are improving significantly. By the time you read this, they could be in a totally different state than they were when we found them. Also, they are really similar in use, and so there’s no huge reasoning behind picking one rather than the other. If in your case they both support the features you need, you may pick whichever you like better.

Keyframes provide their own <a href="https://facebookincubator.github.io/Keyframes/docs/ae/exporting">exporter</a>, which may be a safer solution, due to the fact that both solutions (exporter and renderer) are controlled by the same developer. This will allow them to be in sync.
In contrast to this, Lottie uses the <a href=" https://github.com/bodymovin/bodymovin">bodymovin</a> plugin. This is an independent library, so it seems that Lottie needs to catch up with every change. This may mean that it will go slightly out of sync.

Our pick for exporter had to follow our Library pick. We used <a href="https://github.com/bodymovin/bodymovin">bodymovin</a>.

<br>

### Landing phase

After our research stage, we finished up with our completed flow:

<img class="no-box-shadow" src="{{page.imgdir}}/6.png">

# Let’s dig into implementation

We won’t copy & paste our git history here, but we’ll just share some of the caveats we’ve encountered along the road.

## Encountered caveats

<img class="no-box-shadow" src="{{page.imgdir}}/7.gif">

1. The elements of the animation are displayed on the screen, but they don't animate.

This one resulted in a global refurbish of the animation file. From the designer point of view, what is visible (in this case the final Adobe After Effects render) is correct (in the manner of “what you see is what you get”), but this is not quite true from the developer perspective. An animation file needs to be prepared for export to be rendered on any client. The rules of thumb for animation files are:

- Keep the structure as flat as possible (don't use too many parent layers)
- Don’t keep any unused layers: simplicity is the key
- Sub-compositions are not allowed, and they will not be rendered
- Use vectors instead of images

<a href="https://facebookincubator.github.io/Keyframes/docs/ae/guidelines">Here</a> are some tips from keyframes framework, that they require.

<br>
2. Doubled layers

AAE (Adobe After Effects) had inconsistencies between the designer version and the developer version of the same document. The same animation was represented differently in each version. One of the differences was a doubled layer for trim paths. This mapping turned out to double a layer there, which after export meant that the layers overlapped each other.

<img class="no-box-shadow" src="{{page.imgdir}}/8.png">

> HINT: Check each shape in the animation source file. You might bump into some interesting stuff.

<br>
3. We had a rotated letter.

Our AAE file hid one caveat. The small “d” turned out to be rendered as “p” on a device, but in AAE it was rendered correctly. AAE supports smart objects, or already created composition (it’s like incorporating Object Oriented Design into Design and designer can also be DRY).

But someone performed too many altering operations on the letter, including rotation inside a smart object, outside a smart object, and group. Not all of those rotations were translated into the animation, and we’ve ended up with this rotation on a real device.

>HINT: Not only should the structure be simple, but the operations performed on the elements as well.

>OUR FIX: We rotated the letter to render incorrectly in AAE, but correctly on the real device.

<br>
4. and 5. Is comparison of the same animation on the side project and main app. We found this resulted in a really "jumpy" animation.

As we mentioned before, 60 fps is the animation performance that we were aiming for. We didn’t achieve that threshold on the animated “Badoo” drawing letters part. Why? There were a few reasons. We had a heavily loaded main thread while the animation was being performed.

At this point a question immediately arises: *“Wait, but why, if animations are performed by Core Animation, do they care about CPU, since they are using GPU?” This is what should be happening, but...* there are few operations, that cause render on CPU instead of GPU, and then are passed to GPU as an image to display (simplified version). Masks on views, corner radius, and trim paths all have to be rendered in the CPU.

>FIX: It depends what you prioritise. In our case, we decided to get rid of trim paths (masks).

Also, despite these issues and fixes mentioned above, keep in mind the following tips:

- Letters "with holes inside" (e.g. B, D, A) are complex to render. It's because they are rendered with **merged layers**, which is an unsupported operation.
- Keep the composition structure as flat as possible in AAE. Large numbers of layers and their depth can have an impact on animation performance.
- Learn the designer tools. The designer will have a harder time understanding why something don’t work on your side, than you will have just figuring it out yourself.
- In the animations world, how something works is not important, but how it looks. Everything can be faked.

## Transitions between different parts of the animation.

One of the requirements for us was to be able to finish the animation at one of the transition points:

- Between the heart beat and logo drawing
- Between the logo drawing and counter
- Between the counter and card dismissal

It was easy to achieve. We just split the animation into a few files. We did it in AAE exporter. Remember:

- The last frame of the animation should be first frame of the next exported animation
- Pick the frames when there’s no (or the least) changes between following frames.

## How we’ve exported the counter, still keeping the number real and fresh?

We didn’t. It’s a separate component. And it’s also material for another short article.

# Grande Finale

Yes, you’ve made it to the finale. In actual fact, we produced a new, refreshed animation. As you may have spotted, it’s differs a little bit from the original. You can even check it out here. As it’s a simple software story, it should end with a moral. Well, this is it: ***cut the corner if that’s ok, but please the eye if you may.***

For me the biggest engineering challenge was making the process of drawing letterswork smoothly. But, time constraints are relentless. I needed to let it go and swap them with simple fade in, fade out animation. It’s still pleasing to the eye, and I’m happy about that. As for the journey itself, I can only promise you, that it will bring you a lot of Core Animation knowledge if you decide to follow a similar path.

<img class="no-box-shadow" src="{{page.imgdir}}/9.gif">

## For additional knowledge check these videos:

- I recommend going through this session few times: <a href="https://developer.apple.com/videos/play/wwdc2014/419">WWDC '14- 419</a>
- <a href="https://news.realm.io/news/tryswift-tim-oliver-advanced-graphics-with-core-animation/">Tim Oliver</a>
- <a href="https://news.realm.io/news/altconf-stephen-barnes-bring-your-app-to-life-calayer/">Stephen Barnes</a>
- <a href="https://news.realm.io/news/altconf-marin-todorov-animations/">Marin Todorov</a>

**Radoslaw Cieciwa, iOS developer.**
