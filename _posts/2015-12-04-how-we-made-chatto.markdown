---
layout: post
title: How we made Chatto
author: Diego Sanchez Roman
date: 2015-12-04
categories: iOS Swift
---

Our chat was old, having evolved over the years into a massive view controller with weird fixes that nobody could understand. It was difficult to add new types of messages and new bugs were easily introduced. So we decided to rewrite it from scratch on Swift and make it [open source](https://github.com/badoo/Chatto).


We started with two goals in mind:

* **Scalable architecture**: new types of messages should be easy to add and shouldn’t affect existing code.
* **Good performance**: we wanted super smooth loading of messages and scrolling.

I will mainly focus on implementation details, what approaches we took and how we ended up with the final result. There’s a fairly good overview of the architecture on our [GitHub page](https://github.com/badoo/Chatto).

# UICollectionView vs UITableView
Our old chat uses UITableView. There’s nothing wrong with it, but UICollectionView offers a richer API with more possibilities for customization ([animations](https://www.objc.io/issues/12-animations/collectionview-animations/), [UIDynamics](https://www.objc.io/issues/5-ios7/collection-views-and-uidynamics/),...) and optimization (custom layouts, invalidation contexts).

Not only that, but, we also [researched](http://petersteinberger.com/blog/2013/how-to-inspect-the-view-hierarchy-of-3rd-party-apps) some existing chat applications and all of them were using UICollectionView. So it was a no-brainer decision to go with UICollectionView.

# Text messages
No chat exists without text bubbles. In fact, they’re the most challenging messages to implement in terms of performance, because rendering and sizing text is slow. We wanted to have link detection with native actions, like iMessage does.

UITextView offered all those requirements out of the box, without the need to write a single line to handle link interaction. That’s why we chose it, a decision which turned out to be a painful one, as you’ll see.


# Auto Layout & Self-Sizing cells
Layout and size calculation have always been a source of problems: it's really easy to end up with duplicated code that hinders maintainability and causes bugs to appear, so we wanted to avoid this. Since we were supporting iOS 8 onwards we decided to try Auto Layout and sizing cells. [Here](https://github.com/diegosanchezr/Chatto/tree/badoo-blog-autolayout-try)’s a branch with a rough implementation of this approach.
We faced two big issues:

* **Jumps when scrolling up**: The flow layout calls preferredLayoutAttributesFittingAttributes(\_:) on the UICollectionViewCell in order to get the real size.
As it doesn’t match the estimated, it then adjusts the position of the existing displayed cells, making them jump down. We could have worked arounded this by inverting both collection views and cells with a 180 transform, but there was another issue, which was…
* **Poor scrolling performance**: we didn’t get 60 fps when scrolling down even with real sizes already calculated. The bottleneck was the Auto Layout engine and the UITextView sizing.
We weren’t really surprised about this, as we knew that Apple doesn’t use Auto Layout on iMessage cells. I should point out here that I’m not saying Auto Layout shouldn’t be used; in fact, we use it extensively at Badoo. However, it does come with a performance hit that typically affects collection/table views.

# Manual layout
So, we went with the traditional layout approach instead. We chose the classical method of using a dummy cell to calculate the sizes and be able to reuse as much code as possible between sizing and layout. This performed much better, but not good enough for an iPhone 4s. [Profiling](https://yalantis.com/blog/mastering-uikit-performance/) showed that too much work was being done in layoutSubviews.

Basically, we were doing the same work twice: once to calculate the size, and again right before moving a cell to the screen, on layoutSubviews. Why not cache those UITextView sizeThatFits(\_:) that were so costly to compute? We went a bit further than that and created a layout model for the cell, where the size and all frames of the subviews were calculated and we cached it. As a result, not only was the scrolling performance noticeably improved, but we also achieved perfect code reuse between sizeThatFits(\_:) and layoutSubviews.

Apart from that, we noticed another method on the heaviest stack trace, updateViews. This was a central (but small) method responsible for updating the views according to the specified style and the data in question. Having such a central method was good for flow reasoning and maintainability, but it was being triggered for almost every cell property setter. We came up with two optimisations to alleviate this problem:

* **Two different contexts**: .Normal and .Sizing. We used .Sizing for our dummy sizing cell so we could skip some unnecessary updates like updating the bubble image or disable link detection in UITextView.
* **Batch updates**: We implemented performBatchUpdates(_:animated:completion) for cells. This allowed us to update all the setters in the view but only trigger an updateViews call.

# More performance
We already had good scrolling performance, but loading more messages (in batches of 50) was blocking the main thread for too long, causing the scrolling to halt for a fraction of a second.
Bottleneck was of course again UITextView.sizeThatFits(_:). We managed to make it considerably faster by disabling link detection, selection, and allowing non-contiguous layout in our dummy sizing cell:

{% highlight Swift %}
    textView.layoutManager.allowsNonContiguousLayout = true
    textView.dataDetectorTypes = .None
    textView.selectable = false
{% endhighlight Swift %}

Having done this, adding 50 messages at once was no longer an issue, given that there weren’t too many messages already. But we thought we could try to take it a step further.

Given all the abstractions we had built with the layout model being cached and reused for  both sizing and layout, we had everything in place to try and do the calculation in the background. Everything… but UIKit.

As you know, UIKit isn’t thread safe, and our first strategy (which was just to ignore this fact) caused some unsurprising crashes on UITextView. We knew we could use NSString.boundingRectWithSize(\_:options:attributes:context) in the background, but it wasn’t matching the values of UITextView.sizeThatFits(_:).
It took us a while, but we found a solution:

{% highlight Swift %}
    textView.textContainerInset = UIEdgeInsetsZero
    textView.textContainer.lineFragmentPadding = 0
{% endhighlight Swift %}

and round NSString.boundingRectWithSize(_:options:attributes:context) to screen pixels with

{% highlight Swift %}
extension CGSize {
    func bma_round() -> CGSize {
        return CGSize(width: ceil(self.width * scale) * (1.0 / scale), height: ceil(self.height * scale) * (1.0 / scale) )
    }
}
{% endhighlight Swift %}

This way, we were able to warm the cache in the background and then retrieve all the sizes very fast on the main thread… provided that our layout didn’t have to deal with 5,000 messages.

In this case, the iPhone 4s was struggling a bit on our UICollectionViewLayout.prepareLayout(). The main bottlenecks were  creating UICollectionViewLayoutAttributes objects and retrieving the 5,000 sizes from NSCache.
How did we improve this? We just did the same as with the cells. We created a plain layout model object supporting our UICollectionViewLayout and moved it to the background as well. Now in the main thread we were just replacing the old model with the new one. Everything was amazingly smooth, except for…

# Rotation and split-view
This wasn’t really a problem for us, as we don’t support rotation, but we already knew that we wanted to open-source Chatto and thought it would be a big plus if we could support rotation and split-view nicely. We already had background layout calculation with smooth scrolling and addition of new messages, but that didn’t help all that much when our layout was having to deal with 10,000 messages. Calculating so many text sizes was taking 10-20 seconds on an iPhone 4s, depending on the size of the messages, and we obviously couldn’t make the user wait that long.
Two solutions occurred to us:

* Calculate sizes twice, once for the current width and again for the width as if the device was already rotated.
* Avoid dealing with 10,000 messages.

The first solution is more of a hack than a proper solution - it doesn’t help much in split-view, and it doesn’t scale. So we went for the second solution:

# Sliding data source
After some testing on the iPhone 4s we concluded that supporting fast rotation meant handling a maximum of 500 messages, so we implemented a sliding data source with this (configurable) parameter. Opening a conversation would initially load 50 messages, and then we would add other 50 while the user was scrolling up to retrieve older ones. Once the user had scrolled up far enough we would start forgetting the first ones, so we had pagination in both directions. This wasn’t too difficult to implement, but there was a problem when the data source was “full” and a new message was inserted.

When we had 500 messages already and a new message was received we had to remove the first one, shift all the others one position up and insert the newly-received message. Again, this wasn’t difficult to implement, but UICollectionView.performBatchUpdates(_:completion:) didn’t like it. There were two main issues, which you can reproduce [here](https://github.com/diegosanchezr/Chatto/tree/badoo-blog-sliding-datasource-glitches):

* Sluggish scrolling and jumps when receiving many messages.
* Broken animation on message insertion due to changes in the content offset origin.

In order to solve these glitches we decided to relax the constraint of having a strict maximum number of messages. We would allow insertions to break the limit rule so collection updating was smooth. Once insertion  had been completed, and no more changes were pending in the update queue, we would issue a “too many messages” warning to the data source. The adjustment would then be handled separately with a reloadData instead of performBatchUpdates.
As we didn’t have much control over when this would happen and given that user could have scrolled to any position, we needed to tell the data source where the user had scrolled to, not to get rid of messages the user was seeing at that moment:

{% highlight Swift %}
public protocol ChatDataSourceProtocol: class {
    ...
    func adjustNumberOfMessages(preferredMaxCount preferredMaxCount: Int?, focusPosition: Double, completion:(didAdjust: Bool) -> Void)
}
{% endhighlight Swift %}

# UITextView hacks
So far, I’ve mentioned Auto Layout performance issues, sizing performance issues, and obstacles to getting alternative sizing for background calculation using NSString.boundingRectWithSize(_:options:attributes:context).

To benefit from link detection and native action handlers, we had to enable the selectable property of the UITextView. This came with some unwanted side effects to our bubble, like free range text selection and magnifier glass. To support those features, UITextView also adds a handful of gesture recognisers that were interfering with selection and long presses in the text bubbles.
I won’t cover in detail the hacks we made to work around these issues, but you can check [ChatMessageTextView](https://github.com/badoo/Chatto/blob/ea3dc6b79adb0df07ff3578a919a039a25eb4549/ChattoAdditions/Source/Chat%20Items/TextMessages/Views/TextBubbleView.swift) and [BaseMessagePresenter](https://github.com/badoo/Chatto/blob/ea3dc6b79adb0df07ff3578a919a039a25eb4549/ChattoAdditions/Source/Chat%20Items/BaseMessage/BaseMessagePresenter.swift).

# Interactive keyboard
Not only did UITextView caused the aforementioned problems, it also affected the keyboard. Interactive dismissal of the keyboard should be a fairly easy thing to achieve nowadays.
You just need to override inputAccessoryView and canBecomeFirstResponder in your view controller as explained [here](https://robots.thoughtbot.com/input-accessorizing-uiviewcontroller). However, this wasn't working well with the UIActionSheets presented by UITextView if the user long-pressed on a link.

Basically the action sheet was appearing underneath the keyboard and wasn’t visible at all. There’s another [branch](https://github.com/diegosanchezr/Chatto/tree/badoo-blog-uitextview-keyboard-bug) where you can play with this issue ([rdar://23753306](https://openradar.appspot.com/radar?id=4992538469466112)).

We had to place the input component in the regular hierarchy of the view controller, listen to the keyboard notifications and change the collection view insets manually, as has always been done. However, no notification is received when the user is interacting with the keyboard, and the input bar stayed in the middle of the screen, leaving a gap between it and the keyboard as the user dragged it down.
The solution to this is kind of a hack, and consists of placing a dummy input accessory view and observing it via KVO.
You can find more details [here](https://medium.com/ios-os-x-development/a-stickler-for-details-implementing-sticky-input-fields-in-ios-f88553d36dab).

# TL;DR
* We tried Auto Layout, but we had to move to manual layout as performance wasn’t good enough.
* We evolved to a layout model idea that allowed us to reuse code in layoutSubViews and sizeThatFits(_:), and enabled layout  calculation in the background. Turns out we somehow coincided with some ideas in [AsyncDisplayKit](http://asyncdisplaykit.org/)
* We implemented performBatchUpdates(_:animated:completion) and two different contexts for cells to minimise view updates.
* We implemented a sliding data source with message count containment to achieve fast rotation and split-view size changes.
* UITextView was really painful to adopt, and is still a bottleneck in scrolling performance on older devices (iPhone 4s) due to link detection. We stuck with it because we wanted native actions when interacting with the links.
* Because of UITextView, we had to manually implement interactive dismissal of the keyboard by observing a dummy view via KVO.

-- Badoo iOS Team --


