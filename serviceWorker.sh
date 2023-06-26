#! /bin/sh
read_dir(){
  for file in `ls -a $1`
  do
    if [ -d $1"/"$file ]
    then
      if [[ $file != '.' && $file != '..' ]]
      then
          read_dir $1"/"$file
      fi
    else
      echo $1"/"$file
    fi
  done
}
#测试目录 test
cd ./dist/maoyetrpg && read_dir .

# sed -i 's/text/replace/' file
