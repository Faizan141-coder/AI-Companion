const { PrismaClient } = require("@prisma/client");

const prismadb = new PrismaClient();

async function main() {
    try {
        await prismadb.category.createMany({
            data: [ 
                { name: 'Famous People' },
                { name: 'Movies & TV' },
                { name: 'Musicians' },
                { name: 'Games' },
                { name: 'Animals' },
                { name: 'Philosophy' },
                { name: 'Scientists' }
            ]
        })
    } catch (error) {
        console.error('Error seeding the default categories', error);
    } finally {
        await prismadb.$disconnect();
    }
}

main();