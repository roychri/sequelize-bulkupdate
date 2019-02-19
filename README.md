# Sequelize PostgreSQL bulkUpdate

## Installation

```sh
npm install sequelize-pg-bulkupdate
```

## Activation

### Globally

To activate the plugin for all your models, call the plugin on your `sequelize` instance:

```js
const Sequelize = require('sequelize');
const bulkUpdate = require('sequelize-pg-bulkupdate');
bulkUpdate(Sequelize);
```

### Per Model

To activate the plugin on specific models, call the plugin on the models:

```js
const bulkUpdate = require('sequelize-pg-bulkupdate');
const Model = sequelize.define('Model', { /* model definition */ });
bulkUpdate(Model);
```


## Usage

`Model.bulkUpdate(values[, options])`

* **values**: <array>(Required) List of values to update with the key (primary key or othwerwise)
* **options**: <object>(Optional)
* **options.key** <string> The name of the field to use as the key to match the rows to update. default: `id`
* **options.fields**: <array> The list of fields to update when `values` contains more field than needed.

### By ID

To use bulkUpdate by row id, just pass the array of values to update with their id.

```js
const values = [
    {id: 1, age: 19},
    {id: 2, age: 28},
    {id: 3, age: 37},
    {id: 4, age: 46}
]
Model.bulkUpdate(values);
```

### By a custom key

To use bulkUpdate by some other key, add the `key` in the options.

```js
const values = [
    {name: 'keith',  age: 49},
    {name: 'leslie', age: 38},
    {name: 'bexley', age: 27},
    {name: 'casey',  age: 16}
];
Model.bulkUpdate(values, {key: 'name'});
```

### Only specific fields

To use bulkUpdate with extra data that you do not want to be updated, add the `fields` in the options.

```js
const values = [
    {name: 'keith',  age: 49, phone: 4085551111},
    {name: 'leslie', age: 38, phone: 4085552222},
    {name: 'bexley', age: 27, phone: 4085553333},
    {name: 'casey',  age: 16, phone: 4085554444}
];
Model.bulkUpdate(values, {key: 'name', fields: ['age']});
```
