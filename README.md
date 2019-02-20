# Sequelize bulkUpdate

> **WARNING: This only works for POSTGRESQL at the moment. Patches are welcome**

This module allow one person to update many rows at once, each having different values to update.

## The Problem
Sequelize currently support bulk updating only when you have a bunch of rows that you want to update to the same value.

```js
User.update({
    yearly_salary: 200000
}, {
    where: {
        company: 'Google',
        is_programmer: true
    }
});
```

This will find all the developers at google and set their yearly salary to 200k. It does update more than one row but all of them will have the same column updated to the same value.

But what if you have an array like this:

```js
const salaryUpdates = [
    {id: 3446, yearly_salary: 200000},
    {id: 7346, yearly_salary: 210000},
    {id: 2357, yearly_salary: 250000},
    {id: 54, yearly_salary: 600000},
];
```

Traditionnaly with Sequelize, you would have to loop thru that and update them one by one. Each update would generate a different SQL update query. It's not so bad when you have only 4, but what if you have 600k rows to update? Sending 600k update queries to the DB will cause lots of network traffic, will cause lots of transactions and will take some time.

## The solution

PostgreSQL allow us to update many rows in a **single** SQL query.

As described on this [StackOverflow answer](https://stackoverflow.com/a/20224370/1260068), you can do something like this:

```sql
UPDATE users SET yearly_salary = data_table.yearly_salary
from
(
    SELECT UNNEST(array[3446,7346,2357,54]) AS id, 
           UNNEST(array[200000,210000,250000,600000]) AS yearly_salary
) AS data_table
WHERE users.id = data_table.id;
```

This module exploits this method of bulk updating in order to update 600k rows by doing let's say 1k at a time (rather than one by one).

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
