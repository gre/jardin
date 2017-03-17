#!/bin/bash

echo "export default {";
for file in icons/*.svg; do
  filename=${file##*/};
  name=${filename%.*};
  echo "  '${name}': require('./$file'),";
done;
echo "};";
