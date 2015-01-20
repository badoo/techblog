---
layout: post
title:  AIDA - Badoo's journey into Continuous Integration
author: Vladislav Chernov
date:   2013-10-16
categories: git qa miscellaneous
---

<img alt="AIDA" src="{{page.imgdir}}/aida.png" style="float: right; max-width: 50%; margin-left: 10px;" />
It's hardly news to anyone that product development and testing involves a lot of boring routine work, which can lead to human error. To avoid complications stemming from this, we use AIDA.

**AIDA** (Automated Interactive Deploy Assistant) is a utility that automatically performs many of the processes in Git, TeamCity and JIRA.

In this post, we focus on how through using AIDA we were able to automate multiple workflows and create a scheme of continuous integration.

We'll start by looking at the version control system (VCS) we use here at Badoo, specifically how Git is used to automate creation of release branches, and their subsequent merging. Then we'll discuss AIDA's major contribution to both JIRA integration and TeamCity.

### Git flow

The Badoo Team uses Git as a version control system. Our model ensures each task is developed and tested in a separate branch. The branch name consists of the ticket number in JIRA and a description of the problem.


{% highlight html %}
BFG-9000_All_developers_should_be_given_a_years_holiday_(paid)
{% endhighlight %}

A release is built and tested in its own branch, which is then merged with the branches for completed issues. We deploy code to production servers twice a day, so two release branches are created daily.

Names of release branches are simple:

{% highlight html %}
build_{name of the component}_{release date}_{time}
{% endhighlight %}

This structure means the team immediately knows the date and time of release from the branch name. The hooks that prevent changes being made to a release branch use the same time-stamp. For example, developers are prevented from adding a task to a branch release two hours before deploy to production servers. Without such restrictions the QA team wouldn't have time to check all the tasks on the release branch.

Our master branch is a copy of production. As soon as a code from ‘Build' is deployed to servers, it is merged to the master branch. Devs also deploy hot fixes to production servers from this branch.

The scheme we use is shown below:

![]({{page.imgdir}}/image1.png)

### Six stages of testing

* **Code Review:** Every task undergoes code review. Each department's reviewer is chosen according to varying criteria; i.e. it may be the person with the most experience or the development team leader.
* **Unit Tests:** Unit tests are run in each branch. They occur automatically when the reviewer changes status to ‘resolved'. After performing tests (22,000 tests in 3-4 minutes) AIDA provides a report in JIRA, in table form.

![]({{page.imgdir}}/image2.png)

* **Devel:** The first stage of manual testing. Each task is checked in development environment and databases for testing.
* **Shot:** The task is checked on the battlefield. Shot is a folder on the server that is а cloned branch repository and configured Nginx, and has its own top-level domain: **-.shot**. At this stage, translations to major languages are generated, and the issue is tested in the production environment (databases, scripts, services).
* **Staging:** The release is tested in the production environment, translated into all languages, and fully monitored. All tasks included in the build are re-tested.
* **Production:** If the task is very important, it is checked again in the production environment.

If a task in the release contains an error we remove its branch from the release branch with Git rebase. We use a special script that performs this operation in semi-automatic mode.&nbsp;

_Note:_

_We don't use Git revert in release branches. If we removed a task from the release branch with Git revert, after the release was merged into the master, the developer of the problematic task would have to revert the commit in order to get his or her changes back._

### AIDA and Git

Due to the sheer number of branches in the described model, a lot of issues arise concerning merge, release and code-control. These can be solved automatically:

* **Automatic creation of a new release** - first of all, AIDA creates a 'release' branch. AIDA tracks changes in the master branch, and once the previous release branch is merged into the master, a new release branch is created.

![]({{page.imgdir}}/image3.png)

* **Automatic generation of a new release** - Every minute, JIRA tasks that have been resolved and tested are merged into a release branch (with the exception of tasks specifically marked in the JIRA flow). In case of a conflict, the developer and release engineer are notified, and the task is forwarded to the developer.

![]({{page.imgdir}}/image4.png)

* **Release automatically kept up to date with master** - Since the master branch is a copy of the production code, and developers add hot fixes to it via the special tool Deploy Dashboard, the master branch needs to continuously be merged with the branch release. AIDA completes this merge when new changes are executed in the master branch. A message appears if a conflict arises.

![]({{page.imgdir}}/image5.png)

* If the developer adds a change to the task branch after a merge with a release branch, this will be caught and AIDA will report it.

![]({{page.imgdir}}/image6.png)

### Deploy Dashboard

For hot fixes to production servers, we use patches. Applying a patch to the master branch and release branch takes place in semi-automatic mode. For this we use our tool Deploy Dashboard.

Deploy Dashboard is a special web interface for data collection, monitoring and recording, as well as formalisation of patches with a full list of information, and automatic notification.

![]({{page.imgdir}}/image7.png)

If we need to fix something in production, the developer creates and attaches the patch. Then the release engineer checks and applies it to the master branch in the central repository. Following this the patch will deploy to our production servers.

### AIDA and JIRA

To monitor development, testing and formation of a release we use JIRA. Workflow is planned in detail and fully formalised. Some work in the bug-tracking system is performed by AIDA. Basically, AIDA functions to move tasks or display particular information about them.

Here are a few examples:

*   The dev makes a change to code in a central repository. Status of the ticket is automatically changed from ‘Open' to ‘In Progress'.
*   If the ticket tester creates a Shot (code deploy into a single production environment), the task status is automatically changed to ‘In Shot'.
*   The ticket is reopened automatically when the task is rolled back from the release branch.
*   If changes to the task branch happen after the task has been resolved, the issue is returned to review mode.
*   When a task branch is pushed to the central repository for the first time, the branch name is registered in the corresponding JIRA ticket.
*   After running unit tests for the branch, a table is displayed containing the results.
*   AIDA monitors status in JIRA and sends the issue back to the developer when there are problems with merging.

AIDA tells us about all actions that have been performed with tasks.

This automation greatly simplifies workflow and eliminates routine activities.

### Continuous integration

Earlier, we wanted to get rid of routine activities related to the assembly and automatic deployment to a test environment, but were stuck with manually assigning new names to the branches of each release in the project's CI-server. Now TeamCity catches changes in all branches on a given mask (in this case mask _build\_\*_) and starts the build.

Consider the process of automatic assembly and deploy in the test environment:

1. The project is set up in TeamCity for a branch with a mask _build\_\*_.

2. If there's a new change in the release branch, TeamCity starts automatic build.

3. If successful, the script will start deploying to the test servers.

4. With the rapid smoke-test (using a simple curl) AIDA checks the release in the test environment.

5. If the tests don't pass, the release version is marked as bad and is rolled back to the previous (good) version of the release.

![]({{page.imgdir}}/image8.png)

The entire process takes three minutes. Tests reveal only fatal errors.

In this case, all unit, auto and functional tests are run in parallel.

This is done in order for the tester to be able to see the task in the test environment ASAP.

### In Summary

To review what processes are automated using AIDA:

1. AIDA works with Git, creating branches, merging them and warning us when something goes wrong.

2. It starts automated tests and provides a convenient report in JIRA.

3. AIDA deletes the task from release in semi-automatic mode.

4. It interacts with JIRA, automatically changing status and updating the information in tasks.

5. AIDA uses a system of patches in semi-automatic mode for hot fixes in a special web interface.

6. It works with TeamCity, running scripts, tests and deploys to the test environment.

If you are interested in reading a more detailed report on each type of automation, please comment and we'll be happy to continue our series of articles on this subject.

P.S. Create good assistants, which won't let you down when you're in a pinch!
