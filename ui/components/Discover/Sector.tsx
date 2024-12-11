import { useEffect, useState } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import SectorInfo from './SectorInfo';

const Round = (num: number) => {
    return Math.round(num * 100) / 100;
}

const CustomContent = (props) => {
    const { x, y, width, height, indName, indIndexChgPct, content, onClick } = props;
    const wrapText = (text, maxWidth) => {
        const words = text.split(" ");
        const lines: string[] = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const testLine = `${currentLine} ${words[i]}`;
            const textWidth = testLine.length * 14 * 0.6; // Ước tính chiều rộng ký tự
            if (textWidth < maxWidth) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = words[i];
            }
        }
        lines.push(currentLine);
        return lines;
    };
    const lines = wrapText(`${indName} (${Round(indIndexChgPct)}%)`, width);
    const dy = 14 * 1.2;
    return (
        <g>
            {/* Hình chữ nhật đại diện cho node */}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={indIndexChgPct < 0 ? "red" : "green"}
                stroke="#fff"
                onClick={() => onClick(indName, content)}
            />
            {/* Text trong node */}
            <text
                x={x + width / 2}
                y={y + height / 2 - (lines.length - 1) * dy / 2}
                textAnchor="middle"
                fill="#fff"
                fontSize="14"
                pointerEvents="none"
            >
                {lines.map((line, index) => (
                    <tspan key={index} x={x + width / 2} dy={index === 0 ? 0 : dy}>
                        {line}
                    </tspan>
                ))}
            </text>
        </g>
    );
};

const CustomTooltip = (props) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
        return (
            <div className="p-4 bg-light-primary dark:bg-dark-secondary">
                <p>{payload[0].payload.indName}</p>
                <p>{`Giá trị chỉ số ngành: ${Round(payload[0].payload.indIndex)} điểm`}</p>
                <p>{`KLGD: ${payload[0].payload.indQuantity}`}</p>
                <p>{`GTGD: ${payload[0].payload.indTradedValue} tỷ`}</p>
                <p>{`Vốn hoá: ${Round(payload[0].payload.indMarketCap)} tỷ`}</p>
            </div>
        );
    }

    return null;
};

interface Sector {
    id: number;
    indCode: string;
    indName: string;
    indMarketCap: number;
    indIndex: number;
    indIndexChgPct: number;
    indQuantity: number;
    indTradedValue: number;
    content: string,
    creatAt: string
}

const SectorDiscover = () => {

    const [data, setData] = useState<Sector[]>([]);
    const [info, setInfo] = useState({ isOpen: false, indName: "", content: "" })

    const handleClick = (indName, content) => {
        setInfo({
            isOpen: true,
            indName: indName,
            content: content
        });
    };

    useEffect(() => {
        const fetchSector = async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sector`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await res.json();
            setData(data);
        };

        fetchSector();
    }, []);

    return (
        <div className="pt-8 lg:pt-8">
            <ResponsiveContainer width="100%" height={400}>
                <Treemap
                    data={data}
                    nameKey="indName"
                    dataKey="indMarketCap"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    content={
                        <CustomContent
                            onClick={handleClick}
                        />
                    }
                >
                    <Tooltip content={<CustomTooltip />} />
                </Treemap>
            </ResponsiveContainer>
            <SectorInfo
                info={info}
                setInfo={setInfo} />
        </div>
    );
};

export default SectorDiscover;
