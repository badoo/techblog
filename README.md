## Badoo Tech Blog

This is the source code for the Badoo Tech Blog. It is built using Jekyll.

### Getting Set Up

First fork the http://git.ukoffice/mobile/techblog repository on GitHub.

Then clone your fork of the project locally by running the following command with your GitHub username:
```sh
git clone git@git.ukoffice:<yourusername>/techblog.git techblog
```

The move into the **techblog** directory and add the original repository as a remote:
```sh
cd techblog
git remote add upstream git@git.ukoffice:mobile/techblog.git
```

### Contributing a Post

Assuming you want to write a new post with a title of "I am awesome", first create a new branch:
```sh
git checkout -b i-am-awesome
```

Read http://jekyllrb.com/docs/posts/ for an explanation of how to add a new post.

When you are done and have committed all your work push your branch to your forked repository.
```sh
git push origin i-am-awesome
```

Submit a pull request back to the origin repository and someone (or lots of people) will review it and maybe make some comments. When everybody is happy your pull request will be merged and will be live on the site when the next release is done.





