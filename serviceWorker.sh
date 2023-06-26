#! /bin/sh

# 指定目录路径
directory="./dist/maoyetrpg"

# 遍历目录并生成JSON数组字符串
json_array=$(find "$directory" -type f -exec realpath --relative-to="$directory" {} \; | \
    awk '{print "\""$0"\","}' | tr '\n' ' ' | sed 's/,$/\n/')

# 指定文件路径和替换的字符串
file_path="./dist/maoyetrpg/serviceWorker.js"
replacement="__REPLACE_WITH_JSON_ARRAY__"

#把serviceworker.js复制到dist
cp ./serviceWorker.js ./dist/maoyetrpg/

# 将JSON数组字符串替换到文件的指定字符串
sed -i "s@$replacement@$json_array@" "$file_path"

# 覆盖到部署目录下
rm -rf ./docs/* && cp -r ./dist/maoyetrpg/* ./docs/ && cp -r ./CNAME ./docs/
