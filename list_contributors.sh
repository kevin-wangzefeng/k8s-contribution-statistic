# get contributors from git log, with the latest commit_id
echo $0
echo $1
cur_dir=`pwd`

# target_git_repo=$1
target_git_repo=${1:-"/home/oss-contrib/kubernetes"}

# output_file_name=$2
output_file_name=${2:-"commits.txt"}

rm -f $cur_dir/$output_file_name
cd $target_git_repo

git log --pretty='%aN <%aE>' --all | sort | uniq | while read line
do
    commit_id=`git log --pretty=%H --author="$line" -1`
#   echo "$line, https://github.com/GoogleCloudPlatform/kubernetes/commit/$commit_id"
    echo "$line, $commit_id" >> $cur_dir/$output_file_name
done

cd $cur_dir
