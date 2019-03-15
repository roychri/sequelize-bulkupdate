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
            ticket: Sequelize.BIGINT,
        });
        await sequelize.sync();
        sequelizeUpdate( Visitor );
    });

    afterEach( async () =>
    {
        await Visitor.drop();
    });

    /**
     * @type { Sequelize.Model<any, { name: string, ticket: number }> }
     */
    let Visitor;

    const sequelize = new Sequelize({
        password: PG_PASSWORD,
        username: PG_USER,
        dialect: DIALECT,
        database: PG_DB,
        host: PG_HOST,
    });

    it( 'update in bulk', async () =>
    {
        const key = 'ticket';
        const returning = true;
        const names = [ ...Array( 15 ) ].map( () => uuid() );
        const visitors = ( await Visitor.bulkCreate( names.map( () =>
            ({ name: uuid(), ticket: getUN() }) ), { returning }) ).map( ({ dataValues }) => dataValues );

        await Visitor.bulkUpdate( visitors.map( ({ ticket }, index ) => ({ ticket, name: names[ index ] }) ), { key });

        const BULK_UPDATED = ( await Visitor.findAll({ where: { id: visitors.map( ({ id }) => id ) } }) ).map( visitor =>
            [ visitor, visitors.findIndex( ({ id }) => id === visitor.id ) ] ).map( ([ visitor, index ]) =>
                [ visitor, visitors[ index ], names[ index ] ]).every( ([
                    { id, name, ticket }, { id: _id, name: _name, ticket: _ticket }, namex
                ]) => +_id === +id && +_ticket === +ticket && _name !== name && name === namex );

        expect( BULK_UPDATED ).toBe( true );
    });

});

function getUN()
{
    return +`${ Math.random() }`.slice( 2 );
}
