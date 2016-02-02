---
layout: post
title:  Batch updates for UITableView and UICollectionView
author: Vladimir Magaziy, Viacheslav Radchenko
date:   2015-10-08
categories: Objective-C
---

Apple did a tremendous job in giving developers such powerful building blocks as [UITableView](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UITableView_Class/) and [UICollectionView](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UICollectionView_class/). It’s even possible to claim that iOS wouldn’t have been such a success without these general purpose views. But unfortunately when it comes time to update these views in a batch fashion, it appears to be surprisingly [hard](http://stackoverflow.com/search?q=uicollectionview+batch+updates). If you’ve tried to do it, you’re likely to be familiar with internal exceptions stating that the data model is not in sync with requested updates.

This article is about our attempts to update the mentioned views correctly according to obscure rules, in order to avoid these exceptions leading to crashes in runtime.

# What is a batch update and when is it needed?

A batch update is a set of the following operations:

- Insertion
- Deletion
- Move
- Reload

It is applied for both items and sections in the view which are combined and executed together, perhaps in an animated fashion.

**UICollectionView** allows us to perform batch updates using the `- [UICollectionView performBatchUpdates:completion:]` [method](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UICollectionView_class/#//apple_ref/occ/instm/UICollectionView/performBatchUpdates:completion:). For instance, to reload and insert items at particular index paths and remove the first section, it may look as follows:

{% highlight c %}
[collectionView performBatchUpdates:^{
	[collectionView reloadItemsAtIndexPaths:@[ indexPathForUpdate ]];
	[collectionView insertItemsAtIndexPaths:@[ indexPath1ForInsertion, indexPath2ForInsertion2 ]];
	[collectionView deleteSections:[NSIndexSet indexSetWithIndex:0]];
} completion:^(BOOL finished) {
	// Called async when all animations are finished; finished = NO if cancelled
}];
{% endhighlight %}

In other words, all operations are to be specified in the given block, and it’s **UIKit** business to generate corresponding animations for us.

For **UITableView** it’s possible to do the same the but with additional calls of `- [UITableView beginUpdates]`-`- [UITableView endUpdates]` [methods](https://developer.apple.com/library/prerelease/ios/documentation/UIKit/Reference/UITableView_Class/#//apple_ref/occ/instm/UITableView/beginUpdates). It is even possible to specify which operations are to be animated and which are not:

{% highlight c %}
[self beginUpdates];

[tableView reloadRowsAtIndexPaths:@[ indexPathForUpdate ]
                 withRowAnimation:UITableViewRowAnimationFade]; // With fade animation

[tableView insertItemsAtIndexPaths:@[ indexPath1ForInsertion, indexPath2ForInsertion2 ]
                  withRowAnimation:UITableViewRowAnimationAutomatic]; // With automatic animation

[tableView deleteSections:[NSIndexSet indexSetWithIndex:0]]
         withRowAnimation:UITableViewRowAnimationNone]; // Without animation

[self endUpdates];
{% endhighlight %}

**UIKit** does not allow us to track finishing of animations for **UITableView** out of the box like for **UICollectionView**, but fortunately it can be achieved easily using the **CoreAnimation** [framework](https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/CoreAnimation_guide/Introduction/Introduction.html) which drives the mentioned animations under the hood:

{% highlight c %}

[CATransaction begin];
[CATransaction setCompletionBlock:^{
	// Called async when all animations are finished
};
[tableView beginUpdates];

// ...

[tableView endUpdates];
[CATransaction commit];
{% endhighlight %}

# Encountered issues

As mentioned above, more often than not when you try to perform more or less complex batch updates, you’ll end up receiving an internal inconsistency exception like this:

> *** Terminating app due to uncaught exception 'NSInternalInconsistencyException', reason: 'attempt to insert item 2 into section 0, but there are only 2 items in section 0 after the update’

Under some circumstances it may even lead to memory issues with internal **UIKit** entities used for updates:

{% highlight c %}
__pthread_kill + 8
pthread_kill + 108
abort + 108
szone_error + 404
free_list_checksum_botch + 32
tiny_free_list_remove_ptr + 280
zone_free_definite_size + 1668
-[UICollectionViewUpdate dealloc] + 348
-[UICollectionView _updateWithItems:tentativelyForReordering:] + 2904
-[UICollectionView _endItemAnimationsWithInvalidationContext:tentativelyForReordering:] + 10116
-[UICollectionView _performBatchUpdates:completion:invalidationContext:tentativelyForReordering:] + 348
-[UICollectionView performBatchUpdates:completion:]
{% endhighlight %}

If such issues appear you should consider yourself lucky, as even if you don’t get them users of your application might, and this will lead to crashes and plenty of disappointment.

Something weird is [happening](https://www.google.com/search?q=uicollectionview+nsinternalinconsistencyexception)...
 
# Let’s read the documentation (again!)

Apparently something’s being done wrong, so let’s revisit documentation and read how [batch updates](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UICollectionView_class/#//apple_ref/occ/instm/UICollectionView/performBatchUpdates:completion:) are to be performed again:


> Deletes are processed before inserts in batch operations. This means the indexes for the deletions are processed relative to the indexes of the collection view’s state before the batch operation, and the indexes for the insertions are processed relative to the indexes of the state after all the deletions in the batch operation.

This is helpful, but not very helpful, as even if the batch updates are performed in accordance with this statement it won’t work out as expected.

So let’s just work around these issues by using `@try/@catch` blocks to suppress propagation of internal exceptions and thus abnormal termination because of unhandled exceptions:

{% highlight c %}
@try {
	[collectionView performBatchUpdates:^{
		// Do required updates
	} completion:nil];
} @catch (NSException *exception) {
	LOG_ERROR(@"Error updating collection view: %@", exception);
}
{% endhighlight %}

This seems to be promising, but it fact it does not work out as the view appears in an incorrect internal state, meaning it’s  not possible to interact with it in a predicted way after that. We are left with an approach like:

> Just try everything possible and if it something does not work, make a workaround for it.

# Found solutions and workarounds

An initial implementation of the update algorithm is implemented and various combinations of update operations are simulated on both a simulator and a real device. Once an issue is revealed the algorithm is adjusted and a test case scenario is implemented. In this scenario, we’ve noticed the following:

- Simultaneous updates of sections and items lead to the mentioned exceptions and incorrect internal states of views, so once section updates are detected, views are reloaded completely and without animations using `-reloadData` methods. This is a **significant limitation** of this approach.

- Reloads can not be used in conjunction with other changes, as under some circumstances they lead to memory corruption issues with internal **UIKit** entities. This has been worked around by asking a corresponding data source to update a specified cell in a way it’s reloaded (updated) when reused.

With that, if *sections are **NOT** added, removed or moved often*, consider reusing our [solution](https://github.com/badoo/ios-collection-batch-updates).

# Solution description

In order to generalise our solution, all collection items and sections are supposed to conform to the following protocols, respectively:

{% highlight c %}
@protocol BMAUpdatableCollectionItem <NSObject>
@property (nonatomic, readonly, copy) NSString *uid;
@end

@protocol BMAUpdatableCollectionSection <BMAUpdatableCollectionItem>
@property (nonatomic, copy) NSArray /*<id<BMAUpdatableCollectionItem>>*/ *items;
@end
{% endhighlight %}

Once **both** old and new data models are available, it’s possible to calculate necessary updates and apply them using extension methods of the **UITableView** and **UICollectionView** classes.

<img alt="Batch Updates Diagram" src="{{page.imgdir}}/batch_updates.png" style="max-width: 100%;" />

{% highlight c %}
NSArray/*<id<BMAUpdatableCollectionSection>>*/ *oldSections = ...;
NSArray/*<id<BMAUpdatableCollectionSection>>*/ *newSections = ...;
[BMACollectionUpdate calculateUpdatesForOldModel:oldSections newModel:newSections sectionsPriorityOrder:nil eliminatesDuplicates:NO completion:^(NSArray *sections, NSArray *updates) {
	[self performBatchUpdates:updates forSections:sections];
}];
{% endhighlight %}

{% highlight c %}
@implementation TableViewController

- (void)performBatchUpdates:(NSArray *)updates forSections:(NSArray *)sections {
    [self.tableView bma_performBatchUpdates:updates applyChangesToModelBlock:^{
        self.sections = sections;
    } reloadCellBlock:^(UITableViewCell *cell, NSIndexPath *indexPath) {
        [self reloadCell:cell atIndexPath:indexPath];
    } completionBlock:nil];
}

@end
{% endhighlight %}

{% highlight c %}
@implementation CollectionViewController

- (void)performBatchUpdates:(NSArray *)updates forSections:(NSArray *)sections {
    [self.collectionView bma_performBatchUpdates:updates applyChangesToModelBlock:^{
        self.sections = sections;
    } reloadCellBlock:^(UICollectionViewCell *cell, NSIndexPath *indexPath) {
        [self reloadCell:cell atIndexPath:indexPath];
    } completionBlock:nil];
}

@end
{% endhighlight %}

Please note that when a full reload of view is needed, the array of updates specified in the block is `nil`, so once they are propagated to extensions methods the reload is done automatically. Implementation of `- [Controller reloadCell:atIndexPath:]` is to be the same as for the corresponding data source method: `- tableView:cellForRowAtIndexPath:` or `- collectionView:cellForItemAtIndexPath:`:

{% highlight objc %}
- (UICollectionViewCell *)collectionView:(UICollectionView *)collectionView cellForItemAtIndexPath:(NSIndexPath *)indexPath {
    UICollectionViewCell *cell = [self.collectionView dequeueReusableCellWithReuseIdentifier:@"cell" forIndexPath:indexPath];
    [self reloadCell:cell atIndexPath:indexPath];
    return cell;
}
{% endhighlight %}

Please use our approach if it's applicable to your needs, and do share your ideas or criticisms by adding comments to this article.

