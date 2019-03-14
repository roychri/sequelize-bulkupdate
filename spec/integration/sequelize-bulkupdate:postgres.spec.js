const { PG_DB, PG_HOST, PG_USER, PG_PASSWORD, DIALECT = "postgres" } = require( '../env' );
const sequelizeUpdate = require( '../../index' );
const Sequelize = require( 'sequelize' );
const { v4: uuid } = require( 'uuid' );



describe( 'sequelizeBulkUpdate', () =>
{

    beforeEach( async () =>
    {
        Visitor = sequelize.define( `Visitor-${ uuid() }`, {
            name: Sequelize.STRING,
            ticketnumber: Sequelize.DOUBLE,
        });
        await sequelize.sync();
        sequelizeUpdate( Visitor );
    });

    afterEach( async () =>
    {
        await Visitor.drop();
    });

    /**
     * @type { Sequelize.Model<any, { name: {}, ticketnumber: {} }> }
     */
    let Visitor;

    const sequelize = new Sequelize({
        password: PG_PASSWORD,
        username: PG_USER,
        dialect: DIALECT,
        database: PG_DB,
        host: PG_HOST,
    });

    it( 'hehe', () =>
    {
        console.log( '...' );
    });

});
