# Overview over the backend

## Environment Variables

A [`.env.example`](../.env.example) file is provided, containing the default values for all environment variables (where such defaults exist).
To use them, copy the file to a new file called `.env` in the same directory. You can adjust the variables there for your own needs. This file is excluded from Git to not share any sensitive information one might store in environment variables.
To use other values during automated tests, you can append `_TESTING` to a variable, which will then be preferred over the non-`_TESTING` variable.
For a more detailed view please look at the [`Config`](src/config.ts).

## Components

### `index.ts`

When starting, the `index.ts` is executed. It establishes a database connection and creates a `FuesimServer`, which automatically starts the application.

### `FuesimServer`

The `FuesimServer` is a class responsible for starting and stopping both the webserver (`ApiHttpServer`) and the websocket server (`ExerciseWebsocketServer`) parts of the backend.
Both servers use `express` as the underlying architecture.

### `ApiHttpServer`

The webserver is responsible for all HTTP API requests.
The webserver sets up all available routes in its routers. The methods doing the actual work for the routes are called there.
These routers are located in [`src/routers`](src/routers) and structured in files.
All routes served by this server should be prefixed by `/api/`.

It listens on port `3201` by default (`13201` during tests).

### `ExerciseWebsocketServer`

The websocket server is used for websocket communication using [`socket.io`](https://socket.io/) between the backend and the connected clients.
It serves the most important role in both storing the exercise state and synchronizing it across the clients.
The handlers for incoming messages are defined in [`src/exercise/websocket-handler`](src/exercise/websocket-handler). Each message (as defined in `shared`) gets its own file.
They are registered in [`src/exercise/websocket.ts`](src/exercise/websocket.ts) when the client connects.

The websocket server listens on port `3200` by default (`13200` during tests).

### Storing clients

When a new client connects to the websocket, a [`ClientWrapper`](src/exercise/client-wrapper.ts) gets created for it, where the connection between the socket, the eventually selected exercise, and the exercise object representing this client is stored.
These client wrappers get added to the [`clientMap`](src/exercise/client-map.ts).

### Storing Exercises

When an exercise gets created an [`ExerciseWrapper`](src/exercise/exercise-wrapper.ts) gets created for it, where the current state, the state history, and the set of connected `ClientWrappers` gets stored.
Its main purpose is the `reduce` method, allowing an `ExerciseAction` to be applied to the current state while also storing the old state in the history. For more information on the state management see the [root Readme](../README.md#state-management-and-synchronisation).

### Database

We are using [PostgreSQL 18](https://www.postgresql.org/) for persistence with [Drizzle](https://orm.drizzle.team) as an in-between layer for interaction with the database.

The credentials and other parameters of the database must match the [`.env` file in the root directory](../.env).

#### Start the database

There are two main ways to start the database:

##### Option 1 using `docker compose` (recommended)

There are database configurations both for [development](./../docker-compose.yml) and [production](./../docker-compose.prod.yml) based on `docker compose`.
For production, it is necessary to adjust the `.env` file and to generate safe secrets. How to run the database for development is described [here](./../README.md#development-usage).

##### Option 2 using PostgreSQL directly

You can also [install PostgreSQL 18 from the official page](https://www.postgresql.org/download/). However, this is untested and not supported by us. If you have any further questions refer to official sources for PostgreSQL, e.g. the [documentation](https://www.postgresql.org/docs/).

#### `npm` scripts

Use `npm run migration:run` to apply all pending migrations and `npm run migration:generate -- --name <name>` to generate a new migration from the current changes between the models defined in code and present in the database.

You can use `npm run db:purge` to remove all elements from the database.

#### Without a database

If you want to, you can also disable the database.
Set the environment variable `DFM_USE_DB` (in [`../.env`](../.env)) to `false` to achieve this.
Note however that this results in a) all history being saved in memory instead of on disk, and b) once the backend exits, for whatever reason, all data is gone forever.

### Authentication

For authentication, the FüSim Digital uses [OpenID Connect (OIDC)](https://openid.net/developers/how-connect-works/). Therefore, a properly configured OIDC provider is needed. For development, an [Authelia](https://www.authelia.com/) can be started using `docker composes` as described [here](./../README.md#development-usage). For production, we recommend to set up a [Keycloak](https://www.keycloak.org/) instance or a similar Identity and Access Management (IAM) solution with OIDC support.
The OIDC details then can be configured in the `.env` file.

### Note on long term storage

An average exercise with four sections being actively played and about 45 minutes of exercise time seems to take up about 10 MB of storage in the database.
This is not much in itself, but if many exercises of this size are run each day, it can scale quickly.
Also, note that there can never be more than 10,000 exercises because then the id generator fails.

Therefore, anonymous, unused exercises automatically get deleted after a certain amount of time (per default 30 days, configurable via `DFM_AUTO_DELETE_DAYS`).
Exercises that are templates, part of a parallel exercise, or stored in a user account won't get deleted automatically.
