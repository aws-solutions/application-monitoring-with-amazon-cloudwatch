#!/bin/bash
#
# This assumes all of the OS-level configuration has been completed and git repo has already been cloned
#
# This script should be run from the repo's deployment directory
# cd deployment
# ./run-unit-tests.sh
#

# Get reference for all important folders
template_dir="$PWD"
resource_dir="$template_dir/../source/resources"
source_dir="$template_dir/../source/services"

echo "------------------------------------------------------------------------------"
echo "[Pre-Test] build binaries"
echo "------------------------------------------------------------------------------"
cd $source_dir/tagHandler
npm run build:all

cd $source_dir/dashboardHandler
npm run build:all

cd $source_dir/helper
npm run build:all

echo "------------------------------------------------------------------------------"
echo "[Test] resources"
echo "------------------------------------------------------------------------------"
cd $resource_dir
npm run coverage -- -u

echo "------------------------------------------------------------------------------"
echo "[Test] tag handler"
echo "------------------------------------------------------------------------------"
cd $source_dir/tagHandler
npm run coverage

echo "------------------------------------------------------------------------------"
echo "[Test] dashboard handler"
echo "------------------------------------------------------------------------------"
cd $source_dir/dashboardHandler
npm run coverage

echo "------------------------------------------------------------------------------"
echo "[Test] helper"
echo "------------------------------------------------------------------------------"
cd $source_dir/helper
npm run coverage

