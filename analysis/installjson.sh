#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

python ${DIR}/createjson.py
cp ${DIR}/output/weights-bhattacharyya-30.json ${DIR}/../www/static/data/
cp ${DIR}/output/weights-bhattacharyya-7.json ${DIR}/../www/static/data/
cp ${DIR}/output/weights-bhattacharyya.json ${DIR}/../www/static/data/
