#!/bin/bash

REPOS_TO_CHECK="kubernetes kubernetes.github.io test-infra ingress community heapster contrib"

REPO_ROOT=${REPO_ROOT:-"repos"}
SCRIPT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OUTPUT_DIR=${OUTPUT_DIR:-"$SCRIPT_ROOT/output"}

STARTED_AT=$(date)

# clone the repos
#for REPO in kubernetes kubernetes.github.io test-infra ingress community heapster contrib
mkdir -p ${REPO_ROOT}
mkdir -p ${OUTPUT_DIR}/raw
mkdir -p ${OUTPUT_DIR}/orgs

for REPO_NAME in $REPOS_TO_CHECK; do
  REPO_X="${REPO_ROOT}/${REPO_NAME}"
  if [[ -d ${REPO_X} ]] ; then
    echo ""
  else
    echo "Repo ${REPO_NAME} don't exist in ${REPO_ROOT}, cloning"
    git clone https://github.com/kubernetes/${REPO_NAME}.git ${REPO_X}
  fi

  echo "Refreshing repo in path ${REPO_X}"
  pushd ${REPO_X}
  UPSTREAM=$(git remote -v |grep "kubernetes/${REPO_NAME}" | awk '{print $1}' | head -1)
  git remote update $UPSTREAM --prune
  git checkout $UPSTREAM/master

  echo "Checking git logs"
  FILE=${OUTPUT_DIR}/raw/${REPO_NAME}.txt
  git log --pretty="tformat:^%H##%at##%aN##%aE##%s##" --shortstat |tr "\n" " " | sed "s/\ \ \ //g" | tr "^" "\n" | grep -v "##Merge " > $FILE
  sed -i "s/##/^/g" $FILE

  sed -i "s/ file changed, /^files changed^/g" $FILE
  sed -i "s/ files changed, /^files changed^/g" $FILE

  sed -i "s/ insertion(+), /^insertions^/g" $FILE
  sed -i "s/ insertions(+), /^insertions^/g" $FILE
  sed -i "s/ insertion(+)/^insertions/g" $FILE
  sed -i "s/ insertions(+)/^insertions/g" $FILE

  sed -i "s/ deletion(-), /^deletions^/g" $FILE
  sed -i "s/ deletions(-), /^deletions^/g" $FILE
  sed -i "s/ deletion(-)/^deletions/g" $FILE
  sed -i "s/ deletions(-)/^deletions/g" $FILE

  echo "Commit data formatted, see $FILE"
  popd
done


for org in google redhat coreos huawei microsoft fujitsu ibm hyper rackspace mirantis apprenda fathomdb zju zte
do
  grep -rE "@.*${org}.*\.(edu|cn|com|io|inc|sh)" ${OUTPUT_DIR}/raw > ${OUTPUT_DIR}/orgs/${org}.txt
done

DONE_AT=$(date)
echo "Done. Started at: ${STARTED_AT}, finished at: ${DONE_AT}"
echo "Formatted data stored in ${OUTPUT_DIR}"
