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
            const LENGTH = 2;
            const returning = true;
            const names = [ ...Array( LENGTH ) ].map( () => uuid() );
            const tickets = [ ...Array( LENGTH ) ].map( () => getUN() );
            const initials = [ ...Array( LENGTH ) ].map( () => ({ name: uuid(), ticket: getUN() }) );
            const persisted = ( await Visitor.bulkCreate( initials, { returning }) ).map( ({ dataValues }) => dataValues );

            for ( const visitor of persisted ) {
                const initial = initials.find( ({ name }) => name === visitor.name );

                initial.id = visitor.id;
            }

            const differences = persisted.map( ({ id }, index ) => ({ id, name: names[ index ], ticket: tickets[ index ] }) );
            const [ updates ] = await Visitor.bulkUpdate( differences, { returning });

            for ( let i = 0, l = persisted.length, name, current, updated; i < l; i++ ) {
                current = persisted[ i ];
                updated = updates.find( ({ id }) => id === current.id );
                name = names[ initials.findIndex( ({ id }) => id === current.id ) ];
                ticket = tickets[ initials.findIndex( ({ id }) => id === current.id ) ];

                expect( updated.name ).toBe( name );
                expect( updated.id ).toBe( current.id );
                expect( +updated.ticket ).toBe( ticket );
                expect( updated.name ).not.toBe( current.name );
                expect( +updated.ticket ).not.toBe( +current.ticket );
            }
        });

        it( 'by custom key', async () =>
        {
            const LENGTH = 2;
            const key = 'ticket';
            const returning = true;
            const names = [ ...Array( LENGTH ) ].map( () => uuid() );
            const initials = [ ...Array( LENGTH ) ].map( () => ({ name: uuid(), ticket: getUN() }) );
            const persisted = ( await Visitor.bulkCreate( initials, { returning }) ).map( ({ dataValues }) => dataValues );
            const differences = persisted.map( ({ ticket }, index ) => ({ ticket, name: names[ index ] }) );
            const [ updates ] = await Visitor.bulkUpdate( differences, { returning, key });

            for ( let i = 0, l = persisted.length, name, current, updated; i < l; i++ ) {
                current = persisted[ i ];
                updated = updates.find( ({ id }) => id === current.id );
                name = names[ initials.findIndex( ({ name }) => name === current.name ) ];

                expect( updated.name ).toBe( name );
                expect( updated.id ).toBe( current.id );
                expect( updated.name ).not.toBe( current.name );
                expect( +updated.ticket ).toBe( +current.ticket );
            }
        });

        it( 'only specific fields', async () =>
        {
            const LENGTH = 2;
            const returning = true;
            const fields = [ 'ticket' ];
            const names = [ ...Array( LENGTH ) ].map( () => uuid() );
            const tickets = [ ...Array( LENGTH ) ].map( () => getUN() );
            const initials = tickets.map( () => ({ name: uuid(), ticket: getUN() }) );
            const persisted = ( await Visitor.bulkCreate( initials, { returning }) ).map( ({ dataValues }) => dataValues );
            const differences = persisted.map( ({ id }, index ) => ({ id, name: names[ index ], ticket: tickets[ index ] }) );
            const [ updates ] = await Visitor.bulkUpdate( differences, { returning, fields });

            for ( let i = 0, l = persisted.length, name, ticket, current, updated; i < l; i++ ) {
                current = persisted[ i ];
                updated = updates.find( ({ id }) => id === current.id );
                name = names[ initials.findIndex( ({ name }) => name === current.name ) ];
                ticket = tickets[ initials.findIndex( ({ name }) => name === current.name ) ];

                expect( updated.id ).toBe( current.id );
                expect( updated.name ).not.toBe( name );
                expect( +updated.ticket ).toBe( +ticket );
                expect( updated.name ).toBe( current.name );
                expect( +updated.ticket ).not.toBe( +current.ticket );
            }
        });

        it( 'return updated values if { returning: true } option is provided', async () =>
        {
            const LENGTH = 2;
            const returning = true;
            const tickets = [ ...Array( LENGTH ) ].map( () => getUN() );
            const initials = [ ...Array( LENGTH ) ].map( () => ({ name: uuid(), ticket: getUN() }) );
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

        it( 'return a promise that resolves with a tuple : [ [], ] when NOT PROVIDED { returning: true } option', async () =>
        {
            const LENGTH = 2;
            const returning = true;
            const names = [ ...Array( LENGTH ) ].map( () => uuid() );
            const tickets = [ ...Array( LENGTH ) ].map( () => getUN() );
            const initials = [ ...Array( LENGTH ) ].map( () => ({ name: uuid(), ticket: getUN() }) );
            const persisted = ( await Visitor.bulkCreate( initials, { returning }) ).map( ({ dataValues }) => dataValues );
            const differences = persisted.map( ({ id }, index ) => ({ id, name: names[ index ], ticket: tickets[ index ] }) );
            const [ updated ] = await Visitor.bulkUpdate( differences );

            expect( updated.length ).toBe( 0 );
        });

        it( 'return a promise that resolves with a tuple : [ updated[], ] when provided { returning: true } option', async () =>
        {
            const LENGTH = 2;
            const returning = true;
            const names = [ ...Array( LENGTH ) ].map( () => uuid() );
            const tickets = [ ...Array( LENGTH ) ].map( () => getUN() );
            const initials = [ ...Array( LENGTH ) ].map( () => ({ name: uuid(), ticket: getUN() }) );
            const persisted = ( await Visitor.bulkCreate( initials, { returning }) ).map( ({ dataValues }) => dataValues );
            const differences = persisted.map( ({ id }, index ) => ({ id, name: names[ index ], ticket: tickets[ index ] }) );
            const [ updated ] = await Visitor.bulkUpdate( differences, { returning });

            expect( updated.map( ({ id }) => id ).sort().join() ).toBe( persisted.map( ({ id }) => id ).sort().join() );
        });

        it( 'return a promise that resolves with a tuple : [ , count ]', async () =>
        {
            const LENGTH = 2;
            const returning = true;
            const names = [ ...Array( LENGTH ) ].map( () => uuid() );
            const tickets = [ ...Array( LENGTH ) ].map( () => getUN() );
            const initials = [ ...Array( LENGTH ) ].map( () => ({ name: uuid(), ticket: getUN() }) );
            const persisted = ( await Visitor.bulkCreate( initials, { returning }) ).map( ({ dataValues }) => dataValues );
            const differences = persisted.map( ({ id }, index ) => ({ id, name: names[ index ], ticket: tickets[ index ] }) );
            const [ , count ] = await Visitor.bulkUpdate( differences );

            expect( count ).toBe( LENGTH );
        });

        it( 'return a promise that resolves with a tuple : [ , count ] with { returning: true } option', async () =>
        {
            const LENGTH = 2;
            const returning = true;
            const names = [ ...Array( LENGTH ) ].map( () => uuid() );
            const tickets = [ ...Array( LENGTH ) ].map( () => getUN() );
            const initials = [ ...Array( LENGTH ) ].map( () => ({ name: uuid(), ticket: getUN() }) );
            const persisted = ( await Visitor.bulkCreate( initials, { returning }) ).map( ({ dataValues }) => dataValues );
            const differences = persisted.map( ({ id }, index ) => ({ id, name: names[ index ], ticket: tickets[ index ] }) );
            const [ , count ] = await Visitor.bulkUpdate( differences, { returning });

            expect( count ).toBe( LENGTH );
        });

        it( 'return a promise that resolves with a tuple : [ [], ] when given an empty array', async () =>
        {
            const [ updated ] = await Visitor.bulkUpdate( [] );

            expect( updated.length ).toBe( 0 );
        });

        it( 'return a promise that resolves with a tuple : [ , 0 ] when given an empty array', async () =>
        {
            const [ , count ] = await Visitor.bulkUpdate( [] );

            expect( count ).toBe( 0 );
        });

    });

});

function getUN()
{
    return +`${ Math.random() }`.slice( 2 );
}
