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

    describe( 'update in bulk', () =>
    {

        it( 'by id (default)', async () =>
        {
            const returning = true;
            const tickets = [ ...Array( 2 ) ].map( () => getUN() );
            const visitors = ( await Visitor.bulkCreate( tickets.map( () =>
                ({ name: uuid(), ticket: getUN() }) ), { returning }) ).map( ({ dataValues }) => dataValues );

            await Visitor.bulkUpdate( visitors.map( ({ id }, index ) => ({ id, ticket: tickets[ index ] }) ));

            const BULK_UPDATED = ( await Visitor.findAll({ where: { id: visitors.map( ({ id }) => id ) } }) ).map( visitor =>
                [ visitor, visitors.findIndex( ({ id }) => id === visitor.id ) ] ).map( ([ visitor, index ]) =>
                    [ visitor, visitors[ index ], tickets[ index ] ]).every( ([
                        { id, name, ticket }, { id: _id, name: _name, ticket: _ticket }, ticketx
                    ]) => +_id === +id && _name === name && +_ticket !== +ticket && +ticket === +ticketx );

            expect( BULK_UPDATED ).toBe( true );
        });

        it( 'by custom key', async () =>
        {
            const key = 'ticket';
            const returning = true;
            const names = [ ...Array( 2 ) ].map( () => uuid() );
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

        it( 'only specific fields', async () =>
        {
            const LENGTH = 2;
            const returning = true;
            const fields = [ 'ticket' ];
            const names = [ ...Array( LENGTH ) ].map( () => uuid() );
            const tickets = [ ...Array( LENGTH ) ].map( () => getUN() );
            const visitors = ( await Visitor.bulkCreate( names.map( () =>
                ({ name: uuid(), ticket: getUN() }) ), { returning }) ).map( ({ dataValues }) => dataValues );

            await Visitor.bulkUpdate( visitors.map( ({ id }, index ) => ({ id, ticket: tickets[ index ], name: names[ index ] }) ), { fields });

            const BULK_UPDATED = ( await Visitor.findAll({ where: { id: visitors.map( ({ id }) => id ) } }) ).map( visitor =>
                [ visitor, visitors.findIndex( ({ id }) => id === visitor.id ) ] ).map( ([ visitor, index ]) =>
                    [ visitor, visitors[ index ], tickets[ index ] ]).every( ([
                        { id, name, ticket }, { id: _id, name: _name, ticket: _ticket }, ticketx
                    ]) => +_id === +id && _name === name && +_ticket !== +ticket && +ticket === +ticketx );

            expect( BULK_UPDATED ).toBe( true );
        });

        it( 'return updated values if { returning: true } option is provided', async () =>
        {
            const returning = true;
            const tickets = [ ...Array( 2 ) ].map( () => getUN() );
            const initials = tickets.map( () => ({ name: uuid(), ticket: getUN() }) );
            const persisted = ( await Visitor.bulkCreate( initials, { returning }) ).map( ({ dataValues }) => dataValues );
            const differences = persisted.map( ({ id }, index ) => ({ id, ticket: tickets[ index ] }) );
            const [ updates ] = await Visitor.bulkUpdate( differences, { returning });

            for ( let i = 0, l = persisted.length, ticket, current, updated; i < l; i++ ) {
                current = persisted[ i ];
                updated = updates.find( ({ id }) => id === current.id );
                ticket = tickets[ initials.findIndex( ({ name }) => name === current.name ) ];

                expect( updated.id ).toBe( current.id );
                expect( +updated.ticket ).toBe( +ticket );
                expect( updated.name ).toBe( current.name );
                expect( +updated.ticket ).not.toBe( +current.ticket );
            }
        });

    });

});

function getUN()
{
    return +`${ Math.random() }`.slice( 2 );
}
