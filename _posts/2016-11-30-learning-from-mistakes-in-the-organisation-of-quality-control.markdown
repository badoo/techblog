---
layout: post
title:  Learning from mistakes in the organisation of quality control
author: Ilya Kudinov
date:   2016-11-30
categories: QA
excerpt: Three years ago, I started attending various IT conferences and giving talks about the processes and techniques we use for quality control. And naturally, after each talk, I spoke with people in the audience and took an interest in how they were doing things.
---
<img class="no-box-shadow" src="{{page.imgdir}}/1.png" style="float:left; width: 60%; margin-right: 10px;"/>

**Hello all**! My name is Ilya Kudinov and I work as a QA engineer at Badoo. Three years ago, I started attending various IT conferences and giving talks about the processes and techniques we use for quality control. And naturally, after each talk, I spoke with people in the audience and took an interest in how they were doing things.

On these occasions, I have always been motivated by feedback along the lines of, *“We used to do things that way, but having listened to your talk we realised that we can do better”* or even better when people don’t copy our way of doing things, but come up with something themselves – sometimes they would come up with things that are even more interesting than what we were doing.

I have saved up a lot of these stories and I would like to share some of them with you now (*all names are invented and any resemblance to actual persons is purely coincidental*). Perhaps something of what I have to say might help you to realise the direction in which your own project is developing – and that would be the greatest reward for me! It goes without saying that I would be interested in hearing your stories – in the comments section.

## Let’s start by making two disclaimers

**Firstly**, the advice in this article is not going to be relevant for every kind and scale of software development and for some, I’m sure the advice may even be very bad. Thus, for those doing software development for Aircraft (and also for testing gurus for whom my advice will appear self-evident), what I’m going to say is going to be nothing more than interesting reading.
Above all, I’m going to focus on fast-developing products with a hectic release timetable. This article will be most interesting to those representing companies where the QA department is in its embryonic stage or companies thinking of implementing one.

The **second** disclaimer is this: The ‘sad’ stories in this article are not invented and they may not be as awful in practice as I have described them, however I will always try to justify my point of view as best I can.

For the purposes of visualising thoughts and ideas I have three little helpers whom I would like you to meet. Here they are:

<img class="no-box-shadow" src="{{page.imgdir}}/2.png"/>

Ok, let’s start by defining who we are.

## QA engineers? Testers?

Russians use the word ‘tester’ to refer to the device used for measuring the electrical parameters of a loop circuit. Don’t call us that – we’ll be offended.

In English, the word ‘tester’ refers to a specialist involved in testing. Testing is an important and essential process in developing anything, but it’s limited to the process of subjecting a given system to various situations, with the aim of studying its behaviour and verifying the completion of given testing tasks.
A QA engineer is a specialist who carries out quality control. This concept includes testing as well, for example, subsequent monitoring, the development and support of various autotests and other forms of process automation and optimisation, as well as release engineering.

<img class="no-box-shadow" src="{{page.imgdir}}/3.png" style="float:left; width: 30%; margin-right: 10px;"/>

It’s ok to call us testers, as long as you do so respectfully.

In actual fact, the role of testers in the final analysis of a project is no less important than the role of the developer.
Bjarne Stroustrup in his book *The C++ programming language* wrote, “*A program that has not been tested does not work*”.

The developer and the tester should join forces, striving towards a common goal to release the product within the deadline and with the maximum level of quality. That’s why quality control departments are created. But how do you organise one?

## QA department

###Case 1

<img class="no-box-shadow" src="{{page.imgdir}}/4.png" style="float:right; width: 40%; margin-left: 10px;"/>

Ok, so a company named **PROFILEJOURNAL** decides to develop software. They’re serious about it and have even gone as far as creating a QA department. How many people do they need to recruit for the QA department given they already have 12 developers?

They say the approximate ratio of workers should be **1 QA engineer to 3-4 developers**. No sooner said than done, let’s recruit three QA engineers and give ourselves a pat on the back.

As the project starts to develop, more and more demands are made of the QA department. We’ve already matured enough to not just perform releases by uploading gzip archives for production, and we go through a well-structured, fully operational deployment process.
Who’s going to do that? Let’s give the job to our QA department!

As more and more functions need to be carried out, it becomes harder and harder to test for regression. One of our testers has experience of developing? Great! He can develop autotests. Good thinking, right?

What’s the end result of this excellent plan? Only one of the QA engineers is permanently engaged in testing the tasks of our twelve developers.
Why is it that the queue for testing is getting longer and our well-planned releases are being delayed on a regular basis?

**Lesson**: when calculating the number of specialists for the QA department, you need to take account of all the areas of activity where they will be working, besides the testing proper. If necessary, you need to hire new staff and not simply share out new tasks among existing staff. Isn’t that just common sense? In practice, not everyone sees it that way.

----------

### Case 2

<img class="no-box-shadow" src="{{page.imgdir}}/5.png" style="float:right; width: 35%; margin-left: 10px;"/>

Another small company named **CHIRPER**. They also have major, ambitious plans. They start with a small team: four developers, a couple of managers and one (very proud) tester.
Time passes, the business grows and the number of orders for development keeps on increasing. Those heading up the project are happy and pleased with the results and announce that they are going to expand the staff base.
To start, we’re going to hire another product manager – they can generate more explosive ideas. More and more requests for new features? Urgently recruit new developers!

<img class="no-box-shadow" src="{{page.imgdir}}/6.png" style="float:left; width: 35%; margin-right: 10px;"/>

Woah, more users? Bigger profits? People, we are on the right path. Let’s hire more developers: the more features, the better! Great! Hang on a minute. Why is the number of bugs increasing? Why are customers dissatisfied? We have hired more staff; why are we behind schedule? Ah, our poor tester – we forgot about him!

<br>

**Lesson**: you need to develop the QA department in parallel with the development department. Maybe even keep a step ahead. It’s difficult to engage with competitors and deliver innovative functionality to users if you cannot ensure that the project has the necessary level of quality.

----------

### Case 3

A company named **TYNDEX** has been established for a while and all its processes have been optimised down to a tee. It has a good-sized development department and a testing department which matches it perfectly. Developers and QA engineers work in different premises, separated by a large hallway, peering at one another with unfriendly looks through half-open doors.

<img class="no-box-shadow" src="{{page.imgdir}}/7.png" style="float:right; width: 50%; margin-left: 10px;"/>

Having finished work on a given task, the developer fires off a task for testing with all the ill will the ‘assign’ button in Jira can muster. The tester eyes the task with distrust, opens it with a sense of disgust and within a few seconds angrily returns the task for reworking bearing the note “*Typo in comment section*”.
You would think that with that level of zeal the level of quality should be of a high standard. Maybe it is, but we’ll never find out because with an approach like that, the task will only make it to the production stage… never.

<br>

<img class="no-box-shadow" src="{{page.imgdir}}/8.png" style="float:left; width: 45%; margin-right: 10px;"/>

**Lesson**: testing and development departments are not enemies. They shouldn’t be sitting either side of a barricade, looking for the first opportunity to foist work onto one another. As I have already said, their common goal is to release the task within the deadline and their duty is to join forces in reaching that goal.
This doesn’t mean that you need to ignore any mistakes that have been made. If you discover a minor defect you don’t have to immediately send the task back for reworking. It’s possible to make a note of the mistake, test the task as far as possible and return it with a full list of errors – with a view to saving a lot of time by avoiding multiple, repeated development and testing stages.

It should be noted here that in some cases this point-by-point approach is actually appropriate. In the case of ‘industry’ development (for example, in the case of software support for use in aircraft) quality and compliance of processes is more important than speed – and that’s right.
I don’t think I would like to fly on a plane which had been tested and developed by staff working in ‘ultra-contemporary and fast-developing’ start-up companies.

## QA Process

<img class="no-box-shadow" src="{{page.imgdir}}/9.png" style="float:right; width: 50%; margin-left: 10px;"/>

Now that the QA department has been organised what’s it going to do? Quality control. But how is that process structured?

QA processes are always based on a balance between quality and speed. Absolute quality is unachievable (if you disagree with me, I hope you are working on QA for aircraft projects) and likewise it’s impossible to test tasks instantly. Where can you find the balance? This is where each team must come up with its own solution.
For some, **Continuous Integration** is the answer, while for others, tightly regulated and planned releases are best– and it’s not an option to look over your neighbour’s shoulder and simply copy the processes they have set up.

How do QA processes fit into the overall project development process?
Let’s divide things up into three stages: product design, development and testing.

<img class="no-box-shadow" src="{{page.imgdir}}/10.png"/>

Two new start-up companies approached the same question in two completely different ways: The first one named ‘**BODUNY**’ closely tied QA engineers into each stage, while the second one ‘**POCHTI.RU**’ only assigned them to the testing stage.

Which one is right? The truth is probably to be found somewhere in the middle.

What do we get from each stage in the QA process? Quality. What do we lose? Speed.
What stages in the quality control process are expendable?

### Testing? No.

**Quality control at the development stage?**

It sounds important. No, of course the tester doesn’t have to be looking over the developer’s shoulder, pinching them every time they leave out a comma. There are lots of other ways to help developers observe a certain level of quality.
A well-structured system for version control, various hooks and scripts to check that the code is correct, writing unit tests (although in this respect QA can only act as an overseer threatening punishments and offering rewards), a convenient code review system – all this comes under the responsibility of the quality control department.

**What about control of product design?**

In ‘industry’ development there’s a whole branch of quality control called “design brief testing and analysis”. This helps avoid logical and architectural errors at the early stages of development of each project – and catastrophically delays the possibility of starting work on development.

<img class="no-box-shadow" src="{{page.imgdir}}/11.png"/>

These are probably unnecessary precautions in the case of a new start-up company. A high level of integration among various departments allows all those involved in a project (developers and testers) to see the details of the project, to identify the rough spots and to communicate useful ideas (or not so useful ideas) to management.
In addition, in our world of dynamic projects and agile methodologies, the design brief often changes at the development stage (and even after release), so it makes sense for QA to give product managers free rein to express themselves and only then to submit their own suggestions and corrections.

**Lesson**: quality control at every stage of development of a project has a positive impact on quality and a catastrophic impact in terms of lowering speed. Processes must be structured so as to comply with the demands of your project and not to mindlessly copy what other people are doing or what people write in books.

----------

## Case 4

<img class="no-box-shadow" src="{{page.imgdir}}/12.png" style="float:left; width: 50%; margin-right: 10px;"/>

Look, a developer at a company called **BOOBLE** has submitted his task for testing and is absolutely confident that he will only see it again if it gets returned for reworking. But is it only QA engineers who are involved at the testing stage?
That’s not necessarily the case. Of course, a task can be returned straight away on discovery of the slightest lack of clarity, but it’s entirely possible that this may just be a simple case of misunderstanding and, as a result, the task in question gets stuck in limbo with some sort of intermediary status.

For this reason (and not only for this reason), contact and interaction during the course of the testing process are priceless. If something strange crops up or something doesn’t make sense, you can always sit down with the developers and try to get to the bottom of things. On the one hand, if the behaviour in question is not an error, you can work out the procedure to follow and avoid all hold-ups in transitioning between statuses.
And if it unexpectedly does prove to be an error, by studying it in this way the problem may be resolved straight away without the task being reopened days later and everyone trying to work out what happened.

**Lesson**: it’s not worth sending back a task the first time you notice something which doesn’t make sense. Debugging in conjunction with the developer is not only a useful and effective process, it’s often also instructive (both members of staff can get a better grasp of what’s going on) and fun.

----------

### Case 5

<img class="no-box-shadow" src="{{page.imgdir}}/13.png" style="float:left; width: 35%; margin-right: 10px;"/>

A company called **ONTHECONTACT** has a brilliantly structured development process. Developers have a full range of tools at their disposal for optimising development processes and simplifying the assignment of work. They use project management systems and version control systems. <img class="no-box-shadow" src="{{page.imgdir}}/14.png" style="float:right; width: 35%; margin-left: 10px;"/> No one gets in anyone’s way and all their work is always safe and secure.

But things at the quality control department have not been so rosy for a long time. The way things have been done is that releases for testing have been sent as archive files by email.
Someone at some point thought of doing it that way and everyone got used to it. They write their documentation out on countless pieces of paper scattered across the department (some particularly resourceful engineers set up a shared Google Doc, but they are scared that someone is going to find out and will force them to write it out on paper).
What a shame no one is able to take the initiative and try to connect up the various technical tools being used.

<img class="no-box-shadow" src="{{page.imgdir}}/15.png" style="float:left; width: 45%; margin-right: 10px;"/>

After all, you could use shared repositories, shared knowledge bases, integrated bug tracking systems and application building with one another and make everything beautiful, automated and joined-up… But no, sorry, that would mean developers would have to change the way they do things and even develop and set up something new. It’s sort of handier to do it in written form…

**Lesson**: an effort needs to be made to integrate the processes and tools used by the respective development and testing departments. This would help both departments and the project overall. Sometimes this requires small sacrifices to be made by those involved, but in the long run the success this facilitates couldn’t be greater.

----------

### Case 6

<img class="no-box-shadow" src="{{page.imgdir}}/16.png" style="float:right; width: 35%; margin-left: 10px;"/>

Testers at the company **MACROHARD** always work according to strict test case scenarios. Any freedom of action is prohibited – and heaven forbid if someone allows themselves to miss out a point in the test plan! A missing tick in the test plan is equivalent to a crime and is punishable by the Riot Act being read out to the whole department.
Individual engineers spent entire days just keeping up the documentation and every tester was obliged to put together case studies for every functionality they ever came into contact with.

Of course, the standard of quality was high. Initially… Then bugs started to appear at the production stage. Bugs at the production stage! When verifying the check lists as to whether the functionality in question had been tested, the responsible tester was vigorously nodding his head with an innocent expression on his face: “*I tested it, I tested it.*”
It turned out that some components of the product hadn’t been tested for years, simply because there hadn’t been space for them in the test documents. The head of department had to write a report and an explanatory statement about what had happened – which ran to four volumes plus a table of contents.

<img class="no-box-shadow" src="{{page.imgdir}}/17.png" style="float:left; width: 50%; margin-right: 10px;"/>

It would have been better for the testers to be able to think for themselves about the implications of their own work and not to follow strict instructions. They could have had a shared source of information – not in the form of a How-to guide, but along the lines of ‘this is how it all works.’
Of course, this could have a detrimental effect on the speed of testing, because each time it would be necessary to examine the feature or (heaven forbid!) to speak to other testers and developers to understand what needs to be tested.

**Lesson**: general documentation which allows you to determine what needs to be tested with regard to a given task – good. Detailed instructions and case studies… probably not so good. (Developers working on aircraft – please ignore what you have just read. PLEASE!)

----------

### Case 7

<img class="no-box-shadow" src="{{page.imgdir}}/18.png" style="float:right; width: 50%; margin-left: 10px;"/>

Division of labour is highly valued at the **PRINTEL** company. Each tester is tied to one or other functionality and component – and they know full well what it makes sense to test and how to test it.

Quality and speed are of a high standard – the company is on the path to success. And then one of the QA engineers wins the lottery and moves to the Canary Islands. Those who are left behind just look at one another and then they try to make sense of what he has left behind. No one can work anything out and so they carry out testing as best they can until a new engineer can be found to replace the lucky lottery winner. Everyone heaves a sigh of relief… until it turns out that the lottery winner must have been dreaming of becoming a doctor because the notes he took are in handwriting that is slightly incomprehensible. Development of the component comes to an almost complete standstill until the newbie can master the component from scratch.

<img class="no-box-shadow" src="{{page.imgdir}}/19.png" style="float:left; width: 50%; margin-right: 10px;"/>

**Lesson**: it makes sense to share knowledge within the QA department. Staff can periodically swap tasks so that they don’t become tied to a single component (one of the negative side-effects of this sort of specialisation is becoming impervious to errors), seminars and lectures can be held where specialists can talk about what’s new in their field, about interesting cases and techniques.
This can lead to staff becoming interchangeable and it enhances the professional development of all concerned.

----------

### Case 7

<img class="no-box-shadow" src="{{page.imgdir}}/20.png" style="float:right; width: 60%; margin-left: 10px;"/>

A QA engineer at **BLUEDIT** has finally finished work on his complicated system task, having spent several working days on it. He has made sure it has been delivered to production, and so he heaves a sigh of relief and heads off for some beers with this friends. Has he done the right thing? I don’t think so.

Even if the company has a serious monitoring department which keeps a keen eye trained on tens and hundreds of charts and scales both day and night, it would take quite a while to locate an unexpected mistake or a drop in activity. It would be good if someone could help them find the cause of the fault – or prevent it from happening in the first place…

<img class="no-box-shadow" src="{{page.imgdir}}/21.png" style="float:left; width: 60%; margin-right: 10px;"/>

The thing is that the engineer in question could have one pint less of Guinness, while saving no small number of person-hours (and the company money), if they spent some time studying the behaviour of production after release.
They could study error logs, check for trends in the charts describing the state of the components affected by the task. Yes, sometimes bugs make it through to production. This may be due to human error, differences in environment or even one of the millions of user stories which are generated by genuine users.

**Lesson**: the QA process doesn’t come to an end immediately at the point in time when the task is released for production. It’s always worthwhile to follow the behaviour of a new functionality and it’s extremely important to have tools available which allow you to do so.

----------

### Case 8

<img class="no-box-shadow" src="{{page.imgdir}}/22.png" style="float:right; width: 40%; margin-left: 10px;"/>

For the first time in his life a tester from **BANANA** has let an annoying bug slip through to production. He might have discovered it, had he spent a couple more hours on it – but it has already happened. The bug has been fixed, but it has affected users.
The company is very unhappy with the tester. The developer of the feature is unhappy with the tester. The tester is subject to a disciplinary hearing and loses his bonus to ensure that it doesn’t happen again, and in future he won’t go easy on himself when it comes to testing.

Is the company right to act in this way? I don’t think so.

QA processes don’t eliminate the possibility of defects occurring; they aim to reduce the probability of them occurring. Everyone involved in the project takes part in these processes. Therefore, responsibility for defects lies equally with everyone: the boss who failed to motivate and teach his staff, the developer who allowed the mistake to happen, the tester who let it slip through and even the engineers whose autotests covered the functionality in question – their tests could have caught the bug, but didn’t!

Should they be punished? Possibly, but only in cases where there are systemic faults. It would be much more useful to carry out an in-depth study of the causes of what happened, to organise training seminars and all sorts of events to reduce the probability of similar defects occurring again in the future.

**Lesson**: everyone involved in the project is to blame when defects occur; it’s pointless to blame the tester alone for what happened.

## Automation

### Case 9

<img class="no-box-shadow" src="{{page.imgdir}}/23.png" style="float:right; width: 45%; margin-left: 10px;"/>

At a company called **SZONNI** a decision was made to start work on the development of automated tests. One of the testers had programming skills and he was given this task. He wrote tests, was happy with his own work and at a given point in time he had the whole product covered with tests. Everyone was happy until they noticed that when the tester moved on to another project, no one looked for a replacement.

<img class="no-box-shadow" src="{{page.imgdir}}/24.png" style="float:left; width: 45%; margin-right: 10px;"/>

This one-off incident became a trend and the QA department started to disintegrate. When fearful engineers began to appeal to management, the latter answered with a smile, “*We now have excellent autotests, what do we need boring, out-of-date manual testers for?*”. They wouldn’t listen to any explanations and nothing was changed.
Things went well until more and more errors started to emerge at the production stage – and all of them related to the newest functionality which wasn’t covered by the autotests.
Management acknowledged their mistake, but it was too late…

**Lesson**: autotests are an auxiliary quality control tool that can never replace manual testing.

----------

### Case 10

<img class="no-box-shadow" src="{{page.imgdir}}/25.png" style="float:right; width: 45%; margin-left: 10px;"/>

At **SHANTSUNG** they didn’t have that problem. Their automated testing department was completely separate from their manual testing department. The ‘automators’ even considered themselves a higher caste and looked down with condescension on those they called ‘manuals’. And this division seemed to suit everyone until the problems started.

The ‘automators’ were so engrossed in supporting their hundreds of tests that they lost any capacity to develop anything new (and, of course, comply with the key performance indicators [KPI] that had been set), and the ‘manuals’ had no idea what was going on with their colleagues and stopped relying on tests,  manually testing everything themselves, even though it was already fully covered by the tests (but no one knew this!) and this significantly reduced the efficiency of the whole enterprise.

<img class="no-box-shadow" src="{{page.imgdir}}/26.png" style="float:left; width: 30%; margin-right: 10px;"/>

**Lesson**: it is preferable for everyone in the QA department to be working with autotests. Even if some people are not able to write a test from scratch, it’s still worth making sure that every engineer is able to assess the state of tests at a given moment in time, to understand the cause of their failure, to correct a simple error or to apply a test to a new, non-complex case.

<br>

## Instead of an afterword

I hope that something of what I have written at length will prove useful to you. It might help someone to identify rough spots in processes, while others may derive advice for finding a way out of a problem they have already studied.

Even if this is not the case, at least what I have talked about may have made you laugh. Or even just my naiveté. The main thing is just to make the world a slightly better place in some way. Right?  

**Ilya Kudinov - Senior QA Engineer**
