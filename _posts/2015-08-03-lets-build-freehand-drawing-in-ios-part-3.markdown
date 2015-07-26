---
layout: post
title: "Let's build: Freehand Drawing in iOS - Part 3”
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

Considering our restrictions, we could try to use the simplest and most used spline between two points: Cubic [Bezier curves][bezier]. The main question when drawing Bezier curves is how to connect the dots, and what control points to use. 

For our application we will need to define a way our control points are specified to ensure continuity between points. Let’s refactor our code and use some arbitrary connection between segments, like the middle point.

# Changing stroke width

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

