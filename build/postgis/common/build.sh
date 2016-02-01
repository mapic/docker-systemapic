#!/bin/bash

function build() {
  

  while test -n "$1"; do
    opt=$1
    shift
    echo "opt:$opt, args:$@"
    if test "$opt" = "--latest"; then
      LATEST="yes"
    elif test "$opt" = "--no-latest"; then
      LATEST="no"
    else
      PGVER="$opt"
    fi
  done

  PGVER_SHORT=`echo ${PGVER} | tr -d .`
  NAME="systemapic/postgis"
  TAG="${PGVER_SHORT}-21"
  FULLNAME="${NAME}:${TAG}"
  LATESTNAME="${NAME}:latest"
  echo "Building $PGVER $FULLNAME"
  cd common
  docker build --build-arg PGVER=${PGVER} -t ${FULLNAME} . || exit 1

  echo "Image ${FULLNAME} built"

  if test "$LATEST" = "yes"; then
    docker tag -f ${FULLNAME} ${LATESTNAME}
    echo "Image tagged as ${LATESTNAME}"
  fi
}

PGVER=$1
LATEST=yes

# prompt version if not specified like `./build.sh 9.3`
if test "$PGVER" = ""; then
  read -e -p "Enter PostgreSQL version to build: [$DEFAULT_VERSION] " PGVER
  echo "Usage: ./build.sh PGVER (like: ./build.sh 9.4)"
  echo "Aborted."
  exit 1
fi

# only match supported versions
if [ "$PGVER" = "9.4" ] || [ "$PGVER" = "9.3" ]; then
  build
else
  echo "Build support only for either 9.4 or 9.3. Quitting!"
  exit 1
fi
