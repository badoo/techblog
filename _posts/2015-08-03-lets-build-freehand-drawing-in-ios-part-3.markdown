---
layout: post
title: "Let's build: Freehand Drawing in iOS - Part 3"
author: Miguel Angel Quinones
date:   2015-08-03
categories: iOS tutorial
---

This the third and final post of tutorials in which we build **Freehand Drawing** for iOS. In this part we will improve how the stroke looks and feels.

You can check the previous posts here:
- [Part 1][post1]: Naive implementation
- [Part 2][post2]: Refactor and undo

In the last post we did a refactor and implemented undo functionality, thus finishing all the features of our small drawing application. Now it is time to improve the look and feel of the drawing itself.

# Lines

We implemented drawing by connecting the dots the user goes through with her finger. The connection itself is currently done by straight lines between touch points:

![lines]({{page.imgdir}}/lines.png)

This is very simple to implement but the drawing itself looks artificial and ‘computerish’. A human would never draw this if the finger was the tip of a pen. We reduced how noticeable this is by increasing the stroke width to a generally big value. Let’s reduce it and we will adjust from there.

![lines2]({{page.imgdir}}/lines2.png)

# Adding a curve

The first improvement we can do is to add some curvature to how we connect the dots. To choose how we join the user touches we need to satisfy two constraints:

- The points are not known in advance as user continuously touches the screen and creates new points. We draw curves only knowing previous points.
- We can’t redraw segments when new points are added. This means we are restricted on how we ensure a good curve between segments.

Considering our restrictions, we could try to use the simplest and most used curve interpolation between two points: [Bezier curves][bezier].

We won’t use [Catmull-Rom spline] because of several reasons:
- Catmull requires all points in advance.
- We would need to implement it ourselves or use a library. We can use Apple’s implementation of Bezier curves in `Core Graphics` framework.

A cubic bezier curve is specified by two target points and two control points:

![cubic_bezier]({{page.imgdir}}/cubic_bezier.jpg)

A quadratic bezier curve is specified by two target points and one control point:

![quadratic_bezier]({{page.imgdir}}/quadratic_bezier.jpg)

Using Bezier paths, to ensure continuity of the curve the choice of control points is vital. For now we will use quadratic Bezier because it only needs one control point. We can adopt a cubic Bezier path later if the result is not satisfactory.

## Curves with Bezier splines

**TODO: Explain and diagrams**

Let’s modify our code to support drawing of curves.

First we need to modify our `LineDrawCommand`. In the case of the first two touches, we can’t draw more than a straight line, as we don’t have previous points data. Afterwards, to trace a cubic bezier using the midpoints we will need 3 touches.

We can create a structure representing a segment to increase readability of our code:

```swift
struct Segment {
    let a: CGPoint
    let b: CGPoint
    
    var midPoint: CGPoint {
        return CGPoint(x: (a.x + b.x) / 2, y: (a.y + b.y) / 2)
    }
}
```

And we will initialize our draw command with one segment, and optionally a second one, to form the 3 needed touch points. When all points are provided, the command will draw a curve. If only two points are provided, the command will continue to draw a line instead.

```swift
struct LineDrawCommand : DrawCommand {
    let current: Segment
    let previous: Segment?
    
    let width: CGFloat
    let color: UIColor

    // MARK: DrawCommand
    
    func execute(canvas: Canvas) {
        self.configure(canvas)

        if let previous = self.previous {
            self.drawQuadraticCurve(canvas)
        } else {
            self.drawLine(canvas)
        }
    }
    
    private func configure(canvas: Canvas) {
        CGContextSetStrokeColorWithColor(canvas.context, self.color.CGColor)
        CGContextSetLineWidth(canvas.context, self.width)
        CGContextSetLineCap(canvas.context, kCGLineCapRound)
    }
    
    private func drawLine(canvas: Canvas) {
        CGContextMoveToPoint(canvas.context, self.current.a.x, self.current.a.y)
        CGContextAddLineToPoint(canvas.context, self.current.b.x, self.current.b.y)
        CGContextStrokePath(canvas.context)
    }
    
    private func drawQuadraticCurve(canvas: Canvas) {
        if let previousMid = self.previous?.midPoint {
            let currentMid = self.current.midPoint
            
            CGContextMoveToPoint(canvas.context, previousMid.x, previousMid.y)
            CGContextAddQuadCurveToPoint(canvas.context, current.a.x, current.a.y, currentMid.x, currentMid.y)
            CGContextStrokePath(canvas.context)
        }
    }
}
```

The last change is to our `DrawController`. It needs to use the changed LineDrawCommand, and keep state about previous segments as the user continues moving the finger.

```swift
// In DrawController.swift
private func continueAtPoint(point: CGPoint) {
        let segment = Segment(a: self.lastPoint, b: point)
        
        let lineCommand = LineDrawCommand(current: segment, previous: lastSegment, width: self.width, color: self.color)
        
        self.canvas.executeCommands([lineCommand])

        self.lineStrokeCommand?.addCommand(lineCommand)
        self.lastPoint = point
        self.lastSegment = segment
    }

// Other minor cleanup necessary, please refer to the repository
```

If you run and try now the stroke is much less blocky:

![lines3]({{page.imgdir}}/lines3.png)

If you would like to improve the stroke even further, you can try adopting cubic bezier paths. To use those you will need an additional control point but a similar approach. We will move on to a more 'exotic' improvement.

# Changing stroke width

Up until now, our stroke has been uniform in width. This is practical and easy to implement, but we can add final nice touch to give our feature a distinctive and playful look. We will change the width of the stroke depending on how fast the user is moving the finger.

We want to remind the user of something from the real world without emulating it perfectly, as we are not building a drawing application. We can even exaggerate the effect a bit to make it more interesting.

As we are not drawing triangles, but just using higher level line drawing commands, we only have control of the width of one segment. Every new segment we draw can change the width. Let's add the width to our segment structure:

```swift

```

Then we need to use the width of the segment when drawing.


# Conclusion

We’ve improved the stroke of our small drawing application, by connecting the dots using more than just straight lines. We’ve also achieved a more realistic and playful feel by changing the width of the stroke depending on the speed of the user touches. 

During the course of these tutorials we have seen what technical challenges a developer may be faced when implementing such features, and evolved our code as needed by refactoring and redesigning as our requirements change.

The repository with the latest changes can be found [here][final].

[post1]: {{site.url}}/blog/2015/06/15/lets-build-freehand-drawing-in-ios-part-1
[post2]: {{site.url}}/blog/2015/06/29/lets-build-freehand-drawing-in-ios-part-2
[part1]: https://github.com/badoo/FreehandDrawing-iOS/tree/part1
[part2]: https://github.com/badoo/FreehandDrawing-iOS/tree/part2
[final]: https://github.com/badoo/FreehandDrawing-iOS
[bezier]: https://pomax.github.io/bezierinfo/
[catmull]: https://en.wikipedia.org/wiki/Cubic_Hermite_spline#Catmull.E2.80.93Rom_spline
[bezier-continued]: http://code.tutsplus.com/tutorials/ios-sdk_freehand-drawing--mobile-13164

