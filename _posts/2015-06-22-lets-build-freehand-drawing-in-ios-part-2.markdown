---
layout: post
title: "Let's build: Freehand Drawing in iOS - Part 2"
author: Miguel Angel Quinones
date:   2015-06-22
categories: iOS tutorial
---

This the second of a series of tutorials in which we build **Freehand Drawing** for iOS. In this part we will add undo functionality and the ability to draw dots.

In the [previous post][post1] we built a simple UIView subclass that handles touches and draws the stroke. We found some performance and memory issues and fixed them. Now we reached the point where we want to add more functionality to this simple implementation.

# Drawing dots

In the initial implementation we didn't add a way for the user to draw dots. We can interpret she wants to draw a dot when she taps on the screen.

Let's try to add this to the current code, with the simplest implementation we can think of.

You can go directly to the changes [here][points].

So first thing we need to do is add a gesture recognizer for taps, and draw a dot when the gesture is ended:

{% highlight swift %}

private func setupGestureRecognizers() {
        // Pan gesture recognizer to track lines
        let panRecognizer = UIPanGestureRecognizer(target: self, action: "handlePan:")
        self.addGestureRecognizer(panRecognizer)
        
        // Tap gesture recognizer to track points
        let tapRecognizer = UITapGestureRecognizer(target: self, action: "handleTap:")
        self.addGestureRecognizer(tapRecognizer)
    }

@objc private func handleTap(sender: UITapGestureRecognizer) {
        let point = sender.locationInView(self)
        if (sender.state == .Ended) {
            self.tapAtPoint(point)
        }
    }

{% endhighlight %}

Then we need to draw a dot. Drawing a dot itself is achieved by drawing a filled circle. But then we duplicate a lot of the functionality and optimizations we previously did when drawing line. We can do a bit of refactoring so we reuse some of the code. This is how `drawLine` and the new `drawPoint` methods look like, with the common code refactored into a utility method:

{% highlight swift %}

 // MARK: Drawing a path
    
    private func drawLine(a: CGPoint, b: CGPoint, buffer: UIImage?) -> UIImage {
        let image = drawInContext { context in
            // Draw the line
            self.drawColor.setStroke()
            CGContextSetLineWidth(context, self.drawWidth)
            CGContextSetLineCap(context, kCGLineCapRound)
            
            CGContextMoveToPoint(context, a.x, a.y)
            CGContextAddLineToPoint(context, b.x, b.y)
            CGContextStrokePath(context)
        }
        
        return image
    }
    
    // MARK: Drawing a point
    
    private func drawPoint(at: CGPoint, buffer: UIImage?) -> UIImage {
        let image = drawInContext { context in
            // Draw the point
            self.drawColor.setFill()
            let circle = UIBezierPath(arcCenter: at, radius: self.drawWidth / 2.0, startAngle: 0, endAngle: 2 * CGFloat(M_PI), clockwise: true)
            circle.fill()
        }
        
        return image
    }
    
    // MARK: General setup to draw. Reusing a buffer and returning a new one
    
    private func drawInContext(code:(context: CGContextRef) -> Void) -> UIImage {
        let size = self.bounds.size
        
        // Initialize a full size image. Opaque because we don't need to draw over anything. Will be more performant.
        UIGraphicsBeginImageContextWithOptions(size, true, 0)
        let context = UIGraphicsGetCurrentContext()
        
        CGContextSetFillColorWithColor(context, self.backgroundColor?.CGColor ?? UIColor.whiteColor().CGColor)
        CGContextFillRect(context, self.bounds)
        
        // Draw previous buffer first
        if let buffer = buffer {
            buffer.drawInRect(self.bounds)
        }
    
        // Execute draw code
        code(context: context)
        
        // Grab updated buffer and return it
        let image = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        return image
    }

{% endhighlight %}

And this is how it looks like (warning, programmer art ahead):

![DrawView-points]({{page.imgdir}}/DrawView-points.png)

So this works fine, but as we will see in the next section, our approach of adding more code to existing classes is not very flexible.

# Undo functionality

The main feature we want to talk about in this post is adding **undo**. You probably know how it works but let's review it anyway: We will add a button which lets the user to go back in time, and delete the last drawn line or point. This will allow her to correct mistakes or simply make up her mind after drawing something. The button can be tapped repeatedly with the effect of deleting more and more lines and taps until the drawing is empty as it was at the beginning.

Bear in mind that one ‘undo’ will remove the last full line or dot the user drew between touching the screen and lifting the finger from the screen, not the last part of the last line.

## Refactoring

The current code is simple and understandable. To add undo, possibly the first idea that comes to mind is to add some kind of memory of the path we have been drawing, and then remove the last part when user taps the button. That could easily be a simple ordered array of points the user went through.

But then, what about the fact that we want to undo a whole stroke? So we need to keep track of when the stroke started and when it ended. What about dots? We need to differentiate between drawing dots and drawing lines. And then, how do we actually undo a line? We have a cached buffer with the accumulated contents the user has been drawing, and we can only render on top of it.

Another issue is that all the code is contained in the view level, and now it is all the 'visual' logic. But the only way to access data of touches and the history of the user finger movements is to add the functionality directly to the view. It seems that our `DrawView` object code will grow very fast, so it will be problematic in the future.

In this case, we can address this issues by stepping back and changing our design. We will use a [software design pattern][dp], and this problem in particular is easily modelled with the [command pattern][command].

## Command pattern

The command pattern encapsulates the execution of some action (the command), and abstracts the user of the actions, so it does not know how they execute that action. The commands can then be used in a heterogeneous way, and higher level operations become trivial, such as reorder, persistence, or in our case, undo.

### The commands

Let's try to model our actions. In our domain the actions are strokes the user draws with her finger. Let’s introduce a protocol for our actions:

{% highlight swift %}
protocol DrawCommand {
    func execute()
}
{% endhighlight %}

Commands should only do one thing, and that is executing their encapsulated action. The setup, autorelease pool, and offscreen buffer, is not responsibility of the command itself, it rather is responsibility of the environment on which our command works. Let’s express this with our protocols:

{% highlight swift %}

protocol Canvas {
    var context: CGContext {get}
}

protocol DrawCommand {
    func execute(canvas: Canvas)
}
{% endhighlight %}

And directly from our `drawLine` and `drawPoint` methods we can create our first commands. To draw a line we need two points, the width, color and a context, from the canvas:

{% highlight swift %}

struct LineDrawCommand : DrawCommand {

    let a: CGPoint
    let b: CGPoint
    let width: CGFloat
    let color: UIColor

    // MARK: DrawCommand
    
    func execute(canvas: Canvas) {
        CGContextSetStrokeColorWithColor(canvas.context, self.color.CGColor)
        CGContextSetLineWidth(canvas.context, self.width)
        CGContextSetLineCap(canvas.context, kCGLineCapRound)
        
        CGContextMoveToPoint(canvas.context, a.x, a.y)
        CGContextAddLineToPoint(canvas.context, b.x, b.y)
        CGContextStrokePath(canvas.context)
    }
}

{% endhighlight %}

To draw a circle we need a centre, radius, color and a context, which we get through the canvas:

{% highlight swift %}

struct CircleDrawCommand : DrawCommand {
    
    let center: CGPoint
    let radius: CGFloat
    let color: UIColor
    
    // MARK: DrawCommand
    
    func execute(canvas: Canvas) {
        CGContextSetFillColorWithColor(canvas.context, self.color.CGColor)
        
        CGContextAddArc(canvas.context, self.center.x, self.center.y, self.radius, 0, 2 * CGFloat(M_PI), 1)
        CGContextFillPath(canvas.context)
    }
}

{% endhighlight %}

### Separating View and Logic

The most important step is to separate the logic of the commands from the view. Our view in this case will act as the environment for the commands to execute on. It will also do all the performance optimisations needed, but there will be no logic about gestures. 

We can create a different object, a controller if you will, to do all the gesture and command logic. This new object does not need to be a UIViewController  subclass, in fact it only needs to be an NSObject subclass because it needs to offer selectors for the callbacks of gesture recognizers. And in this object we will hold an ordered list of the commands.

You can find the change [here][refactor1]. Let’s highlight the key changes. First we have introduced another protocol, called `DrawCommandReceiver`, just to decouple the View and controller objects, as executing a command needs the context to be set up in the view:

{% highlight swift %}
protocol DrawCommandReceiver {
    func executeCommand(command: DrawCommand)
}
{% endhighlight %}

The view contains much less code, conforms to two protocols and has no gesture logic:

{% highlight swift %}

class DrawView : UIView, Canvas, DrawCommandReceiver {
    
    // MARK: Canvas
    
    var context: CGContextRef {
        return UIGraphicsGetCurrentContext()
    }
    
    // MARK: DrawCommandReceiver
    
    func executeCommand(command: DrawCommand) {
        autoreleasepool {
            self.buffer = drawInContext { context in
                command.execute(self)
            }
            
            self.layer.contents = self.buffer?.CGImage ?? nil
        }
    }

// Method drawInContext remains the same as before. All other code is removed

}

{% endhighlight %}

All the logic is moved to a new class, called `FreehandDrawingController`. It contains the same gesture handling as before, but it delegates the execution of the commands to the canvas:

{% highlight swift %}

// MARK: Draw commands
    
    private func startAtPoint(point: CGPoint) {
        self.lastPoint = point
    }
    
    private func continueAtPoint(point: CGPoint) {
        let lineCommand = LineDrawCommand(a: self.lastPoint, b: point, width: self.width, color: self.color)
        
        self.canvas.executeCommand(lineCommand)
        self.commandQueue.append(lineCommand)
        
        self.lastPoint = point
    }
    
    private func endAtPoint(point: CGPoint) {
        self.lastPoint = CGPointZero
    }
    
    private func tapAtPoint(point: CGPoint) {
        let circleCommand = CircleDrawCommand(centre: point, radius: self.width/2.0, color: self.color)
        self.canvas.executeCommand(circleCommand)
        self.commandQueue.append(circleCommand)
    }
    
    private let canvas: protocol<Canvas, DrawCommandReceiver>
    private var commandQueue: Array<DrawCommand> = []
    private var lastPoint: CGPoint = CGPointZero

{% endhighlight %}

### Undo implementation

Now we have refactored our code and made it easier to reason about by having a list of commands that are executed in the canvas. The main question is how to actually implement an undo.

As you may recall, the way that Core Graphics works is that all changes are additive. This means that executing any API will effectively draw on top of what was there. We also accumulate the drawing in an offscreen image that we are continuously modifying and replacing in the screen.

A way to graphically see undo is as a deletion, but how do we express this in the terms of our API, which only offers additive changes? It seems we have two choices:

- A command knows how to undo itself, by drawing what was before it was executed.
- A command only knows how to *do* itself and undo is implemented at the queue level.

#### Redoing whole queue

We will go ahead and implement it this way as the code will be simpler, and has a clever twist to it. So we can think of undo as simply removing the last command from the queue, clearing the offscreen buffer, and executing all commands in order.

This way commands only need to know how to ‘do’ the action, but not how to ‘undo’ it. The drawback of this solution is that undoing will take longer time if the queue is longer, similarly as the problem we solved in [part 1][post1]. Let’s try it first and see if it affects the usability of the feature.



#### Composed command

## Analysis

- Choice of structs vs classes
- Flexibility through protocols
- Design patterns are useful ;)

[post1]: {{site.url}}/blog/2015/06/15/lets-build-freehand-drawing-in-ios-part-1
[part1]: https://github.com/badoo/FreehandDrawing-iOS/tree/part1
[part2]: https://github.com/badoo/FreehandDrawing-iOS/tree/part2
[dp]: https://sourcemaking.com/design_patterns/
[command]: https://sourcemaking.com/design_patterns/command
[points]: https://github.com/badoo/FreehandDrawing-iOS/commit/8a5f9a044a9cf39bf7790165edc28046f4701dd9
[refactor1]: https://github.com/badoo/FreehandDrawing-iOS/commit/bc1c896ce5800caea00d986bbb4aeef0f49e310b
