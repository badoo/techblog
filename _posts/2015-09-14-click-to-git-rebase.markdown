---
layout: post
title: Click to git rebase
author: Ilya Ageev
date: 2015-09-14
categories: git
---

<img alt="git rebase" src="{{page.imgdir}}/image1.png" style="float: left; max-width: 50%; margin-right: 10px;" />
When we talk about automating the development and testing process, it might sound like it's a very ambitious affair, and indeed it is. But if you break it into pieces, then individual fragments of the whole picture become visible. This process of fragmentation is highly important in two situations:
<br>
<br>
<br>
<br>
<ul>
 <li>when actions that require concentration and accuracy are being performed manually;</li>
 <li>when there are severe time constraints.</li>
</ul>

In our case, the time constraint is evident: releases are compiled, tested, and rolled out to the production server twice a day. Given the cramped time periods in a release's life cycle, the process of deleting (rolling back) a buggy task from the release branch has great significance. And to realize that process, we use git rebase. Because git rebase is an entirely manually operation that requires attentiveness and exactness, and takes an extended period of time, we have automated the process of deleting a task from the release branch.

#Git flow

Git is currently one of the most popular version control systems, and we use it effectively at Badoo.
Working with Git is quick and simple.

<img alt="flow scheme" src="{{page.imgdir}}/image3.png"/>

A particular feature of our model is that we develop and test each job in a separate branch. The branch name consists of the JIRA ticket number and an arbitrary description of the job. For example:

{% highlight sh %}
BFG-9000_All_developers_should_be_given_a_years_holiday_(paid)
{% endhighlight %}

We compile the release and test from a separate (release) branch in which finished and tested jobs are merged in the development environment. Because we roll out code to our production server twice a day, it follows that we create two new release branches every day.

<img alt="statuses" src="{{page.imgdir}}/image4.png"/>

The release is formed by merging jobs into a release branch using the auto merge tool. We also have a master branch, which is a copy of the production server. After the release and each individual job have been integration tested, the code is sent to the production server and merged into the master branch.

When a release is being tested in the staging environment and a bug is found in one of the jobs but there is no time for a fix, we simply delete that job from the release using git rebase.

<img alt="cats to release" src="{{page.imgdir}}/image5.png"/>

<i>Note:</i> We do not use the git revert function in the release branch, because if a job is deleted from the release branch using git revert and the release branch is merged into the master branch, from which a developer then pulls fresh code into the branch where the bug originated, then he would have to do a revert on a revert in order to back out his changes.

In the next stage, we build a new version of the release, push it to the staging environment, test for bugs, run autotests, and then, if the tests pass, we push the code out to the production server.
The main elements of this flow are entirely automated and operate in a seamlessly integrated process (until now only deleting a job from the release branch was performed manually).

<img alt="cats flow" src="{{page.imgdir}}/image6.png"/>

#Statement of the problem

Let's consider what can be used to automate the process:

1. The release branch, which we are planning on pulling a ticket from, consists of two kinds of commits:
    * A merge commit that happens when merging working branches into the release branch and contains the ticket name in the commit message, since branches are named with a job prefix;
    * A merge commit that happens when automatically merging the master branch into the release branch. We apply patches in a semi-automated fashion to the master branch using our special DeployDashboard tool. Patches are applied to the appropriate ticket. Furthermore, the ticket number and patch description are given in the commit message.
2. The built-in git rebase command, which is best used interactively because of the useful visualization.

_Problems you may encounter:_

1. During the git rebase operation, a remerge of all commits in the branch is performed, beginning with the one being rolled back.
2. If a merge conflict was resolved manually when the branch was created, Git does not save the resolution in memory. So when running git rebase, you will have to fix merge conflicts again manually.
3. In this particular algorithm, conflicts are divided into two kinds:
    * simple - these conflicts occur because the version control system does not support remembering previously resolved merge conflicts;
    * complex - these conflicts occur because code was changed in a specific line (file), not only in the commit being deleted from the branch, but also in subsequent commits, which are remerged when git rebase is run. In this case, the developer fixes the conflict manually and performs a push into the release branch.

Git has an interesting feature, "git rerere", which remembers the resolution of conflicts during a merge. It is enabled in automatic mode, but unfortunately it cannot help us here. This function only works when there are two long-standing branches that are constantly being merged. Git remembers these conflicts without any trouble.

We only have a single branch and if the -force function isn't used when git pushing changes into the repository, then after each git rebase you have to create a new branch with a new trunk. For example, we apply the suffix _r1,r2,r3 … after each successful git rebase operation and perform a git push of the new release branch into the repository. Thus, the conflict resolution history is not preserved.

_What do we ultimately want to achieve?_

By clicking a certain button in our bug tracker:

1. The job is deleted from the release automatically.
2. A new release branch is created.
3. The job's status is changed to Reopen.
4. All simple merge conflicts are resolved in the process of deleting the job from the release.

Unfortunately in any workflow it is impossible to resolve complex merge conflicts, so if a complex conflict occurs we notify the developer and release manager.

#Main features

<img alt="git merge" src="{{page.imgdir}}/image7.png" style="float: right; max-width: 50%; margin-left: 10px;" />

1. Our script uses an interactive rebase and captures the commits in a release branch that has the job number to be rolled back.
2. Upon finding the desired commits, the script deletes them and remembers the names of the files they affected.
3. Then it remerges all commits, beginning with the commit we most recently deleted in the branch's trunk.
4. If a conflict occurs, then it checks the files involved in the conflict. If these files match the files of deleted commits, then we notify the developer and release manager that there has been a complex conflict that must be resolved manually.
5. If the files do not match and there is a conflict, then it is a simple conflict. Then we take the code of the files from the commit, where the developer already resolved this conflict, from the origin repository.

Thus, we "run to the root of the branch".

The probability that we will hit a complex conflict is almost non-existant, i.e. this process will execute automatically 99% of the time.

#Implementation

Now let's take a step-by-step look at what our script will do (in the example, only an automatic rebase is used and the script can simply be used in the console):

<img alt="git commit" src="{{page.imgdir}}/image8.png" style="float: right; max-width: 50%; margin-left: 10px;" />

1. We purge the repository and pull the latest version of the release branch.
2. We get the top commit in the trunk with a merge in the release branch that we want to revert.
    a. If there is no commit, we report that there is nothing to revert.
3. We generate an editor script that only deletes hashes of merge commits from the branch's trunk, thus deleting them from the history.
4. In the reverter script's context, we specify the editor script (EDITOR) that we generated in the previous step.
5. We run git rebase -ip for the release. We check the error code.
    * If it is 0, then everything succeeded. We jump to step 2 to find potential prior commits of the working branch being deleted.
    * If it is not 0, then there was a conflict. We try to resolve it:
        - We remember the hash of the commit that could not be applied. It is stored in the file .git/rebase-merge/stopped-sha
        - We examine the output of the rebase command to determine what went wrong.
            + If Git reports "CONFLICT (content): Merge conflict in ", then we compare the file with the version prior to that being deleted, and if it is the same (the was not changed in the commit), then we simple take the file from the build branch's root and commit. If it differs, then we exit and the developer resolves the conflict manually.
            + If Git reports "fatal: Commit is a merge but no -m option was given", then we simply repeat the rebase with the --continue flag. The merge commit is skipped, but the changes are not lost. This usually happens with the master branch, but it has already been pulled into the root of the branch and this merge commit isn't needed.
            + If Git reports "error: could not apply… when you have resolved this problem run 'git rebase --continue'", then we run git status to get a list of files. If even one file from the status is in the commit that we are rolling back, then we skip the commit (rebase --skip) that we remembered in step 5.b.i, writing this fact to the log in order to notify the release manager and let him or her decide whether this commit is needed.
            + If none of the above happens, then we exit the script and report that something unexpected occurred.
6. We repeat step 5 until we get exit code 0 or the cycle counter > 5, in order to avoid an endless loop.

{% highlight php %}
<?php 
/*
The code is from our deploy library and won't work when copy-pasted. The purpose of this code is to show the concept.
*/
    function runBuildRevert($args)
    {
       if (count($args) != 2) {
           $this->commandUsage("<build-name> <ticket-key>");
           return $this->error("Unknown build!");;
       }

       $build_name = array_shift($args);
       $ticket_key = array_shift($args);

       $build = $this->Deploy->buildForNameOrBranch($build_name);
       if (!$build) return false;

       if ($this->directSystem("git reset --hard && git clean -fdx")) {
           return $this->error("Can't clean directory!");
       }
       if ($this->directSystem("git fetch")) {
           return $this->error("Can't fetch from origin!");
       }
       if ($this->directSystem("git checkout " . $build['branch_name'])) {
           return $this->error("Can't checkout build branch!");
       }
       if ($this->directSystem("git pull origin " . $build['branch_name'])) {
           return $this->error("Can't pull build branch!");
       }

       $commit = $this->_getTopBranchToBuildMergeCommit($build['branch_name'], $ticket_key);
       $in_stream_count = 0;
       while (!empty($commit)) {
           $in_stream_count += 1;
           if ($in_stream_count >= 5) return $this->error("Seems rebase went to infinite loop!");
           $editor = $this->_generateEditor($build['branch_name'], $ticket_key);

           $output = '';
           $code = 0;
           $this->exec(
               'git rebase -ip ' . $commit . '^^',
               $output,
               $code,
               false
           );

           while ($code) {
               $output = implode("\n", $output);
               $conflicts_result = $this->_resolveRevertConflicts($output, $build['branch_name'], $commit);
               if (self::FLAG_REBASE_STOP !== $conflicts_result) {
                   $command = '--continue';
                   if (self::FLAG_REBASE_SKIP === $conflicts_result) {
                       $command = '--skip';
                   }
                   $output = '';
                   $code = 0;
                   $this->exec(
                       'git rebase ' . $command,
                       $output,
                       $code,
                       false
                   );
               } else {
                   unlink($editor);
                   return $this->error("Giving up, can't resolve conflicts! Do it manually.. Output was:\n" . var_export($output, 1));
               }
           }

           unlink($editor);
           $commit = $this->_getTopBranchToBuildMergeCommit($build['branch_name'], $ticket_key);
       }
       if (empty($in_stream_count)) return $this->error("Can't find ticket merge in branchdiff with master!");
       return true;
    }

    protected function _resolveRevertConflicts($output, $build_branch, $commit)
    {
       $res = self::FLAG_REBASE_STOP;
       $stopped_sha = trim(file_get_contents('.git/rebase-merge/stopped-sha'));
       if (preg_match_all('/^CONFLICT\s\(content\)\:\sMerge\sconflict\sin\s(.*)$/m', $output, $m)) {
           $conflicting_files = $m[1];
           foreach ($conflicting_files as $file) {
               $output = '';
               $this->exec(
                   'git diff ' . $commit . '..' . $commit . '^ -- ' . $file,
                   $output
               );
               if (empty($output)) {
                   $this->exec('git show ' . $build_branch . ':' . $file . ' > ' . $file);
                   $this->exec('git add ' . $file);
                   $res = self::FLAG_REBASE_CONTINUE;
               } else {
                   return $this->error("Can't resolve conflict, because file was changed in reverting branch!");
               }
           }
       } elseif (preg_match('/fatal\:\sCommit\s' . $stopped_sha . '\sis\sa\smerge\sbut\sno\s\-m\soption\swas\sgiven/m', $output)) {
           $res = self::FLAG_REBASE_CONTINUE;
       } elseif (preg_match('/error\:\scould\snot\sapply.*When\syou\shave\sresolved\sthis\sproblem\srun\s"git\srebase\s\-\-continue"/sm', $output)) {
           $files_status = '';
           $this->exec(
               'git status -s|awk \'{print $2;}\'',
               $files_status
           );
           foreach ($files_status as $file) {
               $diff_in_reverting = '';
               $this->exec(
                   'git diff ' . $commit . '..' . $commit . '^ -- ' . $file,
                   $diff_in_reverting
               );
               if (!empty($diff_in_reverting)) {
                   $this->warning("Skipping commit " . $stopped_sha . " because it touches files we are reverting!");
                   $res = self::FLAG_REBASE_SKIP;
                   break;
               }
           }
       }
       return $res;
    }

    protected function _getTopBranchToBuildMergeCommit($build_branch, $ticket)
    {
       $commit = '';
       $this->exec(
           'git log ' . $build_branch . ' ^origin/master --merges --grep ' . $ticket . ' -1 --pretty=format:%H',
           $commit
       );
       return array_shift($commit);
    }

    protected function _generateEditor($build_branch, $ticket, array $exclude_commits = array())
    {
       $filename = PHPWEB_PATH_TEMPORARY . uniqid($build_branch) . '.php';
       $content = <<<'CODE'
#!/local/php5/bin/php
<?php
$build = '%s';
$ticket = '%s';
$commits = %s;
$file = $_SERVER['argv'][1];
if (!empty($file)) {
    $content = file_get_contents($file);
    $build = preg_replace('/_r\d+$/', '', $build);
    $new = preg_replace('/^.*Merge.*branch.*' . $ticket . '.*into\s' . $build . '.*$/m', '', $content);
    foreach ($commits as $exclude) {
       $new = preg_replace('/^.*' . preg_quote($exclude, '/') . '$/m', '', $new);
    }
    file_put_contents($file, $new);
}
CODE;
       $content = sprintf($content, $build_branch, $ticket, var_export($exclude_commits, 1));
       file_put_contents($filename, $content);
       $this->exec('chmod +x ' . $filename);
       putenv("EDITOR=" . $filename);
       return $filename;
    }
{% endhighlight %}

#Conclusion

<img alt="git push" src="{{page.imgdir}}/image9.png" style="float: left; max-width: 50%; margin-right: 10px;" />

Ultimately, we created a script that automatically deletes jobs from the release branch. We saved time in compiling and testing the release and almost entirely eliminated the human factor.

Of course, our script isn't suitable for every Git user. In some instances it would be simpler to use git revert, but it's best not to get carried away with that command, e.g. reverting a revert of a revert... We hope that the difficult git rebase command is now more understandable to you. And if you use git rebase regularly, we hope our script will work for your development and release process.

Ilya Ageev, Head of QA
