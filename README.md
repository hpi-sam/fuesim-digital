# FüSim Digital

## If you're interested in the most recent stable release, please check out the [main](https://github.com/hpi-sam/fuesim-digital/tree/main) branch.

This is the codebase for the "FüSim Digital", a simulation system for training emergency services leadership personnel on how to manage mass casualty incidents and other major incidents.

It originally was a digital implementation of the "FüSim MANV" (Führungssimulation Massenanfall von Verletzen), a German simulation system for training emergency medical services leadership personnel on how to manage [Mass Casualty Incidents](https://en.wikipedia.org/wiki/Mass-casualty_incident).

**You can try it out at [https://fuesim-manv.de/](https://fuesim-manv.de/)**.

![image](https://user-images.githubusercontent.com/18506183/172071147-24b9aabe-51ee-4105-a5a4-6cbf8063eece.png)
_A screenshot of a part of an MCI exercise with initially ca. 50 patients at the Brandenburg Gate._

The concept is as follows:

- A _trainer_ creates an exercise, which consists of _patients_, _vehicles_, _viewports_, _transferPoints_ and other objects placed on a map.
- _Participants_ can then join the exercise.
- The _trainer_ can restrict the participants to a specific _viewport_. The _participant_ cannot move out of this area.
- _Vehicles_ (containing _material_, _personnel_ and (sometimes) _patients_) can be transferred to other areas via _transferPoints_.
- After the exercise is started, _patients_ that are not adequately treated by _personnel_ and _material_ can deteriorate and die. The goal of the _participants_ is to prevent the _patients_ from dying and transport them to the _hospitals_. To do this effectively they have to communicate with each other (via real radio devices, or remote via third-party services) and make the right decisions.
- Afterward, the exercise can be evaluated via statistics and a "time-travel" feature.

This simulation has been designed in cooperation with and with support from

- the [Federal Academy for Civil Protection and Civil Defence](https://www.bbk.bund.de/DE/Themen/Akademie-BABZ/akademie-babz_node.html) of the [Federal Office of Civil Protection and Disaster Assistance Germany](https://www.bbk.bund.de/DE/Home/home_node.html), who are the original copyright holders of the analog "FüSim MANV" simulation system
- the [Malteser Hilfsdienst e.V. Berlin](https://www.malteser-berlin.de/)
- the [Johanniter Akademie NRW, Campus Münster der Johanniter-Unfall-Hilfe e.V.](https://www.johanniter.de/bildungseinrichtungen/johanniter-akademie/johanniter-akademie-nordrhein-westfalen/standorte-der-akademie-in-nordrhein-westfalen/campus-muenster/)
- and the [Berliner Feuerwehr- und Rettungsdienst-Akademie (BFRA)](https://www.berliner-feuerwehr.de/ueber-uns/ausbildung-an-der-bfra/) of the [Berliner Feuerwehr](https://www.berliner-feuerwehr.de/).

The simulation is implemented as a web application with an Angular frontend and NodeJS backend.

This project is currently developed as a [bachelor project](https://hpi.de/en/studies/before-your-studies/degree-programs/bachelor.html) at the [HPI](https://hpi.de/). You can find the official project website [here](https://hpi.de/giese/teaching/bachelor-projects/fuesim-on-fire.html).

## Links for collaborators

- [Internal test scenarios](https://github.com/hpi-sam/fuesim-digital-private-test-scenarios)
    - Used only for private testing, potentially contains personal data of past users
- [Public test scenarios](https://github.com/hpi-sam/fuesim-digital-public-test-scenarios)
    - Used for test scenarios in pipelines, Can also be used for private testing
    - For usage see the README.md in that repo
    - This repo is also a submodule of this repo. Use `--recurse-submodules` when cloning the repo or `run git submodule update --init --recursive` if you have cloned the repo already to get its contents.

## Installation

1. Install [NodeJs](https://nodejs.org/)  
   Please use the version specified at `devEngines.runtime.version` in `./package.json`. If you need different node versions on your machine we recommend [nvm](https://github.com/nvm-sh/nvm) or [nvm for windows](https://github.com/coreybutler/nvm-windows)
2. [npm](https://www.npmjs.com/) should already come with NodeJs.  
   The npm version specified by `devEngines.packageManager.version` matches the npm version that is bundled with the correct NodeJs version. Please do not update npm on your own.
3. Clone the repo by running `git clone https://github.com/hpi-sam/fuesim-digital`. To be able to run migration tests, you also have to clone the submodules: use `git clone --recurse-submodules https://github.com/hpi-sam/fuesim-digital` or run `git submodule update --init --recursive` if you have cloned the repo already.
4. Run `npm run setup` from the root folder
5. Copy the [`.env.example`](./.env.example) file to `./.env` and adjust the settings as you need them. Note that some of the variables are explained under the next point.
6. Choose whether you want to use a database:
   You can (optionally) use a database for the persistence of exercise data. Look at the [relevant section](./backend/README.md#database) in the backend README for further information.
   Note that to not use the database you have to edit an environment variable, see the [relevant section](./backend/README.md#without-a-database).
7. Connect an OpenID-Connect provider for authentication in the `.env` file.
8. (Optional) We have a list of recommended [vscode](https://code.visualstudio.com/) extensions. We strongly recommend you to use them if you are developing. You can see them via [the `@recommended` filter in the extensions panel](https://code.visualstudio.com/docs/editor/extension-marketplace#_recommended-extensions).
9. (Optional) We have prepared default settings, tasks and debug configurations for VS Code. You can find them in `.vscode/*.example`. Crete a copy of those files removing the `.example` and adjust them to your needs. The files without `.example`-Extensions are untracked so your adjustments won't be committed automatically.

## Starting for development

### Option 1

If you are using [vscode](https://code.visualstudio.com/), you can run the [task](https://code.visualstudio.com/docs/editor/tasks) `Start all` to start everything in one go.
Note that this _tries_ to start the database using `docker compose`. In case this fails please start the database in another way (see [this section in the backend README](./backend/README.md#database)).
If you're not using a database anyway, you could use the task `Start all but database` instead.

### Option 2

1. Open a terminal in `/shared` and run `npm run watch`
2. Open another terminal in `/frontend` and run `npm run start`
3. Open another terminal in `/backend` and run `npm run start`
4. Consider the database and authentication -- see point 6+7 of the [installation](#installation).

## Starting for deployment (using docker)

You need to have [`docker`](https://www.docker.com/) installed.

### With docker compose (recommended)

1. [`docker compose`](https://docs.docker.com/compose/) needs to be installed. Note that, depending on your setup, you may use `docker-compose` instead of `docker compose`. In this case, just replace the space in the commands with a dash (`-`). For more information, see the [relevant section of the documentation](https://docs.docker.com/compose/#compose-v2-and-the-new-docker-compose-command).
2. Run `docker compose up -d` in the root directory. This also starts the database. If you don't want to start the database run `docker compose up -d app` instead.

### Without docker compose

1. Execute `docker run -p -d 80:80 digitalfuesimmanv/dfm`.

The server will start listening using nginx on port `80` for all services (frontend, API, WebSockets).

Note the database requirements depicted in [the installation section](#installation).

### Building the container from scratch

#### Option 1

1. Uncomment the build section of [the docker compose file](./docker-compose.yml).
2. Run `docker compose build`

#### Option 2

1. Run `docker build -f docker/Dockerfile -t fuesim-digital .`

### Docker volumes / persistent data

- All important volumes are listed in [the docker-compose file](./docker-compose.yml).

### Docker ENVs

- All available Docker ENVs are listed with their default values in [.env.example](./.env.example) file. Copy this file and name it `.env` (under Linux, this would be e.g. `cp .env.example .env`)

## Before you commit

- We are using [prettier](https://prettier.io/) as our code formatter. Run it via `npm run prettier` or `npm run prettier:windows` in the root to format all files and make the CI happy. Please use the [vscode extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).
- We are using [eslint](https://eslint.org/) as our linter. Run it via `npm run lint:fix` in the root to lint (and auto fix if possible) all files. Please use the [vscode extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint).

## Debugging

There are already the following [debug configurations](https://code.visualstudio.com/docs/editor/debugging) for vscode saved:

- `Launch Frontend [Chrome]`
- `Launch Frontend [Firefox]` (You have to install an extra extension)
- `Debug Jest Tests`

In addition, you can make use of the following browser extensions:

- [Angular DevTools](https://chrome.google.com/webstore/detail/angular-devtools/ienfalfjdbdpebioblfackkekamfmbnh)

## Testing

### Migration tests

Whenever adding a new action or new state altering ui components (things that a user can use to alter the state in new ways) one should add exports of exercises in which the new features where tested to the [Public test scenarios](https://github.com/hpi-sam/fuesim-digital-public-test-scenarios)

The test scenarios are stored in a submodule. Use `--recurse-submodules` when cloning the repo or run `git submodule update --init --recursive` if you have cloned the repo already.

If you wish to run the migration tests use `npm run test:migration`

### Unit tests

We are using [Jest](https://jestjs.io/) for our unit tests.

You can run it during the development

- from the terminal via `npm run test:watch` in the root, `/shared`, `/backend` or `/frontend` folder
- or via the [recommended vscode extension](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest). **(Note: this option is currently broken)**

### End to end tests

We are using [cypress](https://www.npmjs.com/package/cypress) to run the end-to-end tests. You can find the code under `/frontend/cypress` in the repository.

#### Running the tests

To run the tests locally, it is recommended to use the vscode [task](https://code.visualstudio.com/docs/editor/tasks) `Start all & cypress`. Alternatively, you can start the frontend and backend manually and then run `npm run cy:open` in `/frontend`.

If you only want to check whether the tests pass, you can run `npm run cy:run` in `/frontend` instead.

## Benchmarking

You can run the benchmarks via `npm run benchmark` in the root folder.
Look at the [benchmark readme](./benchmark/README.md) for more information.

## Styleguide

- names are never unique, ids are
- A leading underscore should only be used
    - for private properties that may be used with getters/setters
    - to resolve certain naming conflicts (e.g. `.some(_item => ...)`)
- `dependencies` should be used for packages that must be installed when running the app (e.g. `express`), whereas `devDependencies` should be used for packages only required for developing, debugging, building, or testing (e.g. `jest`), which includes all `@types` packages. We try to follow this route even for the frontend and the backend, although it is not important there. See also [this](https://stackoverflow.com/a/22004559) answer on StackOverflow for more information about the differences.
- Use JSDoc features for further documentation because editors like VSCode can display them better.
    - Be aware that JSDoc comments must always go above the Decorator of the class/component/function/variable etc.
    ```ts
    /**
     * Here is a description of the class/function/variable/etc.
     *
     * @param myParam a description of the parameter
     * @returns a nice variable that is bigger than {@link myVariable}
     * @throws myError when something goes wrong
     */
    ```
- You should use the keyword `TODO` to mark things that need to be done later. Whether an issue should be created is an individual decision.
    - You are encouraged to add expiration conditions to your TODOs. Eslint will complain as soon as the condition is met. See [here](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/expiring-todo-comments.md) for more information.
    ```ts
    // TODO [engine:node@>=8]: We can use async/await now.
    // TODO [typescript@>=4.9]: Use satisfies https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator
    ```

## Releases

### Versions

Version numbers follow the pattern `${major}.${minor}.${patch}`. `major`, `minor` and `patch` are decimal numbers without leading zeroes, similar to [SemVer](https://semver.org/). But since we do not have a public API, we do not adhere to SemVer.  
The major version is updated for breaking changes, i.e. old state exports of configured exercises that have never been started, cannot be imported.  
The minor version is updated with every release on `main`. State exports of configured exercises from older minor versions that have never been started must successfully import and started exercises should be importable and behave consistently with older versions, although this is not strictly required.  
The patch versions is incremented if and only if critical issues on `main` are being fixed during a milestone.

Every time a part of the version number is updated, all numbers to the right are reset to zero.
For each new release, pull requests both to `main` and `dev` are created from the same `release/` branch. For scheduled releases, such PRs are created by the `Create Release PR` workflow.

### Workflows

With every significant PR into `dev`, the change must be briefly described in [CHANGELOG.md](./CHANGELOG.md). Pay attention to [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

The `Create Release PR` workflow accepts a new version number, updates the version in all relevant source files and moves the `Unreleased` section in [CHANGELOG.md](./CHANGELOG.md) to a release heading, creating a new `Unreleased` section. It then prepares two draft PRs, one into `dev` and one into `main` with these changes. They have to be marked as ready to run the pipeline and need approval. Merge them without rebase (use merge commit option).

Upon pushing to `main` or `dev`, GitHub Actions will build and push docker containers to Docker Hub tagged `latest` and `dev`. `latest` is additionally tagged with the current version number on `main` and a GitHub release is created.

## Architecture

This repository is a monorepo that consists of the following packages:

- [frontend](./frontend) the browser-based client application ([Angular](https://angular.io/))
- [backend](./backend) the server-side application ([NodeJs](https://nodejs.org/))
- [benchmark](./benchmark/) benchmarks and tests some parts of the application
- [shared](./shared) the shared code that is used by the frontend, backend and the benchmark package

Each package has its own `README.md` file with additional documentation. Please check them out before you start working on the project.

One server can host multiple _exercises_. Multiple clients can join an exercise. A client can only join one exercise at a time.

### State management and synchronization

This is a real-time application.

Each client is connected to the server via a [WebSocket connection](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API). This means you can send and listen for events over a two-way communication channel.
Via [socket.io](https://socket.io/docs) it is also possible to make use of a more classic request-response API via [acknowledgments](https://socket.io/docs/v4/emitting-events/#acknowledgements).

#### State, actions and reducers

We borrow these core concepts from [Redux](https://redux.js.org/).

##### What is an immutable JSON object?

A JSON object is an object whose properties are only the primitives `string`, `number`, `boolean` or `null` or another JSON object or an array of any of these (only state - no `functions`).
Any object reference can't occur more than once anywhere in a JSON object (including nested objects). This means especially that no circular references are possible.

[An immutable object is an object whose state cannot be modified after it is created](https://en.wikipedia.org/wiki/Immutable_object). In the code immutability is conveyed via typescripts [readonly](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties) and the helper type `Immutable<T>`.

##### State

A state is an immutable JSON object. Each client as well as the server has a global state for an exercise. The single point of truth for all states of an exercise is the server. All these states should be synchronized.

You can find the exercise state [here](./shared/src/state.ts).

##### Action

An action is an immutable JSON object that describes what should change in a state. The changes described by each action are [atomic](<https://en.wikipedia.org/wiki/Atomicity_(database_systems)>) - this means either all or none of the changes described by an action are applied.

Actions cannot be applied in parallel. The order of actions is important.

It is a bad practice to encode part of the state in the action (or values derived/calculated from it). Instead, you should only read the state in the accompanying reducer.

##### Reducer

A reducer is a [pure function](https://en.wikipedia.org/wiki/Pure_function) (no side effects!) that takes a state and an action of a specific type and returns a new state where the changes described in the action are applied. A state can only be modified by a reducer.

To be able to apply certain optimizations, it is advisable (but not necessary or guaranteed) that the reducer only changes the references of properties that have been changed.

You can find all exercise actions and reducers [here](./shared/src/store/action-reducers). Please orient yourself on the already implemented actions, and don't forget to register them in [shared/src/store/action-reducers/action-reducers.ts](shared/src/store/action-reducers/action-reducers.ts)

#### Immutability

It isn't necessary to copy the whole immutable object by value if it should be updated. Instead, only the objects that were modified should be shallow copied recursively. [Immer](https://immerjs.github.io/immer/) provides a simple way to do this.

Because the state is immutable and reducers (should) only update the properties that have changed, you can short circuit in comparisons between immutable objects, if the references of objects in a property are equal. Therefore it is very performant to compare two states in the same context.

To save a state it is enough to save its reference. Therefore it is very performant as well.
If the state would have to be changed, a new reference is created as the state is immutable.

#### Large values (WIP)

Large values (images, large text, binary, etc.) are not directly stored in the state. Instead, the store only contains UUIDs that identify the blob. The blob can be retrieved via a separate (yet to be implemented) REST API.

The blob that belongs to a UUID cannot be changed or deleted while the state is still saved on the server. To change a blob, a new one should be uploaded and the old UUID in the state replaced with the new one.

If an action would add a new blobId to the state, the blob should have previously been uploaded to the server.

A blob should only be downloaded on demand (lazy) and cached.

#### Synchronisation

1. A client gets a snapshot of the state from the server via `getState`.
2. Any time an action is applied on the server, it is sent to all clients via `performAction` and applied to them too. Due to the maintained packet ordering via a WebSocket and the fact that the synchronization of the state in the backend works synchronously, it is impossible for a client to receive actions out of order or receive actions already included in the state received by `getState`.
3. A client can propose an action to the server via `proposeAction`.
4. If the proposal was accepted, the action is applied on the server and sent to all clients via `performAction`.
5. The server responds to a proposal with a response that indicates a success or rejection via an [acknowledgment](https://socket.io/docs/v4/emitting-events/#acknowledgements). A successful response is always sent after the `performAction` was broadcasted.

#### Optimistic updates

A consequence of the synchronization strategy described before is that it takes one roundtrip from the client to the server and back to get the correct state on the client that initiated the action. This can lead to a bad user experience because of high latency.

This is where optimistic updates come into play. We just assume optimistically that the proposed action will be applied on the server. Therefore we can apply the action on the client directly without waiting for a `performAction` from the server.

If the server rejects the proposal or a race condition occurs, the client corrects its state again. In our case, the [optimisticActionHandler](./frontend/src/app/core/optimistic-action-handler.ts) encapsulates this functionality.

The state in the frontend is not guaranteed to be correct. It is only guaranteed to automatically correct itself.

If you need to read from the state to change it, you should do this inside the action reducer because the `currentState` passed into a reducer is always guaranteed to be correct.

#### Performance considerations

- Currently, every client maintains the whole state, and every action is sent to all clients. There is no way to only subscribe to a part of the state and only receive updates for that part.

## Licenses and Attributions

FüSim Digital

Copyright (C) 2021-2026 See [README.md#contributors](README.md#contributors) for authors/contributors (bottom of this document).

This program is free software: you can redistribute it and/or modify
it under the terms of the [GNU Affero General Public License](LICENSE.md) as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
[GNU Affero General Public License](LICENSE.md) for more details.

You should have received a copy of the [GNU Affero General Public License](LICENSE.md)
along with this program. If not, see <https://www.gnu.org/licenses/>.

Some files are excluded to the mentioned license, read [LICENSE-README.md](LICENSE-README.md) for further information to which files these apply.

Keep in mind, that if you don't use docker you have to run `npm run licensing:all` before building the `frontend` to give users the option to download a copy of the source code of this software (and a list of attributions of third-parties, e.g. their libraries) or use another way that lets users download the source code of this software for free. If you didn't modify the source code, a link to this github repository is enough, but you can do both. If you run `npm run deployment` this command is already included.

## Contributors

<!-- Inspired by https://github.com/all-contributors/all-contributors -->

<!-- markdownlint-disable -->
<table>
    <tr>
        <td style="text-align: center">
            <a href="https://github.com/fekoch">
                <img
                    src="https://avatars.githubusercontent.com/u/45557700?v=4"
                    width="100px;"
                />
                <br />
                <sub><b>Felix Koch</b></sub>
            </a>
            <br />
            <a
                href="https://github.com/hpi-sam/fuesim-digital/commits?author=fekoch"
                title="Code"
                >💻</a
            >
            <span title="Review">👀</span>
            <br />
            <small>Student 2025/26<small>
        </td>
        <td style="text-align: center">
            <a href="https://github.com/JohannesPotzi">
                <img
                    src="https://avatars.githubusercontent.com/u/119885768?v=4"
                    width="100px;"
                />
                <br />
                <sub><b>Johannes Potzi</b></sub>
            </a>
            <br />
            <a
                href="https://github.com/hpi-sam/fuesim-digital/commits?author=JohannesPotzi"
                title="Code"
                >💻</a
            >
            <span title="Review">👀</span>
            <br />
            <small>Student 2025/26<small>
        </td>
        <td style="text-align: center">
            <a href="https://github.com/Quixelation">
                <img
                    src="https://avatars.githubusercontent.com/u/58915890?v=4"
                    width="100px;"
                />
                <br />
                <sub><b>Robert Stündl</b></sub>
            </a>
            <br />
            <a
                href="https://github.com/hpi-sam/fuesim-digital/commits?author=Quixelation"
                title="Code"
                >💻</a
            >
            <span title="Review">👀</span>
            <br />
            <small>Student 2025/26<small>
        </td>
        <td style="text-align: center">
            <a href="https://github.com/hansegucker">
                <img
                    src="https://avatars.githubusercontent.com/u/24552951?v=4"
                    width="100px;"
                />
                <br />
                <sub><b>Jonathan Weth</b></sub>
            </a>
            <br />
            <a
                href="https://github.com/hpi-sam/fuesim-digital/commits?author=hansegucker"
                title="Code"
                >💻</a
            >
            <span title="Review">👀</span>
            <br />
            <small>Student 2025/26<small>
        </td>
        </tr>
    <tr>
    <td style="text-align: center">
            <a href="https://github.com/Greenscreen23">
                <img
                    src="https://avatars.githubusercontent.com/u/43916057?v=4"
                    width="100px;"
                />
                <br />
                <sub><b>Lukas Hagen</b></sub>
            </a>
            <br />
            <a
                href="https://github.com/hpi-sam/fuesim-digital/commits?author=Greenscreen23"
                title="Code"
                >💻</a
            >
            <span title="Review">👀</span>
            <br />
            <small>Student 2022/23<small>
        </td>
        <td style="text-align: center">
            <a href="https://github.com/Nils1729">
                <img
                    src="https://avatars.githubusercontent.com/u/45318774?v=4"
                    width="100px;"
                />
                <br />
                <sub><b>Nils Hanff</b></sub>
            </a>
            <br />
            <a
                href="https://github.com/hpi-sam/fuesim-digital/commits?author=Nils1729"
                title="Code"
                >💻</a
            >
            <span title="Review">👀</span>
            <br />
            <small>Student 2022/23<small>
        </td>
        <td style="text-align: center">
            <a href="https://github.com/benn02">
                <img
                    src="https://avatars.githubusercontent.com/u/82985280?v=4"
                    width="100px;"
                />
                <br />
                <sub><b>Benildur Nickel</b></sub>
            </a>
            <br />
            <a
                href="https://github.com/hpi-sam/fuesim-digital/commits?author=benn02"
                title="Code"
                >💻</a
            >
            <span title="Review">👀</span>
            <br />
            <small>Student 2022/23<small>
        </td>
        <td style="text-align: center">
            <a href="https://github.com/lukasrad02">
                <img
                    src="https://avatars.githubusercontent.com/u/49586507?v=4"
                    width="100px;"
                />
                <br />
                <sub><b>Lukas Radermacher</b></sub>
            </a>
            <br />
            <a
                href="https://github.com/hpi-sam/fuesim-digital/commits?author=lukasrad02"
                title="Code"
                >💻</a
            >
            <span title="Review">👀</span>
            <br />
            <small>Student 2022/23<small>
        </td>
        </tr><tr>
        <td style="text-align: center">
            <a href="https://github.com/Dassderdie">
                <img
                    src="https://avatars.githubusercontent.com/u/18506183?v=4"
                    width="100px;"
                />
                <br />
                <sub><b>Julian Schmidt</b></sub>
            </a>
            <br />
            <a
                href="https://github.com/hpi-sam/fuesim-digital/commits?author=Dassderdie"
                title="Code"
                >💻</a
            >
            <span title="Review">👀</span>
            <br />
            <small>Student 2021/22<small>
        </td>
        <td style="text-align: center">
            <a href="https://github.com/ClFeSc">
                <img
                    src="https://avatars.githubusercontent.com/u/68013019?v=4"
                    width="100px;"
                />
                <br />
                <sub><b>Clemens Schielicke</b></sub>
            </a>
            <br />
            <a
                href="https://github.com/hpi-sam/fuesim-digital/commits?author=ClFeSc"
                title="Code"
                >💻</a
            >
            <span title="Review">👀</span>
            <br />
            <small>Student 2021/22<small>
        </td>
        <td style="text-align: center">
            <a href="https://github.com/hpistudent72">
                <img
                    src="https://avatars.githubusercontent.com/u/64257074?v=4"
                    width="100px;"
                />
                <br />
                <sub><b>Florian Krummrey</b></sub>
            </a>
            <br />
            <a
                href="https://github.com/hpi-sam/fuesim-digital/commits?author=hpistudent72"
                title="Code"
                >💻</a
            >
            <br />
            <small>Student 2021/22<small>
        </td>
        <td style="text-align: center">
            <a href="https://github.com/anonym-HPI">
                <img
                    src="https://avatars.githubusercontent.com/u/68286419?v=4"
                    width="100px;"
                />
                <br />
                <sub><b>Marvin Müller-Mettnau</b></sub>
            </a>
            <br />
            <a
                href="https://github.com/hpi-sam/fuesim-digital/commits?author=anonym-HPI"
                title="Code"
                >💻</a
            >
            <span title="Deployment">📦</span>
            <br />
            <small>Student 2021/22<small>
        </td>
        </tr><tr>
        <td style="text-align: center">
            <a href="https://github.com/mbarkowsky">
                <img
                    src="https://avatars.githubusercontent.com/u/7481705?v=4"
                    width="100px;"
                />
                <br />
                <sub><b>Matthias Barkowsky</b></sub>
            </a>
            <br />
            📆
            <br />
            <small>Supervisor 2021-26</small>
        </td>
        <td style="text-align: center">
            <a href="https://github.com/christianschaeffer">
                <img
                    src="https://avatars.githubusercontent.com/u/4678160?v=4"
                    width="100px;"
                />
                <br />
                <sub><b>Christian Schäffer</b></sub>
            </a>
            <br />
            📆
            <br />
            <small>Supervisor 2021-26<small>
        </td>
        <td style="text-align: center">
            Cristian Pasca
            <br />
            💻
            <br />
            <small>Contributor <a href="https://github.com/hpi-sam/fuesim-digital/pull/1109">#1109</a><small>
        </td>
        <td style="text-align: center">
            Konstantin Ebeling
            <br />
            💻
            <br />
            <small>Contributor <a href="https://github.com/hpi-sam/fuesim-digital/pull/1109">#1109</a><small>
        </td>
    </tr>
    <tr>
        <td style="text-align: center">
            Jan Berndt
            <br />
            👀
            <br />
            <small>Reviewer <a href="https://github.com/hpi-sam/fuesim-digital/pull/1109">#1109</a><small>
        </td>
        <td style="text-align: center">
            <a href="https://github.com/Tim-08">
                <img
                    src="https://avatars.githubusercontent.com/u/64322264?v=4?v=4"
                    width="100px;"
                />
                <br />
                <sub><b>Tim Siemer</b></sub>
            </a>
            <br />
            💻
            <br />
            <small>Student 2025<small>
        </td>
        <td style="text-align: center">
            <a href="https://github.com/CmdShiftMarkus">
                <img
                    src="https://avatars.githubusercontent.com/u/58256184?v=4"
                    width="100px;"
                />
                <br />
                <sub><b>CmdShiftMarkus</b></sub>
            </a>
            <br />
            💻
            <br />
            <small>Student 2025<small>
        </td>
            <td style="text-align: center">
            <a href="https://github.com/polarfuchs23">
                <img
                    src="https://avatars.githubusercontent.com/u/73428431?v=4"
                    width="100px;"
                />
                <br />
                <sub><b>polarfuchs23</b></sub>
            </a>
            <br />
            💻
            <br />
            <small>Student 2025<small>
        </td>
    </tr>
</table>
<!-- markdownlint-restore -->
