---
layout: post
title: "Let's build: Freehand Drawing in iOS - Part 2"
author: Miguel Angel Quinones
date:   2015-06-29
categories: iOS tutorial
---

This the second in a series of tutorials in which we build **Freehand Drawing** for iOS. In this part we'll add undo functionality and the ability to draw dots.

In the [previous post][post1] we built a simple UIView subclass that handles touches and draws the stroke. We found some performance and memory issues and fixed them. Now we’ve reached the point where we want to add more functionality to this simple implementation.


# Drawing dots

In the initial implementation we didn't add a way for the user to draw dots. We can interpret that she wants to draw a dot when she taps on the screen.

Let's try to add this to the current code, with the simplest implementation we can think of. You can go directly to the changes [here][points].

So the first thing we need to do is add a gesture recognizer for taps, and draw a dot when the gesture is ended:

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

Now we need to draw a dot. Drawing a dot itself is achieved by drawing a filled circle. But then we duplicate a lot of the functionality and optimizations we previously did when drawing lines. We can refactor to share that code. 
This is how `drawLine` and the new `drawPoint` methods look, with the common code refactored into a utility method:

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

And this is how it looks (warning, programmer art ahead):

![DrawView-points]({{page.imgdir}}/DrawView-points.png)

This works fine, but as we'll see in the next section, our approach of adding more code to existing classes is not very flexible.


# Undo functionality

The main feature we want to talk about in this post is adding **undo**. You probably know how it works but let's review it anyway. We'll add a button which lets the user to go back in time and delete the last line or point she drew. 

This will allow her to correct mistakes or simply change her mind after drawing something. The button can be tapped repeatedly with the effect of deleting more and more lines and dots until the drawing is as empty as it was in the beginning.

Bear in mind that one ‘undo’ will remove the last full line or dot the user drew between touching the screen and lifting the finger from the screen, not the last part of the last line.


## Refactoring

The current code is simple and understandable. To add undo, possibly the first idea that comes to mind is to add some kind of memory of the path we have been drawing, and then remove the last part when user taps the button. That could be a simple ordered array of points the user went through.

But what about the fact that we want to undo a whole stroke? This means we need to keep track of when the stroke started and when it ended. 

What about dots? We need to differentiate between drawing dots and drawing lines. 
And then, how do we actually undo a line? We have a cached buffer with the accumulated contents the user has been drawing, and we can only render on top of it.

Another issue is that all the logic and display is in the same object. The only way to access touch data and the history of user finger movements is to add that functionality directly to the view. It seems that our `DrawView` object code will grow very fast, so it will be harder to understand and maintain in the future.

In this case, we can address the issue by stepping back and changing our design. We'll use a [software design pattern][dp], and this problem in particular is easily modelled with the [command pattern][command].

## Command pattern

The command pattern encapsulates the execution of some actions (the command), and abstracts the user of the actions, so it does not know how they are performed. The commands can then be used in a homogeneous way, and higher level operations become trivial, such as reorder, persistence, or in our case, undo.

### The commands

Let's try to model our commands. In our domain the commands are strokes the user draws with her finger. Let’s introduce a protocol for them:

{% highlight swift %}
protocol DrawCommand {
    func execute()
}
{% endhighlight %}

Commands should only do one thing, and that is execute their encapsulated actions. The setup, autorelease pool and offscreen buffer are not the responsibility of the command itself, rather it’s the responsibility of the environment on which our command works. Let’s express this with our protocols:

{% highlight swift %}

protocol Canvas {
    var context: CGContext {get}
}

protocol DrawCommand {
    func execute(canvas: Canvas)
}
{% endhighlight %}

We can now create our first commands directly from our `drawLine` and `drawPoint` methods. To draw a line we need two points, the width, color, and a context from the canvas:

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

Similarly we can construct our command to draw a circle:

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

The most important step is to separate the logic of the commands from the view. Our view in this case will act as the environment for the commands to execute on. It will also do all the required performance optimisations, but there will be no logic about gestures or commands.

We can create a different object, a controller if you will, to do all the gesture and command logic. This object doesn’t need to be a UIViewController subclass. In fact it only has to be an NSObject subclass as it needs to offer selectors for callbacks of gesture recognizers. This object will hold an ordered list of commands.

You can find the change [here][refactor1]. Let’s highlight the key changes. First we have introduced another protocol, called `DrawCommandReceiver`, just to decouple the view and controller objects, as executing a command needs the context to be set up in the view:

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

Now we’ve refactored our code and made it easier to reason about by having a list of commands that are executed in the canvas. The remaining question is how to actually implement an undo.

As you may recall, the way that in Core Graphics all changes are additive. This means that executing any API will draw on top of what was there previously. We also store the drawing in an offscreen image that we are continuously modifying and replacing onscreen.

A way to see undo graphically is as a deletion, but how do we express this in the terms of our API? There are several ways, so let's consider just two of them:

- A command knows how to undo itself, by drawing what was there before it was executed.
- A command only knows how to *do* itself and undo is implemented at the queue level.

### Redoing whole queue

We can think of undo as executing all commands but the last one in order, on an empty canvas. Implementing undo this way makes code and commands simpler. The commands only need to know how to ‘do’ the action, but not how to ‘undo’ it. 

The drawback of this solution is that undoing will take longer if the queue has many commands. The slowness is likely not to be perceived by the user as they tap a button. Let's implement it and see if it will affect the user experience.

We'll add a button to our toolbar, which will result in a method call of our new `FreehandDrawController`. The controller will then remove the last command from the queue, clear the canvas and execute all the other commands in order:

{% highlight swift %}
// FreeHandDrawController.swift
 func undo() {
        if self.commandQueue.count > 0{
            self.commandQueue.removeLast()
            self.canvas.reset()
            self.commandQueue.map {
                self.canvas.executeCommand($0)
            }
        }
    }
{% endhighlight %}

We'll need a new `reset` method on our canvas protocol, implemented in the view:

{% highlight swift %}
func reset() {
	self.buffer = nil
}
{% endhighlight %}

If you run this, you’ll see that it does not work as expected. There are two problems:

1. Undo is very slow every tap, even when user draws only a few lines. 
2. We’re deleting the last part of the last line, not the whole line itself. This is not what we expect when we tap the button.

Fixing the performance problem means changing the `DrawCommandReceiver` protocol to accept an ordered list of commands to execute, as opposed to only one command. This will allow the underlying view to set up the context and change the buffer only once for the whole set of commands.

You can see the previous changes [here][undo1].

### Composed command

To make our undo operation behave as intended, we can take advantage our types, which requires very little effort. 

A whole line is constructed by all the intermediate points the user is going through with her finger. We can model this in our controller by using a composed command. 

A composed command will be a command that contains an ordered list of commands. These commands will be single line commands. The queue itself will contain either composed commands (a whole line) or a circle command (a dot). That way we’ll still undo the last command in the queue, but actually undo the whole stroke. 

Check the changes [here][undo2].

The composed command:

{% highlight swift %}
struct ComposedCommand : DrawCommand {
    init(commands: [DrawCommand]) {
        self.commands = commands;
    }
    
    // MARK: DrawCommand
    
    func execute(canvas: Canvas) {
        self.commands.map { $0.execute(canvas) }
    }
    
    mutating func addCommand(command: DrawCommand) {
        self.commands.append(command)
    }
    
    private var commands: [DrawCommand]
}
{% endhighlight %}

This does not expose the internal array of commands but allows the addition of a new command. Removing a command is not needed for now.

We can use this new command in our controller. We'll accumulate line commands in a temporary composed command, until the user finishes the stroke gesture. When the gesture is finished we'll save the composed command in the queue:

{% highlight swift %}
// FreehandDrawController.swift

private func startAtPoint(point: CGPoint) {
        self.lastPoint = point
        self.lineStrokeCommand = ComposedCommand(commands: [])
}
    
private func continueAtPoint(point: CGPoint) {
        let lineCommand = LineDrawCommand(a: self.lastPoint, b: point, width: self.width, color: self.color)
        
        self.canvas.executeCommands([lineCommand])

        self.lineStrokeCommand?.addCommand(lineCommand)
        self.lastPoint = point
    }
    
private func endAtPoint(point: CGPoint) {
        if let lineStrokeCommand = self.lineStrokeCommand {
            self.commandQueue.append(lineStrokeCommand)
        }
        
        self.lastPoint = CGPointZero
        self.lineStrokeCommand = nil
}

// New var:
private var lineStrokeCommand: ComposedCommand? 
{% endhighlight %}

With these changes we’ve finished our undo implementation.

## Conclusion

We've added the ability to draw dots and undo. When implementing undo we refactored the code to make it easier to understand and maintain in future. 

Taking leverage of the command design pattern and some domain modelling we could easily implement undo as an operation that removes that last command and executes all accumulated commands in order on a blank canvas.

In the next post we'll improve how the stroke looks.

[post1]: {{site.url}}/blog/2015/06/15/lets-build-freehand-drawing-in-ios-part-1
[part1]: https://github.com/badoo/FreehandDrawing-iOS/tree/part1
[part2]: https://github.com/badoo/FreehandDrawing-iOS/tree/part2
[dp]: https://sourcemaking.com/design_patterns/
[command]: https://sourcemaking.com/design_patterns/command
[points]: https://github.com/badoo/FreehandDrawing-iOS/commit/8a5f9a044a9cf39bf7790165edc28046f4701dd9
[refactor1]: https://github.com/badoo/FreehandDrawing-iOS/commit/bc1c896ce5800caea00d986bbb4aeef0f49e310b
[undo1]: https://github.com/badoo/FreehandDrawing-iOS/commit/95e27c8ec91d169ab8e91a16692a3e3c58a26e2f
[undo2]: https://github.com/badoo/FreehandDrawing-iOS/commit/69d26fdf5da106eb34a1f9a37ae0d26fb4242bab



