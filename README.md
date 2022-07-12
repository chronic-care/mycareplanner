## Major Dependencies not derived from package.json
* npm
  * Minimum npm version that the team has tested
    * 8x
* create-react-app
   * See https://create-react-app.dev/docs/getting-started/ for npx-based installation instructions
   * Note: The application uses rescripts as a devDependency

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
3. Run yarn to install:
    * `yarn`
4. To run the application on localhost, run:
    * `yarn start`
5. Open the following URL in a browser to test the local version in our test sandbox: 
    * http://localhost:8000/mycareplanner/launch.html?iss=https://gw.interop.community/CarePlanning/data
7. Login with credentials
8. Select Patricia Noelle, the primary test patient to load sample data so that it can be displayed/used in the application

## Manage .env environment variables
* .env is provided
* .env.local can be created in the root folder (same level as .env) to override the properties in .env if desired
  * Note: This file is ignored by git

## Manage package.json
* In general, do not commit updates to package.json unless:
    * There is a valid and intentional dependency update
      * e.g. New dependencies are added, old dependencies are removed, dependency versions are updated for security or for preferential reasons
* TODO: Create a combined ticket to address/update this and yarn.lock maintenance

## Mange yarn.lock
* In general, do not commit updates to package.json unless:
    * There is a valid and intentional dependency update to package.json
      * e.g. New dependencies are added, old dependencies are removed, dependency versions are updated for security or for preferential reasons
* TODO: Create a combined ticket to address/update this and package.json maintenance. 
  * See the following link for an implementation option: https://11sigma.com/blog/2021/09/03/yarn-lock-how-it-works-and-what-you-risk-without-maintaining-yarn-dependencies-deep-dive/

## Development environment setup after modifying package.json, yarn.lock, or checking out a new version of either
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
  * `docker run -p 80:80 <hash>`

## Troubleshooting:
* Typescript errors are presented which do not allow the application to compile
  * Obtain a working yarn.lock file
  * Follow the [Development environment setup after modifying package.json, yarn.lock, or checking out a new version of either](#development-environment-setup-after-modifying-packagejson-yarnlock-or-checking-out-a-new-version-of-either) process to resolve
