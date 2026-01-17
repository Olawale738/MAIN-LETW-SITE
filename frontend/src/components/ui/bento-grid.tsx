import { cn } from "@/lib/utils";

export const BentoGrid = ({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto ",
                className
            )}
        >
            {children}
        </div>
    );
};

export const BentoGridItem = ({
    className,
    title,
    description,
    header,
    icon,
}: {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "row-span-1 relative overflow-hidden rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none dark:bg-black dark:border-white/[0.2] bg-[#140152] border border-transparent flex flex-col justify-end p-4",
                className
            )}
        >
            <div className="absolute inset-0 w-full h-full z-0 transition duration-200 group-hover/bento:scale-105">
                {header}
            </div>
            <div className="absolute inset-0 bg-black/40 z-10 transition duration-200 group-hover/bento:bg-black/50" />

            <div className="relative z-20 group-hover/bento:translate-x-2 transition duration-200">
                {icon}
                <div className="font-sans font-bold text-white mb-2 mt-2">
                    {title}
                </div>
                <div className="font-sans font-normal text-white text-xs">
                    {description}
                </div>
            </div>
        </div>
    );
};
