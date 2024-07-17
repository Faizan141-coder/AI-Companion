import prismadb from "@/lib/prismadb";

import { Categories } from "@/components/categories";
import { SearchInput } from "@/components/search-input";
import { Companions } from "@/components/companions";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { checkSubscription } from "@/lib/subscription";

interface RootPageProps {
    searchParams: {
        categoryId: string,
        name: string
    }
}

const RootPage = async ({
    searchParams
}: RootPageProps) => {

    const { userId } = auth()

    if (!userId) {
        return redirect('/sign-in')
    }

    const isPro = await checkSubscription()

    const data = await prismadb.companion.findMany({
        where: {
            categoryId: searchParams.categoryId,
            name: {
                search: searchParams.name
            }
        },
        orderBy: {
            createdAt: "desc"
        },
        include: {
            _count: {
                select: {
                    messages: true
                }            
            }
        }
    })

    const categories = await prismadb.category.findMany();

    return (
        <div className="h-full p-4 space-y-2">
            <SearchInput />
            <Categories data={categories} />
            <Companions data={data} isPro={isPro} />
        </div>
    );
}
 
export default RootPage;