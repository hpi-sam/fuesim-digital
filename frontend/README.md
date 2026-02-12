# Frontend

This is an [angular](https://angular.io/) application. It doesn't run standalone but requires the built code from [shared](../shared) at build time and a working [backend](../backend) at runtime.

Please look in the [root readme](../README.md) for general information about how to start and develop the whole application.

### Code scaffolding

You can either use the [Angular CLI](https://angular.io/cli):

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|guard|module|web-worker`.

Or an extension:
[Angular Schematics (vscode)](https://marketplace.visualstudio.com/items?itemName=cyrilletuzi.angular-schematics).

## Environments

You can build the application with different [application environments](https://angular.io/guide/build).

Keep in mind that it is also possible to add a [proxy](https://angular.io/guide/build#proxying-to-a-backend-server) during development if you want to change e.g. the backend URL.

## Style guide

### CSS

- We are using [Bootstrap](https://getbootstrap.com) as a style framework.
- Where should I put my CSS? (Guideline)
    1. Use Bootstrap classes whenever possible (look at the [utility classes](https://getbootstrap.com/docs/5.0/utilities/api/)).
    2. If you can reuse the styling, add a class to the [style.scss](./src/styles.scss) (or the components SCSS if it's only used there).
    3. If the styling is custom and only applicable to one specific element, use inline CSS.
    4. If the inline styling is very big, complicated, or makes use of any SCSS or advanced CSS not applicable to inline styles, put it into the components SCSS file.
    - See also [Bootstraps best practices](https://getbootstrap.com/docs/5.0/extend/approach/#summary).

### Templates

- Order of attributes in the Angular templates
    - As long as eslint doesn't have [a lint rule for it](https://github.com/angular-eslint/angular-eslint/pull/605) it is just encouraged to use the following order of attributes.
    1. Structural directive (e.g. `*ngIf`)
    2. Template reference (e.g. `#myId`)
    3. Component inputs (e.g. `[myInput]`)
    4. Two way binding/banana in the box (e.g. `[(myBanana)]`)
    5. Outputs (e.g. `(onChange)`)
    6. Directives (e.g. `[myDirective]`, `[class.my_class]`, `[ngStyle]`, `[attr.myAttr]`)
    7. `class` attribute
    8. `style` attribute
    9. Other attributes (e.g. `href`, `type`)

## Libraries

- [Bootstrap](https://getbootstrap.com) - A styling framework
    - [Documentation](https://getbootstrap.com/docs)
    - [Cheatsheet](https://getbootstrap.com/docs/5.1/examples/cheatsheet/)
- [Bootstrap-icons](https://icons.getbootstrap.com/) - the icons we use in the application
    - [List of all icons](https://icons.getbootstrap.com/#icons)
    - We import the `.css`. Use it like `<i class="bi-alarm"></i>`
- [ngBootstrap](https://ng-bootstrap.github.io/) - Angular components for bootstrap
    - [Documentation](https://ng-bootstrap.github.io/#/components/accordion/examples)
- [openlayers](https://openlayers.org/) - A library for displaying maps
    - [Introduction](https://openlayers.org/workshop/en/)
    - [API docs](https://openlayers.org/en/latest/apidoc/)
    - [Examples](https://openlayers.org/en/latest/examples/)
- [lodash-es](https://lodash.com/) - A utility library for common JS tasks
    - [Documentation](https://lodash.com/docs)
- [rxjs](https://rxjs-dev.firebaseapp.com/) - A library for reactive programming (= observer pattern on steroids)
    - [Glossar](https://rxjs-dev.firebaseapp.com/guide/glossary-and-semantics)
    - [Operator Decision Tree](https://rxjs-dev.firebaseapp.com/operator-decision-tree)
    - [Operators](https://rxjs.dev/api?query=operators)
- [NGRX](https://ngrx.io/) - A library for state management

## Architecture

For most, the frontend follows the [project file structure dictated by angular](https://angular.io/guide/file-structure).

We call Angular components, pipes, directives, services, and modules "Angular elements".

In [src/app/state](./src/app/state) are all actions, reducers, selectors and state that are used by [NGRX](https://ngrx.io/).

In `src/app` and every descending folder, the following guidelines apply:

- `/core`:
    - Singleton-services and route guards that can be used by all other Angular elements that are direct or indirect children of the `core`'s parent-folder
- `/shared`:
    - Utility Angular elements as well as classes, functions, types, etc. that (can) have multiple instances and can be used by all other Angular elements that are direct or indirect children of the `shared`'s parent-folder
    - Every folder with Angular components, pipes, or directives in a `shared`-folder should have its own module, that exports these Angular elements
- `/features`
    - Components/pipes/directives that should only be used in the `/pages`-folder at the same level (in opposite to `/shared` no nested folders)
- `/pages`:
    - All Angular elements and utilities that are only used according to the route (-> lazy loading)

Commonly used [selectors](https://ngrx.io/guide/store/selectors) should go in [./src/app/state/application/selectors](./src/app/state/application/selectors/).

You can assume that the Store has the current exercise state (either of a live exercise or an exercise in time travel) if you are in `src/app/pages/exercises/exercise`. We use [route guards](https://angular.io/guide/router-tutorial-toh#canactivate-requiring-authentication) for this.

If you want to modify the exercise state, do not do it via [reducers](https://ngrx.io/guide/store/reducers) in the store, but propose an action (optimistically) via the [ExerciseService](./src/app/core/exercise.service.ts). The action will automatically be applied to the store.

If you want to switch between time travel, live exercise and no exercise (e.g. on the landing page), use the [ApplicationService](./src/app/core/application.service.ts).

By default, we don't use `ChangeDetectionStrategy.OnPush` because it complicates the code and increases the skill level needed to work with the code while providing a mostly negligible performance benefit.
For the same reason, there are also no optimizations made regarding how often the change detection is triggered by zones. E.g. OpenLayers runs inside the zone and therefore triggers the change detection on every `pointermove`- and `requestAnimationFrame`-event ([which are also patched by zone.js](frontend\src\polyfills.ts)). Read the angular documentation [regarding change detection](https://angular.io/guide/change-detection) for more information.

### Exercise map

You can find the exercise map in [src/app/pages/exercises/exercise/shared/exercise-map](src/app/pages/exercises/exercise/shared/exercise-map).

- `element`: The data that represents a `Material`, `Personnel`, `Vehicle`, etc. that is saved in the state.
- `feature`: The OpenLayers feature representing an element and is rendered on the map canvas.

The [ExerciseMapComponent](src/app/pages/exercises/exercise/shared/exercise-map/exercise-map.component.ts) is the Angular component that provides the canvas on which the map should be rendered.

The [OlMapManager](src/app/pages/exercises/exercise/shared/exercise-map/utility/ol-map-manager.ts) manages all the OpenLayers stuff and renders the map on the canvas.
The map consists of different layers. Each layer only displays one kind of element. How an element in this layer should be rendered and what interactions are possible is defined in the [specific ElementFeatureManagers](src/app/pages/exercises/exercise/shared/exercise-map/feature-managers).
The feature managers for features that should be moveable by the user extend [MoveableFeatureManager](src/app/pages/exercises/exercise/shared/exercise-map/feature-managers/moveable-feature-manager.ts), which is the central point for all movement logic.
They have a custom API that allows reacting to changes in an element ([ElementManager](src/app/pages/exercises/exercise/shared/exercise-map/feature-managers/element-manager.ts)) and an API that allows for interaction with other elements via the OlMapManager ([FeatureManager](src/app/pages/exercises/exercise/shared/exercise-map/utility/feature-manager.ts)).

## Action proposals

As described in the [root README.md](../README.md), we use actions to propose changes.
Such actions can be proposed optimistically.
Note that the described synchronization mechanisms only make sure that the states between the clients and the server are in sync. In addition, it must be guaranteed that the UI is always in sync with the current state in the store. While Angular deals with this, for the most part, the OpenLayers implementation doesn't do this by default. Therefore, desynchronization is possible when, e.g., dragging an element. To fix this, the respective proposals should be optimistic.
See [#298](https://github.com/hpi-sam/fuesim-digital/issues/298) in this context.
