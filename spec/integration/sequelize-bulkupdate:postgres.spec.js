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
        const names = [ ...Array( 15 ) ].map( () => uuid() );
        const visitors = ( await Visitor.bulkCreate(
            names.map( () => ({ name: uuid(), ticket: getUN() }) ),
            { returning: true }) ).map( ({ dataValues }) => dataValues );

        await Visitor.bulkUpdate( visitors.map(
            ({ ticket }, index) => ({ ticket, name: names[index] })), { key: 'ticket' });

        const updated = await Visitor.findAll({ where: { id: visitors.map( ({ id }) => id ) } });
        const EACH_UPDATE = updated.map( updated => [ visitors.find( ({ id }) => id == updated.id ), updated ])
            .every( ([ { id, name, ticket }, { id: uid, name: uname, ticket: uticket }]) =>
                id === id && +ticket === +uticket && name !== uname )

        expect( EACH_UPDATE ).toBe( true );
    });

});

function getUN()
{
    return +`${ Math.random() }`.slice( 2 );
}
