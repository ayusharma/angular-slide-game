# `angular-module-boilerplate` — the simple scaffloding for a module
This project is an application skeleton for a typical angular module. You can use it
to quickly bootstrap your angular modules.

## Getting Started

To get you started you can simply clone the `angular-module-boilerplate` repository and install the dependencies:

### Prerequisites

#### Clone `angular-module-boilerplate`

Clone the `angular-module-boilerplate` repository using git:

```
git clone https://github.com/ayusharma/angular-module-boilerplate.git
cd angular-module-boilerplate
```

If you just want to start a new project without the `angular-module-boilerplate` commit history then you can do:

```
git clone --depth=1 https://github.com/ayusharma/angular-module-boilerplate.git <your-project-name>
```

The `depth=1` tells git to only pull down one commit worth of historical data.

### Install Dependencies

We have preconfigured `npm` to automatically run `bower` so we can simply do:

```
npm install
```

Behind the scenes this will also call `bower install`. After that, you should find out that you have
two new folders in your project.

* `node_modules` - contains the npm packages for the tools we need
* `demo/bower_components` - contains the Angular framework files

###  Building Module

```js
  gulp build
```
