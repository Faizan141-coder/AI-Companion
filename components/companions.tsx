'use client'

import { Companion } from "@prisma/client"
import Image from "next/image"
import { MessagesSquare } from "lucide-react"

import { 
    Card, 
    CardFooter, 
    CardHeader 
} from "@/components/ui/card"

import { useRouter } from "next/navigation"
import { useProModal } from "@/hooks/use-pro-modal"
interface CompanionsProps {
    data: (Companion & {
        _count: {
            messages: number
        }
    })[]
    isPro: boolean;
}

export const Companions = ({
    data,
    isPro
}: CompanionsProps) => {

    const router = useRouter()
    const proModal = useProModal()

    const onNavigate = (url: string, pro: boolean) => {
        if (pro && !isPro) {
            return proModal.onOpen();
        }
        return router.push(url);
    };

    if (data.length === 0) {
        return (
            <div className="pt-10 flex flex-col items-center justify-center space-y-3">
                <div className="relative w-60 h-60">
                    <Image 
                        fill
                        src='/empty.png'
                        alt="Empty"
                    />
                </div>
                <p className="text-sm text-muted-foreground">
                    No companions found
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 pb-10">
            {data.map((item) => (
                <Card
                    key={item.id}
                    className="bg-primary/10 rounded-xl cursor-pointer hover:opacity-75 transition border-0"
                    onClick={() => onNavigate(`/chat/${item.id}`, true)}
                >
                    <CardHeader className="flex items-center justify-center text-center text-muted-foreground">
                        <div className="relative w-32 h-32">
                            <Image
                                src={item.src}
                                alt='Companion'
                                fill
                                className="rounded-xl object-cover"
                            />
                        </div>
                        <p className="font-bold">
                            {item.name}
                        </p>
                        <p className="text-xs">
                            {item.description}
                        </p>
                    </CardHeader>
                    <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
                        <p className="lowercase">
                            @{item.userName}
                        </p>
                        <div className="flex items-center">
                            <MessagesSquare className="w-3 h-3 mr-1" />
                            {item._count.messages} 
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}