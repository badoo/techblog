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

The main feature we want to talk about in this post is adding **undo**. You probably know what this is about but let's review it anyway: We will add a button which lets the user to go back in time, and undo the last drawn line or point. This will allow her to correct mistakes or simply make up her mind after drawing something.

Bear in mind that undo will remove the last full line or dot the user drew between touching the screen and lifting the finger from the screen, not the last part of the last line.

## Modifying the code

The current code is simple and understandable. To add undo, possibly the first idea that comes to mind is to add some kind of memory of the path we have been drawing, and then remove the last part when user taps the button. That could easily be a simple ordered array of points the user went through.

But then, what about the fact that we want to undo a whole stroke? So we need to keep track of when the stroke started and when it ended. What about dots? We need to differentiate between drawing dots and drawing lines. And then, how do we actually undo a line? We have a cached buffer with the accumulated contents the user has been drawing, and we can only render on top of it.

Another issue is that all the code is contained in the view level, and now it is all the 'visual' logic. But the only way to access data of touches and the history of the user finger movements is to add the functionality directly to the view. It seems that our `DrawView` object code will grow very fast, so it will be problematic in the future. 

In this case, we can address this issues by changing our approach and design, and using a [software design pattern][dp]. In particular this problem is easily modelled with the [command pattern][command].

## Command pattern

The command pattern encapsulates the execution of some action (the command), and abstracts the user of the actions, so it does not know how they execute that action. The commands can then be used in a heterogeneous way, and higher level operations become trivial, such as reorder, persistence, or undo.

## The commands

Let's try to model our actions. In our domain the actions are strokes the user draws with her finger.

## The queue



### Undo implementation

#### Options
- A command can undo itself
- A command can just do itself, undo implemented at queue level
- ?

#### Abstracting the interfaces

#### Redoing whole queue

#### Undoing a single command

## Testing our design: Adding tap to draw dots

## Analysis

- Choice of structs vs classes
- Flexibility through protocols
- Design patterns are useful ;)

[post1]: {{site.url}}/blog/2015/06/15/lets-build-freehand-drawing-in-ios-part-1
[part1]: https://github.com/badoo/FreehandDrawing-iOS/tree/part1
[part2]: https://github.com/badoo/FreehandDrawing-iOS/tree/part2
[points]: https://github.com/badoo/FreehandDrawing-iOS/commit/8a5f9a044a9cf39bf7790165edc28046f4701dd9
[dp]: https://sourcemaking.com/design_patterns/
[command]: https://sourcemaking.com/design_patterns/command
