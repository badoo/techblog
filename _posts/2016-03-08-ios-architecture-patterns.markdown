---
layout: post
title:  iOS Architecture Patterns
author: Bohdan Orlov
date:   2016-03-07
categories: iOS
excerpt: Feeling weird while doing MVC in iOS? Have doubts about switching to MVVM? Heard about VIPER, but not sure if it worth it? Keep reading to find the answers to questions above.
---
*FYI: Slides from my presentation at NSLondon are available <a href="http://slides.com/borlov/arch/fullscreen#/" target="_blank">here</a>.*

<img class="no-box-shadow" src="{{page.imgdir}}/0.png"/>

Feeling weird while doing MVC in iOS? Have doubts about switching to MVVM? Heard about VIPER, but not sure if it worth it?

Keep reading to find the answers to questions above. However if you don’t — feel free to place your complaint in the comments.

You are about to structure your knowledge about architectural patterns in an iOS environment. We’ll briefly review some of the popular patterns and compare them in theory and practice, going over a few examples. Follow the links throughout the article if you would like to read in more detail about each pattern.

*Mastering design patterns might be addictive, so beware: you might end up asking yourself more questions now than before reading this article, like these:*

*Who is supposed to own networking requests: a Model or a Controller?*

*How do I pass a Model into a View Model of a new View?*

*Who creates a new VIPER module: a Router or a Presenter?*

<img class="no-box-shadow" src="{{page.imgdir}}/1.png"/>

<br/>

## Why care about choosing the architecture?
Choosing the right architecture is important, especially to simplify the debugging process. ”. Naturally, it is hard to keep big classes in mind as whole entity, thus, you’ll always be missing some important detail. If you are already in this situation with your application, it is very likely that:

- This class is the UIViewController subclass.
- Your data stored directly in the UIViewController
- Your UIViews do almost nothing
- The Model is a dumb data structure
- Your Unit Tests cover nothing

And this can happen, despite the fact that you are following Apple’s guidelines and implementing <a href="https://developer.apple.com/library/ios/documentation/General/Conceptual/DevPedia-CocoaCore/MVC.html" target="_blank">Apple’s MVC</a> pattern, so don’t feel bad. There is something wrong with the <a href="https://developer.apple.com/library/ios/documentation/General/Conceptual/DevPedia-CocoaCore/MVC.html" target="_blank">Apple’s MVC</a>, but we’ll get back to it later.

Let’s define the **features** of a good architecture:

1. Balanced **distribution** of responsibilities among entities with strict roles.
2. **Testability** usually comes from the first feature (and don’t worry: it is easy with appropriate architecture).
3. **Ease of use** and a low maintenance cost.

### Why Distribution?

Having a balanced distribution doesn’t overload the brain, while trying to figure out how things work. If you think the more you develop the better your brain will adapt to understanding complexity, then you are right. But this ability doesn’t scale linearly and reaches the cap very quickly. So the easiest way to defeat complexity is to divide responsibilities among multiple entities following the **<a href="https://en.wikipedia.org/wiki/Single_responsibility_principle" target="_blank">single responsibility principle</a>**.

### Why Testability?

This is usually not a question for those who already felt gratitude to unit tests, which failed after adding new features or due to refactoring some intricacies of the class. This means the tests saved those developers from finding issues in runtime, which might happen when an app is on a user’s device and the fix <a href="http://appreviewtimes.com/" target="_blank">takes a week</a> to reach the user.

### Why Ease of use?

This does not require an answer but it is worth mentioning that the best code is the code that has **never been written**. Therefore the less code you have, the less bugs you have. This means that the desire to write **less code** should never be explained solely by laziness of a developer, and you should not favour a smarter solution closing your eyes to its **maintenance cost**.

<br/>

## MV(X) essentials

Nowadays we have many options when it comes to architecture design patterns:

- <a href="https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller" target="_blank">MVC</a>
- <a href="https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93presenter" target="_blank">MVP</a>
- <a href="https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel" target="_blank">MVVM</a>
- <a href="https://www.objc.io/issues/13-architecture/viper/" target="_blank">VIPER</a>

The first three put the entities of the app into one of 3 categories:

- **Models**  - responsible for the domain data or a <a href="https://en.wikipedia.org/wiki/Data_access_layer" target="_blank">data access layer</a> which manipulates the data, think of ‘**Person**’ or ‘**PersonDataProvider**’ classes.
- **Views**  -  responsible for the presentation layer (**GUI**), for iOS environment think of everything starting with ‘**UI**’ prefix.
- **Controller/Presenter/ViewModel** -  the glue or the mediator between the **Model** and the View, in general responsible for altering the **Model** by reacting to the user’s actions performed on the **View** and updating the **View** with changes from the **Model**.

Having entities divided allows us to:
- Understand them better (as we already know)
- Reuse them (mostly applicable to the **View** and the **Model**)
- Test them independently

***Let’s start with MV(X) patterns and get back to VIPER later.***

## MVC

### How it used to be

Before discussing Apple’s vision of MVC let’s have a look at the <a href="https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller" target="_blank">traditional one</a>.

<img class="no-box-shadow" src="{{page.imgdir}}/2.png" title="Traditional MVC"/>
*<center> Traditional MVC </center>*

In this case, the **View** is stateless. It is simply rendered by the **Controller** once the **Model** is changed. Think of a web page, it completely reloads once you press on the link to navigate somewhere else. Although it is possible to implement the traditional MVC in iOS application, it doesn’t make much sense due to the architectural problem  -  all three entities are tightly coupled, each entity **knows** about the other two. This dramatically reduces reusability of each of them , which is not what you want to have in your application. For this reason, we skip even trying to write a canonical MVC example.

***Traditional MVC doesn't seems to be applicable to modern iOS development.***

<br/>

## Apple’s MVC

### Expectation

<img class="no-box-shadow" src="{{page.imgdir}}/3.png" title="Cocoa MVC"/>
*<center> Cocoa MVC </center>*

The Controller is a mediator between the View and the Model so that they don’t know about each other. The least reusable is the Controller and this is usually fine for us, since we must have a place for all that tricky business logic that doesn’t fit into the Model.

In theory, it looks very straightforward, but you feel that something is wrong, right? You’ve even heard people unabbreviating MVC as the Massive View Controller. Moreover, view controller offloading became an important topic for the iOS developers. Why does this happen if Apple just took the traditional MVC and improved it a bit?

<br/>

## Apple’s MVC

### Reality

<img class="no-box-shadow" src="{{page.imgdir}}/4.png" title="Realistic Cocoa MVC"/>
*<center> Realistic Cocoa MVC </center>*

Cocoa MVC encourages you to write **Massive** View Controllers, because they are so involved in **View**’s life cycle that it’s hard to say they are separate. Although you still have ability to offload some of the business logic and data transformation to the **Model**, you don’t have much choice when it comes to offloading work to the **View**. Most of time all the responsibility of the **View** is to send actions to the **Controller**. The view controller ends up being a delegate and a data source of everything, and is usually responsible for dispatching and cancelling the network requests and… you name it.

How many times have you seen code like this:

{% highlight swift %}

var userCell = tableView.dequeueReusableCellWithIdentifier("identifier") as UserCell
userCell.configureWithUser(user)

{% endhighlight %}

The cell, which is the **View** configured directly with the **Model**, so MVC guidelines are violated, but this happens all the time, and usually people don’t feel it is wrong. If you strictly follow the MVC, then you are supposed to configure the cell from the controller, but don’t pass the **Model** into the View as this will increase the size of your **Controller** even more.

***Cocoa MVC is reasonably unabbreviated as the Massive View Controller.***

The problem might not be evident until it comes to the <a href="http://nshipster.com/unit-testing/" target="_blank">Unit Testing</a> (hopefully, it does in your project). Since your view controller is tightly coupled with the view, it becomes difficult to test because you have to be very creative in mocking views and their life cycle. At the same time the view controller’s code has to be written in such a way that your business logic is separated as much as possible from the view layout code.

Let’s have a look on the simple playground example:

{% highlight swift %}
import UIKit

struct Person { // Model
    let firstName: String
    let lastName: String
}

class GreetingViewController : UIViewController { // View + Controller
    var person: Person!
    let showGreetingButton = UIButton()
    let greetingLabel = UILabel()

    override func viewDidLoad() {
        super.viewDidLoad()
        self.showGreetingButton.addTarget(self, action: "didTapButton:", forControlEvents: .TouchUpInside)
    }

    func didTapButton(button: UIButton) {
        let greeting = "Hello" + " " + self.person.firstName + " " + self.person.lastName
        self.greetingLabel.text = greeting

    }
    // layout code goes here
}
// Assembling of MVC
let model = Person(firstName: "David", lastName: "Blaine")
let view = GreetingViewController()
view.person = model;
{% endhighlight %}

*<center> MVC example </center>*

***MVC assembling can be performed in the presenting view controller.***

This doesn’t seem very testable, right? We can move the generation of greeting into the new *GreetingModel* class and test it separately, but we can’t test any presentation logic (although there is not much of such logic in the example above) inside the *GreetingViewController* without calling the UIView related methods directly (*viewDidLoad, didTapButton*). This might cause loading all views, and this is bad for the unit testing.

In fact, loading and testing UIViews on one simulator (e.g. iPhone 4S) doesn’t guarantee that it would work on the other devices (e.g. iPad). I’d recommend to remove “Host Application” from your Unit Test target configuration and run your tests without your application running on simulator.

***The interactions between the View and the Controller <a href="https://ashfurrow.com/blog/whats-worth-unit-testing-in-objective-c/" target="_blank">aren’t really testable with Unit Tests</a>***

With all that said, it might seems that Cocoa MVC is a pretty bad pattern to choose. But let’s assess it in terms of features defined in the beginning of the article:

- **Distribution** — the **View** and the **Model** in fact separated, but the **View** and the **Controller** are tightly coupled.
- **Testability** — due to the bad distribution you’ll probably only test your **Model**.
- **Ease of use** — the least amount of code among others patterns. In addition everyone is familiar with it, thus, it’s easily maintained even by the inexperienced developers.

Cocoa MVC is the pattern of your choice if you are not ready to invest more time in your architecture, and you feel that something with higher maintenance cost is an overkill for your tiny pet project.

***Cocoa MVC is the best architectural pattern in terms of the speed of the development.***

## MVP

### Cocoa MVC’s promises delivered

<img class="no-box-shadow" src="{{page.imgdir}}/6.png" title="Passive View variant of MVP"/>
*<center>Passive View variant of MVP</center>*

Doesn’t it look exactly like the Apple’s MVC? Yes, it does, but it’s name is <a href="https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93presenter" target="_blank">MVP</a> (Passive View variant). But wait a minute… Does this mean that Apple’s MVC is in fact a MVP? No, it’s not, because if you recall, in Apple’s MVC, the **View** is tightly coupled with the **Controller**, while the MVP’s mediator, **Presenter**, has nothing to do with the life cycle of the view controller. The **View** can be mocked easily, so there is no layout code in the **Presenter** at all, but it is responsible for updating the **View** with data and state.

<img class="no-box-shadow" src="{{page.imgdir}}/7.png"/>
*<center> What if I told you, the UIViewController is the View. </center>*

In terms of the **MVP**, the UIViewController subclasses are in fact the **Views** and not the **Presenters**. This distinction provides superb testability, which comes at cost of the development speed, because you have to make manual data and event binding, as you can see from the example:

{% highlight swift %}
import UIKit

struct Person { // Model
    let firstName: String
    let lastName: String
}

protocol GreetingView: class {
    func setGreeting(greeting: String)
}

protocol GreetingViewPresenter {
    init(view: GreetingView, person: Person)
    func showGreeting()
}

class GreetingPresenter : GreetingViewPresenter {
    unowned let view: GreetingView
    let person: Person
    required init(view: GreetingView, person: Person) {
        self.view = view
        self.person = person
    }
    func showGreeting() {
        let greeting = "Hello" + " " + self.person.firstName + " " + self.person.lastName
        self.view.setGreeting(greeting)
    }
}

class GreetingViewController : UIViewController, GreetingView {
    var presenter: GreetingViewPresenter!
    let showGreetingButton = UIButton()
    let greetingLabel = UILabel()

    override func viewDidLoad() {
        super.viewDidLoad()
        self.showGreetingButton.addTarget(self, action: "didTapButton:", forControlEvents: .TouchUpInside)
    }

    func didTapButton(button: UIButton) {
        self.presenter.showGreeting()
    }

    func setGreeting(greeting: String) {
        self.greetingLabel.text = greeting
    }

    // layout code goes here
}
// Assembling of MVP
let model = Person(firstName: "David", lastName: "Blaine")
let view = GreetingViewController()
let presenter = GreetingPresenter(view: view, person: model)
view.presenter = presenter

{% endhighlight %}
*<center>MVP example</center>*

### Important note regarding assembly

The MVP is the first pattern that reveals the assembly problem which happens due to having three actually separate layers. Since we don’t want the **View** to know about the **Model**, it is not right to perform assembly in presenting view controller (which is the **View**), thus we have to do it somewhere else. For example, we can make the app-wide **Router** service which will be responsible for performing assembly and the **View-to-View** presentation. This assembly issue arises and has to be addressed not only in the MVP but also in **all the following patterns**.

<br/>

Let’s look on the **features** of the MVP:

- **Distribution** — we have the most of responsibilities divided between the **Presente**r and the **Model**, with the pretty dumb **View** (in the example above the **Model** is dumb as well).
- **Testability** — is excellent, we can test most of the business logic due to the dumb View.
- **Easy of use** — in our unrealistically simple example, the amount of code is doubled compared to the MVC, but at the same time, idea of the MVP is very clear.

***MVP in iOS means superb testability and a lot of code.***

## MVP

### With Bindings and Hooters

There is the other flavour of the MVP — the Supervising Controller MVP. This variant includes direct binding of the **View** and the **Model** while the **Presenter** (The Supervising Controller) still handles actions from the **View** and is capable of changing the View.

<img class="no-box-shadow" src="{{page.imgdir}}/9.png" title="Supervising Presenter variant of the new MVP"/>
*<center>Supervising Presenter variant of the MVP</center>*

But as we have already learned before, vague responsibility separation is bad, as well as tight coupling of the **View** and the **Model**. That is similar to how things work in Cocoa desktop development.

This is the same as with the traditional MVC. I don’t see a point in writing an example for the flawed architecture.

## MVVVM

### The latest and the greatest of the MV(X) kind

The <a href="https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel" target="_blank">MVVM</a> is the newest of MV(X) kind thus, let’s hope it emerged taking into account problems MV(X) was facing previously.

In theory the Model-View-ViewModel looks very good. The **View** and the **Model** are already familiar to us, but also the **Mediator**, represented as the **View Model**.

<img class="no-box-shadow" src="{{page.imgdir}}/10.png" title="MVVM"/>
*<center>MVVM</center>*

It is pretty similar to the MVP:

- The MVVM treats the view controller as the View
- There is no tight coupling between the View and the Model

In addition, it does **bindings** like the Supervising version of the MVP; however, this time not between the **View** and the **Model**, but between the **View** and the **View Model**.

So what is the **View Model** in the iOS reality? It is basically UIKit **independent** representation of your **View** and its state. The **View Model** invokes changes in the **Model** and updates itself with the updated **Model**, and since we have a binding between the **View** and the **View Model**, the first is updated accordingly.

### Bindings

I briefly mentioned them in the MVP part, but let’s discuss them a bit here. Bindings come out of box for the OS X development, but we don’t have them in the iOS toolbox. Of course we have the KVO and notifications, but they aren’t as convenient as bindings.

So, provided we don’t want to write them ourselves, we have two options:

- One of the KVO based binding libraries like the <a href="https://github.com/Raizlabs/RZDataBinding" target="_blank">RZDataBinding</a> or the <a href="https://github.com/SwiftBond/Bond" target="_blank">SwiftBond</a>
- The full scale <a href="https://gist.github.com/JaviLorbada/4a7bd6129275ebefd5a6" target="_blank">functional reactive programming</a> beasts like <a href="https://github.com/ReactiveCocoa/ReactiveCocoa" target="_blank">ReactiveCocoa</a>, <a href="https://github.com/ReactiveX/RxSwift/" target="_blank">RxSwift</a> or <a href="https://github.com/mxcl/PromiseKit" target="_blank">PromiseKit</a>.

In fact, nowadays, if you hear “MVVM” — you think ReactiveCocoa, and vice versa. Although it is possible to build the MVVM with the simple bindings, ReactiveCocoa (or siblings) will allow you to get most of the MVVM.

There is one bitter truth about reactive frameworks: “with great power comes great responsibility”. It’s really easy to mess things up when you go reactive. In other words, if do something wrong, you might spend a lot of time debugging the app, so just take a look at this call stack.

<img class="no-box-shadow" src="{{page.imgdir}}/11.png" title="Reactive Debugging"/>
*<center>Reactive Debugging</center>*

In our simple example, the FRF framework or even the KVO is an overkill, instead we’ll explicitly ask the **View Model** to update using showGreeting method and use the simple property for greetingDidChange callback function.

{% highlight swift %}
import UIKit

struct Person { // Model
    let firstName: String
    let lastName: String
}

protocol GreetingViewModelProtocol: class {
    var greeting: String? { get }
    var greetingDidChange: ((GreetingViewModelProtocol) -> ())? { get set } // function to call when greeting did change
    init(person: Person)
    func showGreeting()
}

class GreetingViewModel : GreetingViewModelProtocol {
    let person: Person
    var greeting: String? {
        didSet {
            self.greetingDidChange?(self)
        }
    }
    var greetingDidChange: ((GreetingViewModelProtocol) -> ())?
    required init(person: Person) {
        self.person = person
    }
    func showGreeting() {
        self.greeting = "Hello" + " " + self.person.firstName + " " + self.person.lastName
    }
}

class GreetingViewController : UIViewController {
    var viewModel: GreetingViewModelProtocol! {
        didSet {
            self.viewModel.greetingDidChange = { [unowned self] viewModel in
                self.greetingLabel.text = viewModel.greeting
            }
        }
    }
    let showGreetingButton = UIButton()
    let greetingLabel = UILabel()

    override func viewDidLoad() {
        super.viewDidLoad()
        self.showGreetingButton.addTarget(self.viewModel, action: "showGreeting", forControlEvents: .TouchUpInside)
    }
    // layout code goes here
}
// Assembling of MVVM
let model = Person(firstName: "David", lastName: "Blaine")
let viewModel = GreetingViewModel(person: model)
let view = GreetingViewController()
view.viewModel = viewModel

{% endhighlight %}

*<center>MVVM example</center>*

And again back to our feature assessment:

- **Distribution** — it is not clear in our tiny example, but, in fact, the MVVM’s **View** has more responsibilities than the MVP’s **View**. Because the first one updates its state from the **View Model** by setting up bindings, while the second one just forwards all events to the **Presenter** and doesn’t update itself.
- **Testability** — the **View Model** knows nothing about the **View**, this allows us to test it easily. The **View** might be also tested, but since it is UIKit dependant you might want to skip it.
- **Easy of use** — its has the same amount of code as the MVP in our example, but in the real app where you’d have to forward **all** events from the **View** to the **Presenter** and to update the **View** manually, **MVVM** would be much skinnier if you used bindings.


***The MVVM is very attractive, since it combines benefits of the aforementioned approaches, and, in addition, it doesn’t require extra code for the View updates due to the bindings on the View side. Nevertheless, testability is still on a good level.***

## VIPER

### LEGO building experience transferred into the iOS app design

<a href="https://www.objc.io/issues/13-architecture/viper/" target="_blank">VIPER</a> is our last candidate, which is particularly interesting because it doesn’t come from the MV(X) category.

By now, you must agree that the granularity in responsibilities is very good. VIPER makes another iteration on the idea of separating responsibilities, and this time we have **five** layers.

<img class="no-box-shadow" src="{{page.imgdir}}/13.png" title="VIPER"/>
*<center>VIPER</center>*

- **Interactor** — contains business logic related to the data (**Entities**) or networking, like creating new instances of entities or fetching them from the server. For those purposes you’ll use some Services and Managers which are not considered as a part of VIPER module but rather an external dependency.
- **Presenter** — contains the UI related (but UIKit independent) business logic, invokes methods on the **Interactor**.
- **Entities** — your plain data objects, not the data access layer, because that is a responsibility of the **Interactor**.
- **Router** — responsible for the segues between the VIPER **modules**.

Basically, VIPER module can be a one screen or the whole user story of your application — think of authentication, which can be one screen or several related ones. How small are your “LEGO” blocks supposed to be? — It’s up to you.

If we compare it with the MV(X) kind, we’ll see a few differences of the distribution of responsibilities:

- **Model** (data interaction) logic shifted into the **Interactor** with the **Entities** as dumb data structures.
- Only the UI representation duties of the **Controller/Presenter/ViewModel** moved into the **Presenter**, but not the data altering capabilities.
- **VIPER** is the first pattern which explicitly addresses navigation responsibility, which is supposed to be resolved by the **Router**.

***The proper way of doing routing is a challenge for the iOS applications, the MV(X) patterns simply don’t address this issue.***

The example doesn’t cover **routing** or **interaction between modules**, as those topics are not covered by the MV(X) patterns at all.

{% highlight swift %}
import UIKit

struct Person { // Entity (usually more complex e.g. NSManagedObject)
    let firstName: String
    let lastName: String
}

struct GreetingData { // Transport data structure (not Entity)
    let greeting: String
    let subject: String
}

protocol GreetingProvider {
    func provideGreetingData()
}

protocol GreetingOutput: class {
    func receiveGreetingData(greetingData: GreetingData)
}

class GreetingInteractor : GreetingProvider {
    weak var output: GreetingOutput!

    func provideGreetingData() {
        let person = Person(firstName: "David", lastName: "Blaine") // usually comes from data access layer
        let subject = person.firstName + " " + person.lastName
        let greeting = GreetingData(greeting: "Hello", subject: subject)
        self.output.receiveGreetingData(greeting)
    }
}

protocol GreetingViewEventHandler {
    func didTapShowGreetingButton()
}

protocol GreetingView: class {
    func setGreeting(greeting: String)
}

class GreetingPresenter : GreetingOutput, GreetingViewEventHandler {
    weak var view: GreetingView!
    var greetingProvider: GreetingProvider!

    func didTapShowGreetingButton() {
        self.greetingProvider.provideGreetingData()
    }

    func receiveGreetingData(greetingData: GreetingData) {
        let greeting = greetingData.greeting + " " + greetingData.subject
        self.view.setGreeting(greeting)
    }
}

class GreetingViewController : UIViewController, GreetingView {
    var eventHandler: GreetingViewEventHandler!
    let showGreetingButton = UIButton()
    let greetingLabel = UILabel()

    override func viewDidLoad() {
        super.viewDidLoad()
        self.showGreetingButton.addTarget(self, action: "didTapButton:", forControlEvents: .TouchUpInside)
    }

    func didTapButton(button: UIButton) {
        self.eventHandler.didTapShowGreetingButton()
    }

    func setGreeting(greeting: String) {
        self.greetingLabel.text = greeting
    }

    // layout code goes here
}
// Assembling of VIPER module, without Router
let view = GreetingViewController()
let presenter = GreetingPresenter()
let interactor = GreetingInteractor()
view.eventHandler = presenter
presenter.view = view
presenter.greetingProvider = interactor
interactor.output = presenter

{% endhighlight %}

Yet again, back to the **features**:

- **Distribution** — undoubtedly, VIPER is a champion in distribution of responsibilities.
- **Testability** —no surprises here, better distribution — better testability.
- **Easy of use** — finally, two above come in cost of maintainability as you already guessed. You have to write huge amount of interface for classes with very small responsibilities.

### So what about LEGO?

While using VIPER, you might feel like building The Empire State Building from LEGO blocks, this is a signal that you <a href="https://inessential.com/2014/03/16/smaller_please" target="_blank">have a problem</a>. Maybe it’s too early to adopt VIPER for your application and you should consider something simpler. Some people ignore this and continue to make more work for themselves. I assume they believe that their apps will benefit from VIPER at least in the future, even if now the maintenance cost is unreasonably high. If you believe the same, then I’d recommend you to try <a href="https://github.com/rambler-ios/Generamba" target="_blank">Generamba</a> — a tool for generating VIPER skeletons. Although for me personally it feels like overkill.

## Conclusion

We went through several architectural patterns, and I hope you have found some answers to your questions. I have no doubt that you realised there is **no silver bullet**, so choosing an architecture pattern is a matter of weighing tradeoffs in your particular situation.

Therefore, it is natural to have a mix of architectures in the same app. For example: you’ve started with MVC, then you realised that one particular screen became too hard to maintain efficiently with the MVC and switched to the MVVM, but only for this screen. There is no need to refactor other screens as the MVC actually works because both of architectures are easily compatible and can coexist in one application.

### *Make everything as simple as possible, but not simpler — Albert Einstein*

Thank you for reading! If you liked this article, please hit ‘Recommend’ (the ❤ button) or leave a comment :)

<iframe class="video" width="560" height="315" src="https://player.vimeo.com/video/153520720" frameborder="0" allowfullscreen></iframe>
