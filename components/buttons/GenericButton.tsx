interface GenericButtonProps {
    onClick?: () => void;
    children: React.ReactNode
    color: 'primary' | 'secondary' | 'danger';
}


export default function GenericButton({ color, onClick, children }: GenericButtonProps) {

    const colorClass = useColorClasses(color)
    return <button className={`relative cursor-pointer group overflow-hidden rounded-xl ${colorClass} px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-95`} onClick={onClick}>
        <span className="relative z-10">{children}</span>
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
    </button>
}

const useColorClasses = (color: GenericButtonProps['color']) => {
    let colorClasses = ''
    switch (color) {
        case 'primary':
            colorClasses = 'bg-indigo-600 hover:bg-indigo-500'
            break;
        case 'secondary':
            colorClasses = 'bg-gray-600 hover:bg-gray-500'
            break;
        case 'danger':
            colorClasses = 'bg-red-600 hover:bg-red-500'
            break;
    }
    return colorClasses

}