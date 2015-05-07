---
layout: post
title:  Is it easy to teach a robot to pass a programming test?
author: Alexey Rybak
date:   2015-05-11
categories: miscellaneous
---

This article will teach you how to write a test-passing robot and will stretch your brain a bit regarding probabilistic theory, as we explore why, in the face of the tasks’ apparent complexity, an automatic brute force attack quickly arrives at a solution. Warning: half the article is maths.
 
#Introduction

<img alt="Robot" src="{{page.imgdir}}/robot.jpg" style="float: left; max-width: 50%; margin-right: 10px;" />

Several years ago I created a test for programmers. Test is in Russian for backend developers positions in our Moscow office. Unfortunately the test is down rignt now, so I don't put any link here. Anyway most folks probably won't like the test. If you code in PHP, your favourite DBMS is MySQL, and your preferred operating system is Linux, then you should give it a try. The test was unique, only a few percent of testees were able to successfully pass. The test was honed for specific skills that were not widely needed. Getting an A was hard. That's why some testees resorted to the dark side - they wrote a bot. And good for them, by the way. 

"Persistence and bravery, valour and good fortune. Don't lose your head when you're in trouble - That's what matters most!" - *The Adventures of Baron Munchausen*.

That's why the test hasn't had a captcha. Ever. I actually wanted people to write bots. I wanted the bots to come. I wanted the test to withstand them, to break them. I didn't want bot writers to cheat, but rather to learn.
 
The test consists of 80 questions, with 25 chosen at random for each testee. My rationale, which later proved to be utterly invalid, was simple. To make the test impossible to pass by memorizing or brute forcing answers, the total number of possible questions must be initially significantly larger than the number of questions in a single instance of the test. The total number of possible combinations is roughly 10<sup>20</sup>.

"That's such a big number," I thought, "Brute forcing the answers will be very difficult". Of course that number of combinations is a very crude estimate. But if an automatic brute force attack seemed doable to me, I didn't think a bot writer would make the necessary effort. I was wrong to think that way. I lost the battle with the bots. I'll explain why below.
 
#Attacks
 
Of course, I don't remember all of the attacks now. Two of them were successful. We'll talk about those.
 
The first successful attack was trivial (aside from a million HTTP requests, but that's nothing). This attack was the result of my stupid mistake. It was perpetrated by my friend Igor Sh. One day I saw his name in first place in the ranking. His score was super high and it had taken him roughly five seconds to complete the test. I called him and asked how he had done it.
 
At first, Igor had tried to solve the problem by brute force. As I mentioned above, this guy was extremely persistent. There were about a million requests in the log. But the task is more difficult than it seemed at the outset - it took too long to brute force it. Then he suddenly found a "hole". It turned out that an intentionally incorrect answer could be given; it would be accepted, counted as incorrect, and the test would move on to the next question. This made it possible to brute force the answer to a specific question by giving intentionally incorrect answers to all the other questions. The majority of the permutations are nullified and the task becomes elementary.
 
Igor's bot was the first to pass the test. I fixed the bug and had to delete Igor from the ranking. All the remaining attacks weren't distinguished by their success. Several boring years passed before Semen K. appeared.
 
This was the second and most recent serious attack. After this, I was humbled and added a captcha. What's more, it was an excellent mental workout that prompted me to write this post. But I'm getting ahead of myself.

In the middle of November 2013, two hundred and fifty thousand requests arrived from some Swiss host. By the second day, the bot conspicuously held the top places in the ranking and was continuing onward. 250,000 requests, approximately 10,000 instances of the test ― and it was in first place. I was completely bewildered. How did it do that so fast? There were 10<sup>20</sup> permutations, but the attack converged much faster! Did I have another bug? If not, then how could I be so wrong in my calculations?

The bot left its creator's address, and there was nothing left for me to do but admit defeat and write to him. Over the course of the following day, I figured out how the bot worked.
 
It wasn't exploiting any holes, rather it worked adaptively: based on results, it improved hypotheses regarding the probability of an answer, rejecting the worst, constantly adjusting solutions, and reducing the search space. The bot's author would also occasionally edit answers manually by marking new answers that were definitely correct or incorrect, significantly simplifying convergence.
 
I no longer doubted that I would have to add a captcha. But how could I so severely underestimate an adaptive brute force attack? How was such convergence possible with only 10,000 requests? Basically, it was time to grab a pen and some paper, and think.

#Calculating convergence
 
Now here's the maths. We want a rough estimate, so we will limit ourselves to loose calculations. Our task is to show that a bot will find a solution in far fewer attempts than a "brute force" calculation across the total number of unique combinations (we're aware of at least one solution that converged after 10<sup>4</sup> attempts).
 
To begin, we'll use a technique suggested by my colleague from the London office, Evgeniy Kuchera. He proposed looking at the problem like solving a system of random linear equations. Each instance of the test gives an equation in the form of "the sum of these answers to these questions is equal to such-and-such a result". Each instance of the test gives an additional equation. For simplicity, we'll assume that each question has five possible answers. All of the equations are linear and the system can have a solution if the number of independent equations is equal to the number of unknowns. The number of unknowns is, roughly speaking, the number of questions multiplied by the number of possible answers: N = 80 * 5 = 400. But the equations' required dependence is a subtlety that you may be familiar with from a course in linear algebra. You can't just get the first N equations and assume that the system has a solution: one equation might be a linear combination of other equations and not provide any additional information. But we'll be tricky and simply show on our fingers that over roughly N tests you won't get a system of independent equations. You have to really try here.
 
In fact, once the number of test-instances M exceeds N (= 400), the number of possible combinations of equations grows as the number of combinations "N choose M", i.e. unbelievably fast. With M = 2\*N, this number is already (2\*400)!/(400!)<sup>2</sup>. And that's a very large number. Without special gimmicks, it can't even be computed using normal 64-bit double-precision float type, due to overflow. It is more than 10<sup>+308</sup>. Moreover, the degree to which questions are randomized is also very high: the probability of encountering any pair of questions on the same test is small, roughly (25/80)<sup>2</sup> = 0.0977, but given M = 2N test-instances the probability of not encountering this pair on a single test is (1 - 0.0977)<sup>2\*400</sup> = 10<sup>-36</sup>! Thus, among M>2N test-instances it is highly likely that we will get N equations such that 1) all of the variables are present and 2) the system is independent. Stronger evidence can be found by analysing the determinant of a random square matrix of zeros and ones, but that sort of mathematical exercise is beyond the scope of this article. I'm also just not confident that I'm in a condition to properly complete that intellectual journey.
 
In the end, it seems that you can get a system of independent equations from a number of test instances comparable to the number of variables. Even if we've made an error somewhere, even by an order of magnitude, this calculation gives an incredible result: we didn't get an outrageously large number of combinations, but we got almost instantaneous linear convergence relative to the number of questions.
 
Of course, the reasoning above is rather primitive. Let's consider another approach that is far more rigorous, visual and very beautiful. This approach undoubtedly has some name and is used widely somewhere, but in my ignorance I don't know it.
 
The essence of the approach is this: the bot responds entirely randomly, but only counts tests that yielded a certain number of points. In order for the method to work, the specified number of points must be greater than the most likely number of points (actually, it can be less as long as it is noticeably different). A weight is assigned to each selected answer. This serves as a ranking for the hypotheses regarding the correctness of possible answers. In time, the correct answers receive a high ranking, while the incorrect answers are ranked low. Correct answers can then be easily distinguished from incorrect answers. It sounds strange and is indeed hard to believe at first. We'll show in detail how this works.
 
Let's look at the probability of getting a certain number of points, *s*, in a test consisting of *n* questions - *p (s, n)*. For simplicity, we will assume that each question has an identical number of answers, *m*, and that all answers are random. In this case, the probability of guessing an answer (getting a one) is *P(1) = 1/m*, while the probability of an incorrect answer (getting an zero) is *P(0) = (m-1)/m*. The unknown probability of getting *s* points is something like the number of combinations "s choose n", and with some multipliers like *P(1)* raised to the power of *s* and *P(0)* raised to the power *n-s* (we multiply the probability of getting a one *s* times and a zero *n-s* times by the total number of combinations). Without yet tiring you with formulas, we present a probability distribution for n = 24 (below we explain why 24 rather than 25):

<img alt="probability distribution for n = 24" src="{{page.imgdir}}/p1.png" />

Now we'll closely scrutinize the following expression:
 
<div style="text-align: center;">
<i>p (s, n) = p (s-1, n-1) * P(1) + p (s, n-1) * P(0)</i>
<span style="float: right;">(1)</span>
</div>

The expression's physical meaning is this: the probability of getting s points in a test with n questions is equal to the sum of the probabilities of two events:

- in the previous *(n-1)th* step, we got *s-1* points and then got a one
- in the previous *(n-1)th* step, we got *s* points and then got a zero
 
And now for the most interesting part. Remember that our bot works as follows:

- the bot considers only tests that yield *s* points
- the bot adds +1 to the ranking of each answer in these tests
 
Thus, each time we'll increase the ranking of both correct and incorrect answers; and the bot's behaviour seems illogical at first glance. But let's look again at (1) and ask ourselves what the probability is that we'll increase the ranking of an answer that really is correct? Let's assume that the probability of getting a one is higher than the probability of getting each of the zeros separately (for now we'll simply make the assumption; we'll prove it below). Then, in time, from one test to another, the ranking of an answer that is really correct will grow faster than that of an incorrect answer. Given a sufficient number of tests, the correct answer will accumulate a considerable ranking relative to the other possible answers, and it will be easy to distinguish from the incorrect answers.
 
So, for the method to work we need s such that the probability of getting a one is "noticeably" greater than the probability of getting one of the zeros:
 
<div style="text-align: center;">
<i>p (s-1, n-1) > p (s, n-1)</i>
<span style="float: right;">(2)</span>
</div>

Let's take another look at the distribution (now it should be clear why it's a distribution for *n - 1 = 24* rather than *n = 25*). Obviously, the unknown *s* are located to the right of the distribution's maximum *s = 5*. Interestingly, the reverse condition is satisfied to the left of the maximum: the probability of getting a one is noticeably less, so when calculating the ranking for tests with such a number of points the correct answer's ranking will be noticeably less and the correct answer will be easy to distinguish from the incorrect answers.
 
Thus, the bot may record the sum of points to the left of the distribution's maximum, i.e. for *s = 6*. If we come across each possible answer at least a few dozen times, then the correct answer's ranking will differ noticeably from that of the incorrect answers. Of course, this is again not a rigorous calculation, but I don't want to bore you with statistical error calculations. We'll assume that after several dozen tests, the error is negligible. Now let's estimate the number of tests required to identify correct answers with sufficient accuracy.

To do this, we’ll nonetheless have to write a formula for the probability of an answer for exactly *s* points in a series of *n* questions, where each question has *m* possible answers. The number of test combinations giving *s* points is the product of "s choose n" (*C(n, s)*) combinations of questions for which we will guess an answer and the number of incorrect options in the remaining positions *(m-1)<sup>&nbsp;n - s</sup>*, given that *m-1* incorrect answers and *n-s* positions remain for each question. The total number of combinations is *m<sup>&nbsp;n</sup>*. The ratio of the number of suitable combinations to the total number is the unknown probability:
 
<div style="text-align: center;">
<i>p (s, n, m) = n!/(s!(n-s)!) * (m-1)<sup>&nbsp;n-s</sup>/m<sup>&nbsp;n</sup></i>
<span style="float: right;">(3)</span>
</div>
 
The attentive reader can verify this formula another way: the probability of encountering *s* ones, *P(1)<sup>&nbsp;s</sup> = m<sup>&nbsp;-s</sup>*, and *n-s* zeros, P(0)<sup>&nbsp;n — s</sup> = ((m-1)/m)<sup>&nbsp;n — s</sup>, multiplied by the total number of combinations "n choose s".
 
Let's return to calculating the convergence. Suppose that we settle on *s = 6* for the number of points. According to formula (3), the probability of getting 6 points on a test consisting of 25 five-choice questions is 0.163. Accordingly, getting one "suitable" test would require running the test approximately 1/0.163 = 6 times. Each possible answer must be encountered several dozen times, let's say 30. Then each question must be encountered 5\*30 = 150 times. The probability of encountering a specific question in a test is 25/80 = 1/3.2, which means that 6\*150\* 3.2 =~ 3000 tests are required to search all of the answers!
 
To completely convince you that this isn't some sleight of hand and that a solution really can be found rapidly, we'll present the results of a numerical experiment. Below we show the growth of the ranking of one of the questions during a brute force attack. As you can see, with only 5000 iterations the correct answer's ranking significantly outstrips the rankings of incorrect answers. After 10<sup>&nbsp;4</sup> iterations the difference is abundantly noticeable.

<img alt="rankings of correct and incorrect answers" src="{{page.imgdir}}/p2.png" />
 
#Conclusions
 
I'm convinced that writing the bot isn't difficult. All of the approaches we've considered have excellent convergence. Let's return to the light side of the Force and ask ourselves how we can make life more difficult for bot creators?
 
Part of the answer is readily apparent. First of all, a captcha should be added, of course, or we should protect the test by sending a text message, e.g. make taking the test reasonably expensive and making automation of the process an uneconomical endeavour.
 
Secondly, the total set of answers needs to be expanded. It's true that we converge on a solution linearly. And for a bot the computational complexity required for 100 questions or 1000 questions won't differ greatly, and creating 1000 questions is a lot of work. Nevertheless, the set of questions should be as big as possible. My test set is constantly growing, and you can help for a fee (I'll clarify all the details in a personal message).
 
Only one measure seems to be meaningful: give the testee the "vaguest" possible feedback, since feedback is what bots exploit. For example, don't report the exact number of points earned. This will impede convergence of an adaptive solution and make it impossible to conduct brute force attack by solving a system of linear equations.
 
There's one complication: an imprecise result contradicts common sense. Suppose we split the results into levels, for example, ranging from "Novice" to "Expert". We can't have two or three of these levels; we need at least five. Otherwise, why would users take a test that produces utterly imprecise results? But even with answers given as levels an adaptive bot can still converge. This is due to the fact that an adaptive algorithm works well not only on some exact number of points but also on an interval like s > const, where const is the most likely number of points (the distribution's maximum). The probability decreases monotonically over the entire interval and, as was proven above, this is a sufficient condition for an adaptive algorithm to converge. There remains only one thing to do: select the division of levels such that there are enough of them, on the one hand, for the test to appear sane and, on the other hand, for an entirely automated adaptive transition from one level to another to be virtually impossible.
 
Recall the distribution for the example with 25 five-choice questions: the probability of a correct random answer to 12 or more questions is insignificant. What if we make the first level start at 12 points or even higher? Then all the most likely tests will produce only one answer: "failed". And a bot with a "cold engine" won't run. If we make the next level boundary sufficiently far away, then worming from one level to the next is only possible by further division of the possible answers into "probably correct" and "probably incorrect", e.g. the bot creator must help their bot and learn something in the process. But that's not bad per se.
 
Those are all my conclusions. If you have other ideas on how to protect tests from bots, I'd love to see them in the comments.
 
<b>Alexey Rybak</b>, Badoo
