---
layout: post
title:  "Let's build: Freehand Drawing in iOS - Part 1"
author: Miguel Angel Quinones
date:   2015-06-15
categories: iOS tutorial
---

This post will be the first of a series in which we follow the development of a specific feature. We want to add to the great quantity of existing tutorials on the internet by sharing practical knowledge directly from our engineering team. 

This time we will demonstrate the implementation of **[Freehand Drawing][Google], aka Doodling** in iOS.

## Structure of the tutorials

These tutorials are aimed at mid-level developers. We will skip the basic project setup and focus on the domain parts of the feature, discussing the reasoning behind some details, and the architecture. 

We’ll guide you from a naive or 'first time' implementation, through natural iterative improvements. The final implementation we’ll reach will be very close to production-level quality code.

All the code is in a [repository][], with tags referencing specific milestones.

So all things said, let's dive into the feature!

## Freehand drawing

Let's say you have an (awesome) application involving some kind of user communication. Wouldn't it be great if users could send each other doodles or hand-written notes? That's what we’ll build.

Freehand Drawing lets the user use her finger to draw as if it was a pencil or brush. We want to offer some kind of canvas where she can draw, undo as many times as she wants, and save the result as an image to be sent to somebody. As an example of such a feature, you can look at any doodling app. For example, [Kids Doodle][], [You Doodle][], or the notorious [Draw Something][].

There are many applications that don't focus on drawing, but offer such functionality as part of the experience, such as photo editing apps. You can check [Bumble][] or [Snapchat][] photo-sending as an example.

**Disclaimer:**  We don’t want to build a fully-featured drawing application like [Paper][], but rather a simple way for users to draw stuff that can be used for other purposes.

## What we will build:

User facing features:

- Ability to draw lines and points
- Ability to undo changes
- Ability to change drawing color
- Ability to export to an image

Technical details:

- Maintain performance with lots of lines
- Build undo functionality
- Improve stroke appearance from ‘computerish’ to a more realistic hand drawing style

## Choice of API

Before going into details about how we’d implement it, on the iOS platform we effectively have two API choices:

- Use [Core Graphics][]
- Use [OpenGL ES][]

In this case the most lightweight and hence first choice for implementation would be direct use of Core Graphics. The reason is twofold: firstly we should always try to use higher level APIs to achieve what we need, as they offer better abstractions and need less code; secondly, using OpenGL, ES requires more setup and higher developer knowledge, but this would be a small part of our application and the performance of Core Graphics is expected to be sufficient.

We will use Swift and XCode 6.4 (in beta at the time of writing this article).

## Naive version

This is the first part of the tutorial series, where we’ll build a naive version, analyse what’s wrong and what can be improved.

### Give me the code!

All the code for this tutorial series is [here][repository]

A first thought on how to enable drawing for the user is to utilise [Core Graphics][] in a view.

The simplest initial approach is to create a UIView subclass that handles user touches and constructs a Bezier path with the points the user goes through. Then we’ll redraw every time a new point is added by the user moving their finger. We’ll draw simple straight lines between captured points, and add a round cap to the stroke.

Jump directly to this version [here][v1].

The ViewController does nothing at the moment. Let’s focus on the implementation of the DrawView:

{% highlight swift %}

import UIKit

class DrawView : UIView {
    override func awakeFromNib() {
        super.awakeFromNib()
        self.setupGestureRecognizers()
    }
    
    // MARK: Drawing a path
    
    override func drawRect(rect: CGRect) {
        // 4. Redraw whole rect, ignoring parameter. Please note we always invalidate whole view.
        let context = UIGraphicsGetCurrentContext()
        self.drawColor.setStroke()
        self.path.lineWidth = self.drawWidth
        self.path.lineCapStyle = kCGLineCapRound
        self.path.stroke()
    }
    
    // MARK: Gestures
    
    private func setupGestureRecognizers() {
        // 1. Set up a pan gesture recognizer to track where user moves finger
        let panRecognizer = UIPanGestureRecognizer(target: self, action: “handlePan:”)
        self.addGestureRecognizer(panRecognizer)
    }
    
    @objc private func handlePan(sender: UIPanGestureRecognizer) {
        let point = sender.locationInView(self)
        switch sender.state {
        case .Began:
            self.startAtPoint(point)
        case .Changed:
            self.continueAtPoint(point)
        case .Ended:
            self.endAtPoint(point)
        case .Failed:
            self.endAtPoint(point)
        default:
            assert(false, “State not handled”)
        }
    }
    
    // MARK: Tracing a line
    
    private func startAtPoint(point: CGPoint) {
        self.path.moveToPoint(point)
    }
    
    private func continueAtPoint(point: CGPoint) {
        // 2. Accumulate points as they are reported by the gesture recognizer, in a bezier path object
        self.path.addLineToPoint(point)
        
        // 3. Trigger a redraw every time a point is added (finger moves)
        self.setNeedsDisplay()
    }
    
    private func endAtPoint(point: CGPoint) {
        // Nothing to do when ending/cancelling for now
    }
    
    var drawColor: UIColor = UIColor.blackColor()
    var drawWidth: CGFloat = 10.0
    
    private var path: UIBezierPath = UIBezierPath()
}

{% endhighlight %}

1. We set up a gesture recognizer to track the movement of the finger on the screen
2. We accumulate the points the user has gone through with her finger in a UIBezierPath object.
3. Every time a new point is added, we invalidate the whole drawing bounds.
4. Our custom `drawRect` implementation takes the accumulated path and draws it with the selected color and width. Note that it strokes the whole path every time a new point is added.

This code has a very big problem, which is performance. As it stands now, the more you draw the slower the interface responds, to a point where it becomes unusable.

Another future problem is that user will not be able to draw strokes with different colors, as we use the same color for the whole path. Let’s focus on the performance problem first.

## Less naive version: Painter’s algorithm

To address the creeping issue of our first naive implementation, we need to understand why this happens.

Even without profiling, if you analyse what the code is doing, you will notice that we are drawing the **whole accumulated path** every time a new dragging point is added. The path grows larger with every finger movement, which means we need to do more UI blocking work to draw the path. This will block the touch event processing and thus the perception of lag.

We really don’t need to redraw the whole path every time, because the strokes will always go over what was drawn before, similar how the [Painter’s algorithm][painter] works. We should keep the work we do between points to a minimum for the UI to be responsive.

A possible optimization is to cache what we have drawn already into an image, and just redraw over that image every time a point is added. The amount of work to do between finger movements will be constant - a line stroke and setting the bitmap to the view.

The full set of changes are [here][v2].

First, we don’t need to accumulate a path. We’ll remember the last point so we can build lines for every new point:

{% highlight swift %}

private func startAtPoint(point: CGPoint) {
        self.lastPoint = point
    }
    
    private func continueAtPoint(point: CGPoint) {
        // 2. Draw the current stroke in an accumulated bitmap
        self.buffer = self.drawLine(self.lastPoint, b: point, buffer: self.buffer)
        
        // 3. Replace the layer contents with the updated image
        self.layer.contents = self.buffer?.CGImage ?? nil
        
        // 4. Update last point for next stroke
        self.lastPoint = point
    }
    
    private func endAtPoint(point: CGPoint) {
        self.lastPoint = CGPointZero
    }

{% endhighlight %}

The new incremental draw routine:

{% highlight swift %}

private func drawLine(a: CGPoint, b: CGPoint, buffer: UIImage?) -> UIImage {
        let size = self.bounds.size
        
        // Initialize a full size image. Opaque because we don’t need to draw over anything. Will be more performant.
        UIGraphicsBeginImageContextWithOptions(size, true, 0)
        let context = UIGraphicsGetCurrentContext()
        
        CGContextSetFillColorWithColor(context, self.backgroundColor?.CGColor ?? UIColor.whiteColor().CGColor)
        CGContextFillRect(context, self.bounds)
        
        // Draw previous buffer first
        if let buffer = buffer {
            buffer.drawInRect(self.bounds)
        }
        
        // Draw the line
        self.drawColor.setStroke()
        CGContextSetLineWidth(context, self.drawWidth)
        CGContextSetLineCap(context, kCGLineCapRound)
        
        CGContextMoveToPoint(context, a.x, a.y)
        CGContextAddLineToPoint(context, b.x, b.y)
        CGContextStrokePath(context)
        
        // Grab the updated buffer
        let image = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        return image
    }
{% endhighlight %}

This solution is an improvement over the naive drawing, and also allows us to change drawing color for every finger stroke.

## Memory problems

Let’s run this code on an older device. Say an iPhone 4S. 
We expect this code might not be high performance enough, but it is sufficient for our feature on such a low end device.

Now keep running drawing strokes for a while, especially fast strokes. You’ll eventually crash the application. The crash was due to a memory warning. With such small amount of code we now have memory problems! Building applications for mobile we always need to be mindful of memory constraints. 

Let’s run profile the code with the allocations instrument. Here is a run I captured reproducing the memory warning:

![Memory4S]({{page.imgdir}}/DrawView-naive-memory-4s.png)

You can also run the application in XCode and check the memory gauge inside the debugging tab. So what’s going on?

We are allocating a lot of transient images while the user is drawing. There is no memory leak but the drawn images are autoreleased as per ARC rules. The offending line is this one:

{% highlight swift %}
let image = UIGraphicsGetImageFromCurrentImageContext()
{% endhighlight %}

The transient images are autoreleased; that is, released and removed from memory at a later time when the runloop finishes its cycle. But in cases where we have many touches accumulated, we keep adding work to the main thread, thus blocking the runloop.

This is a case with lots of transient and costly objects, and we should step in and force ARC to release the images as soon as we are done with them. It’s as simple as wrapping the code with an autorelease pool, to force the release of all autoreleased objects at the end of this method:

{% highlight swift %}
private func continueAtPoint(point: CGPoint) {
        autoreleasepool {
            // 2. Draw the current stroke in an accumulated bitmap
            self.buffer = self.drawLine(self.lastPoint, b: point, buffer: self.buffer)
            
            // 3. Replace the layer contents with the updated image
            self.layer.contents = self.buffer?.CGImage ?? nil
            
            // 4. Update last point for next stroke
            self.lastPoint = point
        }
    }
{% endhighlight %}

Why we didn’t experience this problem on an iPhone 6? Look at the allocations trace:

![Memory6]({{page.imgdir}}/DrawView-naive-memory-6.png)

Seems similar doesn’t it? The reason is simply that device has more available memory so even if we use more memory, and we don’t reach the OS limit for memory warning. Nevertheless using less memory in mobile is a goal we should be striving for, so this optimisation will only benefit our iPhone 6 users.

## Adding a toolbar and changing color

Adding a toolbar and changing the color is only a matter of structure. Our DrawViewController will manage interaction between subviews; the Toolbar and DrawView.

We mention this part because it's often the case that sample code omits a bit of architecture for the sake of simplicity, but that leads to the false impression that ‘everything goes’ into the ViewController subclass. [Massive View Controller](http://khanlou.com/2014/09/8-patterns-to-help-you-destroy-massive-view-controller/) is an illness creeping into many iOS codebases. We don't want to contribute to this illness.


This is how the feature looks:

![Result]({{page.imgdir}}/result.png)


Check the finished code for this post [here][part1].

## Analysis

We’ve seen how to implement a simple drawing feature using a custom UIView. We hit a performance problem with very long sets of strokes, and fixed it by caching the previous strokes in an offscreen buffer. We also found and fixed high transient memory usage, which produced a crash on lower end devices.

What about adding the other features? 

- Think about how to add undo to this code. 
- What about adding more gestures such as detecting a tap to draw a point. Will the code be as clean as it is now?
- The stroke is very simple and does not emulate handwriting in any way. This can be improved and we’ll see some ways to do that in upcoming posts.

In the next post we’ll add undo functionality, and will see how to change our simple code with a better, more extensible design.

[Snapchat]: https://itunes.apple.com/us/app/snapchat/id447188370?mt=8
[Bumble]: https://itunes.apple.com/us/app/bumble-app/id930441707
[You Doodle]: https://itunes.apple.com/us/app/you-doodle-draw-on-photo-editor/id517871755?mt=8
[Draw Something]: https://itunes.apple.com/us/app/draw-something-free/id488628250?mt=8
[Kids Doodle]: https://itunes.apple.com/us/app/kids-doodle-movie-kids-color/id460712294?mt=8
[Paper]: https://itunes.apple.com/us/app/paper-by-fiftythree/id506003812
[Core Graphics]: https://developer.apple.com/library/ios/documentation/GraphicsImaging/Conceptual/drawingwithquartz2d/dq_overview/dq_overview.html#//apple_ref/doc/uid/TP30001066-CH202-TPXREF101
[OpenGL ES]: https://developer.apple.com/library/ios/documentation/3DDrawing/Conceptual/OpenGLES_ProgrammingGuide/Introduction/Introduction.html
[repository]: https://github.com/badoo/FreehandDrawing-iOS
[painter]: https://en.wikipedia.org/wiki/Painter's_algorithm
[v1]: https://github.com/badoo/FreehandDrawing-iOS/commit/5ae6497ee083ec863cb2131730bd924de367600f
[v2]: https://github.com/badoo/FreehandDrawing-iOS/commit/16827028b3e04e97d8cd1a5ca46c085b4fb20f12
[part1]: https://github.com/badoo/FreehandDrawing-iOS/tree/part1
[google]: https://www.google.co.uk/?q=freehand+drawing+apps
