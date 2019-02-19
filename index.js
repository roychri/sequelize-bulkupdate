const Sequelize = require('sequelize');

module.exports = function init(target) {

    const isModel = target instanceof Sequelize.Model ||
          Sequelize.Model.isPrototypeOf(target);
    if (!isModel && !target.QueryTypes && !target.Model) {
        throw new Error(
            'sequelize-pg-bulkupdate(target) : ',
            'target must be a sequelize model or the Sequelize object.'
        );
    } else if (target.Model) {
        target = target.Model;
    }
    attachFunctions(target);
};

function attachFunctions(target) {

    target.bulkUpdate = bulkUpdate;

}

/**
 * Function attached to the models
 */
function bulkUpdate(values, options = {}) {

    if (this.sequelize.options.dialect != 'postgres') {
        throw new Error(
            'bulkUpdate() only works with postgres dialect.'
        );
    }
    const tableName = this.getTableName();
    const attributes = this.rawAttributes;
    const replacements = values.reduce((acc,d) => {
        for (const key in d) {
            const val = d[key];
            acc[key] = acc[key] || [];
            acc[key].push(val);
        }
        return acc;
    }, {});
    const sql = sqlForBulkUpdate(tableName, values, options, attributes, this);

    return this.sequelize.query(sql, {
        type: Sequelize.QueryTypes.UPDATE,
        replacements
    });
}

/**
 * Generate the SQL for the bulk update.
 */
function sqlForBulkUpdate(tableName, values, options, attributes, model) {

    const primaryKey = options.key || model.primaryKeyAttribute;
    const quotedTableName = model.QueryGenerator.quoteTable(tableName);
    const fields = Object.keys(attributes).reduce((acc,k) => {
        const a = attributes[ k ];
        if (a.primaryKey) return acc;
        if (!a._modelAttribute) return acc;
        if (a.fieldName == primaryKey) return acc;
        if (options.fields && !options.fields.includes(a.fieldName))
            return acc;
        acc.push(a.fieldName);
        return acc;
    }, [] );
    let updateValues = [];
    for (let field of fields) {
        updateValues.push(`"${field}" = "data_table"."${field}"`);
    }
    let selects = [
        `UNNEST(array[:${primaryKey}]) as ${primaryKey}`
    ];
    for (const field of fields) {
        selects.push(`UNNEST(array[:${field}]) as ${field}) as "data_table"`);
    }

    let sql = `UPDATE ${quotedTableName} `;
    sql += `SET ${updateValues.join(', ')} FROM `;
    sql += `(SELECT ${selects.join(', ')} `;
    let where = `${quotedTableName}."${primaryKey}" = "data_table"."${primaryKey}"`;
    sql += `WHERE ${where}`;

    return sql;
}
