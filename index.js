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
    if ( values.length == 0 ) return Promise.resolve();
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
        if (!Object.keys(values[0]).includes(a.fieldName)) return acc;
        acc.push(a.fieldName);
        return acc;
    }, [] );
    let updateValues = [];
    for (let field of fields) {
        updateValues.push(`"${field}" = "data_table"."${field}"`);
    }
    const type = attributes[primaryKey].type.toSql();
    let selects = [
        `UNNEST(array[:${primaryKey}])::${type} as ${primaryKey}`
    ];
    for (const field of fields) {
        const type = attributes[field].type.toSql();
        selects.push(`UNNEST(array[:${field}])::${type} as ${field}`);
    }

    let sql = `UPDATE ${quotedTableName} `;
    sql += `SET ${updateValues.join(', ')} FROM `;
    sql += `(SELECT ${selects.join(', ')}) as "data_table" `;
    let where = `${quotedTableName}."${primaryKey}" = "data_table"."${primaryKey}"`;
    sql += `WHERE ${where}`;

    return sql;
}
