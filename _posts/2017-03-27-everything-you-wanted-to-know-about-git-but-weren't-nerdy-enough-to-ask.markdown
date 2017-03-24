---
layout: post
title: Everything you wanted to know about Git but weren't nerdy enough to ask
author: Tim Baverstock
date:   2017-03-27
categories: Git
excerpt: If you are unfamiliar with Git, some background may help introduce the relevant terminology before reading one of the many Git tutorials online.
---
If you are unfamiliar with Git, some background may help introduce the relevant terminology before reading one of the many Git tutorials online.

Git is one of several source control systems - others include Subversion, RCS, Mercurial - which are used to keep a record of program source code as development progresses, as a means of keeping track of what went into a particular release, tracking down where a bug was introduced, and any other operation that benefits from a full and detailed history.

## Where everything lives

A Git repository is where the entirety of a particular project lives. A repository is completely contained within its directory, and so a normal system-level copy (or rename, or delete) of an entire Git repository is a safe operation. The resulting copy is both independent of and unaware of the original.

You can create a git repository of your own in any directory with ‘git init’.

## Data

### The working tree

The files and directories - the things you consider to be 'under source control' that you change in your editor or otherwise, live under the top repository directory but outside of its .git/ subdirectory. Only the top level directory has a .git/ subdirectory, unlike svn - say.

You can edit, delete, and rename files without telling Git until you want to: Git doesn't operate as a daemon or service, so it only runs while you execute a git command. It is very good at working out what changes you've made - even if you’ve renamed files and changed them.

While you are working, you can choose to ask Git to remember some or all of the latest differences between how your files are now and how Git's permanent repository remembers them. The place where it remembers them is called 'the staging area' and remembering them is called 'staging'. You can also remove or exclude selected changes from staging if it suits you. Staging diffs is easy, and is similar in concept to creating a patch file. Staging is the precursor to committing those changes as a permanent record in the Git repository.

### .gitignore

This is a plain text configuration file which contains filename patterns that git should consider invisible for the purposes of source control - e.g. \*.o, \*.class, bin/

- It is outside the .git directory, along with the 'normal' files, in order to keep it under source control: everyone in a project typically needs the same exclusions.
- It can refer to itself, to excuse itself from source control!

## Metadata

The 'behind the scenes' source control stuff all lives within the .git/ directory at the root of the repository.

### The staging area (or ‘staging’, or ‘index’)

The staging area is a set of file changes you're preparing to copy into the repository as a single commit (version); it lives in .git/index.

Changes that you've made but haven't yet told Git about are called 'unstaged' changes, and only exist in your working tree. You can see these with ‘git diff’.

Changes that you’ve made and copied to your staging area (with ‘git add’) are called ‘staged’ changes. You can see these with ‘git diff --staged'.

Creating a commit (with the 'git commit' command) copies the staged changes into a new commit and then clears the index.

Creating a commit does not affect the working tree.

The new commit becomes the current commit and incorporates the staged changes, so they no longer show up as differences between the commit and the working tree.

- Unstaged changes still show up as differences, until added to the index (or reverted).

The staging area can even be told to stage selected 'hunks' (patches/blocks of change) within a file, while leaving other hunks within the very same file unstaged.

- If this sounds useful to you, look for documentation on 'git add -p' or the tool 'gitk'.

### Branches, tags, and stash

These are ways to refer to particular commits, and they live in .git/refs and .git/packed-refs.

A tag marks a particular commit and is only ever moved manually; other SCMs might call it a label.

A branch is a special mobile tag that is updated whenever a commit is made to that branch.

- A branch is thus really a label that is always on the commit that most SCMs would call the branch/HEAD version.
- Local branches live in .git/refs/heads
- Branches from other repositories are maintained in .git/refs/remotes
- The default branch (following ‘git init’) is the ‘master’ branch.
- ‘git branch’ creates new branches, ‘git checkout’ changes the current branch.

The stash is a special set of commits used to hold temporary changes.

- Branches and tags are very cheap and almost identical - you can make them whenever you want to remember a particular point in development.
  - If curiosity leads you to look in .git/refs/heads/master, you will see the 40 character identifier for the commit that is the master branch. Much Git metadata is in plain text files.

### Configuration

- Information about which remote repositories this repository can talk to, how local branches relate to remote branches, etc, lives in .git/config.

### Hooks

- special scripts that run for various source-control events to enforce policy.
  - For instance, there could be a hook that runs when you 'commit', to ensure that every commit comment contains a JIRA ticket reference.

- Hooks are within the .git directory and not therefore under source control.
  - This is a bit unfortunate, because it means the user has to set them up for each clone of a repository.

## Global settings

User preferences - real name, email address, preferences, command aliases, etc. - are held in a user's home directory in a file called ~/.gitconfig. If you set them earlier, with the commands

<img class="no-box-shadow" src="{{page.imgdir}}/1.png"/>

then you will be able to see them in that file. You should set them now if you haven't already, because if you fail to set your email address, you will not be able to upload to Gerrit.
If you messed up a commit not yet sent to Gerrit with the wrong email address,

<img class="no-box-shadow" src="{{page.imgdir}}/2.png"/>

## Working Environment

The working environment looks much like it would as if Git wasn't around: the working tree is a normal directory with only the subtle presence of a .git directory to suggest otherwise.

After the first 'git clone' operation (or a 'git init' if you're trying to bring uncontrolled software under version control), git will set the 'current branch' to be 'master' and will make sure that the working tree reflects the commit to which the 'master' branch points. Each commit you make will have its parent set to the commit currently marked 'master', and 'master' will be moved to that new commit, ready for the next one.

On Unix, you will probably want to add something like the following near the end of your ~/.bashrc so the current Git branch shows up in your prompt - do a websearch for ‘bash git completion’ if you need more details:

<img class="no-box-shadow" src="{{page.imgdir}}/3.png"/>

You can use 'git branch -a' to list the branches your repository knows about, and 'git checkout' to both change your current branch and update your working tree to reflect the files and directories appropriately.

**And there’s more**
This describes the basic Git repository and mentions the essential commands in passing. There are advanced bits you may need later, like ‘git remote’ for keeping your repository up to date with someone else’s clone of the same code, ‘git submodule’ and ‘git subtree’ to let you link repositories together, and ‘git worktree’ which lets you maintain several working directories on one repository, and hidden bits which you typically won’t need like .git/objects (where all the changes live).

# Conclusion
I enjoy working with Git: I find it stays out of the way when I want to ignore it, it’s fast to switch between projects, it makes it easy to compare different strands of development.
I like how commands like ‘git status’ offer helpful but unobtrusive suggestions about reverting changes, and I find that understanding how branches and tags relate to each other increased my confidence with merging and rebasing simply because I understood that it’s easy to reset things if experiments go wrong.

Now that I've spoiled most of the surprises, it is probably a good idea for you to read a tutorial.

This is a nice one: <a href="https://try.github.io/levels/1/challenges/1">https://try.github.io/levels/1/challenges/1</a>

**Tim Baverstock, QA automation.**
