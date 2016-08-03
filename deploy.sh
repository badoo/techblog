#!/bin/sh
set -ex

build_version=$1

if [ -z "$build_version" ]; then
	echo "Usage: $0 <build_version>"
	echo "  where build_version is major.minor format"
	exit 1
fi

rm -rf _site

archive=techblog-$build_version-site

if [ ! $(which jekyll) ]; then
	gem install jekyll
	npm install -g less
fi

jekyll build
cd _site
tar -czf ../$archive.tgz .
cd ..

HOSTS="mwebstaging1.mlan mwebstaging1.ulan"
for host in $HOSTS; do
	scp $archive.tgz $host:
	ssh $host "if [ -d $archive ]; then rm -r $archive/*; else mkdir $archive; fi && tar -xmf $archive.tgz -C $archive && sudo -u wwwrun rsync -az --delete $archive/* /local/techblog/"
done

