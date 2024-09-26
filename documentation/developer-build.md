# Build this JavaScript React web application

## Major dependencies
* node.js
  * Minimum version that the team has tested
    * 16x
* npm
  * Minimum version that the team has tested
    * 8x
* yarn
  * Minimum version that the team has tested
    * 1.22.19

## Branches
* 'main' branch
  * The application itself
* 'gh-pages' branch
  * Created automatically by the 'npm run deploy' command. Used to build and deploy the application for use in github.io
* 'mui' branch
  * TODO: Dave to provide this information

## Setup development environment
1. Clone the application using https://github.com/chronic-care/mycareplanner.git
2. Checkout the 'main' branch
3. With __administrative__ privileges, run:
    * `npm install yarn -g`
4. Run yarn to install (Note: Running 'yarn' is a shortcut for running 'yarn install'):
    * `yarn`
5. To run the application on localhost, run:
    * `yarn start`
6. Open the following URL in a browser to test the local version in our test sandbox:
    * http://localhost:8000/mycareplanner/launch.html?iss=https://gw.interop.community/CarePlanning/data
    * http://localhost:8000/mycareplanner/launch.html?iss=https://gw.interop.community/MCCDevelopment/data

7. Login with credentials
8. Select Patricia Noelle, the primary test patient to load sample data so that it can be displayed/used in the application

## Manage .env environment variables
* .env is provided
* .env.local can be created in the root folder (same level as .env) to override the properties in .env if desired
  * Note: This file is ignored by git

## Manage 'package.json'
* In general, do not commit updates to 'package.json' unless:
    * There is a valid and intentional dependency update
      * e.g. New dependencies are added, old dependencies are removed, dependency versions are updated for security or for preferential reasons
* TODO: Create a combined ticket to address/update this and 'yarn.lock' maintenance

## Mange 'yarn.lock'
* In general, do not commit updates to 'package.json' unless:
    * There is a valid and intentional dependency update to 'package.json'
        * e.g. New dependencies are added, old dependencies are removed, dependency versions are updated for security or for preferential reasons
           * If there is a valid update, and it causes changes to yarn.lock, ensure those changes are committed. This is why yarn.lock is in the repo, so that the entire team is exactly synchronized
* TODO: Create a combined ticket to address/update this and 'package.json' maintenance.
  * See the following link for an implementation option: https://11sigma.com/blog/2021/09/03/yarn-lock-how-it-works-and-what-you-risk-without-maintaining-yarn-dependencies-deep-dive/

## Development environment setup after modifying 'package.json', 'yarn.lock', or checking out a new version of either
1. Check out 'main' branch if needed
2. Delete current 'yarn.lock' file
3. Delete 'node_modules' folder
4. Pull updates if needed
5. Run yarn to install
    * `yarn`
6. Refresh or restart development environment if there are any issues
* TODO: Consider documenting/testing a faster yarn update version of this

## Docker
* To build with docker, run 'docker build .' from the root directory:
  * `docker build .`
* This will build a container which serves content on port 80. Run this container with:
  * `docker run -i -p 8000:8000 <hash>`

* Run for meld and override providers using my providers file
docker run -d -it \
   -p 8000:8000 \
   -e REACT_APP_MELD_SANDBOX_NAME=MCCDevelopment \
   -e REACT_APP_MELD_SANDBOX_CLIENT_ID=<<IDHER>   \
   --mount type=bind,source="$(pwd)"/myproviders.json,target=/home/node/app/src/data-services/endpoints/providers.json,readonly \
   chroniccare/mycareplanner:latest

* Note: yarn.lock is required for the build to run correctly. Do not remove the relevant COPY command

## Style guide
* For consistent readability and isolated commit diffs, a specific style should be used for the project
  * TODO: Create a ticket to:
    * Define style
      * Potentially define it with a lint file and/or with VS Code settings
    * Lint can enforce the style but we would want to provide a way to keep the style synchronized in an automated fashion such as a script or by using the same development environment settings (e.g. using VS Code). It should be seamless so that one never sees a lint error to begin with simply by saving the file or running a script. Note: In VS Code this can even be done in real time as you type

## Troubleshooting:
* A yarn error similar to, "cannot find module yarn.js" is presented
  * With __administrative__ privileges, run:
    * `npm install yarn -g`
* A React error states that dependencies are missing when attempting to run `yarn` or `npm install`
  * Attempt to create a new React app to ensure that React will work on your device in general
    * Run the following:
      * `npx create-react-app test`
      * `cd test`
      * `yarn start`
    * Ensure the app launches in a browser
      * Open http://localhost:3000/ to view the test app
    * If the test app works, navigate back to the mycareplanner directory
    * Attempt to install the application
      * `yarn`
    * If there are no longer any errors installing, run:
      * `yarn start`
      * ...and continue from step 6 of [Setup development environment](#setup-development-environment)
    * If there are still errors installing, follow the directions in this [Troubleshooting](#troubleshooting) section titled, 'A yarn error similar to, "cannot find module yarn.js" is presented'
* Typescript errors are presented which do not allow the application to compile
  * Obtain a working 'yarn.lock' file
  * Follow the [Development environment setup after modifying 'package.json', 'yarn.lock', or checking out a new version of either](#development-environment-setup-after-modifying-packagejson-yarnlock-or-checking-out-a-new-version-of-either) process to resolve
