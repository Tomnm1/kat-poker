"use client";

interface CardProps {
    number: number;
    onClick?: (value: number) => void;
    card_styles?: string;
    text_styles?: string;
    isSelected: boolean;
    owner?: string;
}

const Card: React.FC<CardProps> = ({ number, onClick, card_styles, text_styles, isSelected, owner }) => {
    return (
        <>
            <div 
                onClick={() => onClick?.(number)}
                // className={`w-15 h-25 bg-white/15 rounded-lg flex items-center justify-center shadow-xl cursor-pointer ${card_styles}`}
                className={`w-15 h-25 bg-white/15 rounded-lg flex items-center justify-center shadow-xl cursor-pointer ${
                    isSelected ? 'bg-blue-300' : ''
                } ${card_styles}`}
            >
                <span className={`text-3xl font-bold text-blue-100 ${text_styles}`}>{number}</span>
            </div>
            { owner !== null && <span className="text-3xl font-normal text-white">{owner}</span>}
        </>
    );
};

export default Card;
