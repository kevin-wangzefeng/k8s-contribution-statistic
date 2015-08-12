# get contributors from git log, with the latest commit_id
#echo $0
#echo $1
cur_dir=`pwd`

# target_git_repo=$1
#target_git_repo=${1:-"/home/oss-contrib/kubernetes"}
target_git_repo='/home/oss-contrib/kubernetes'
# output_file=$2
#output_file_name=${2:-"commits_ranking_by_users.txt"}
output_file_name='commits_ranking_by_users.txt'

rm -f $cur_dir/$output_file_name
cd $target_git_repo

git log --pretty='##%aN <%aE>' --all | sort | uniq -c >> $cur_dir/$output_file_name

cd $cur_dir
