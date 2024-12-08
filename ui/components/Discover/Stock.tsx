import { cn } from "@/lib/utils";
import { ChevronDown, Clock, Calendar } from "lucide-react";
import Markdown from "markdown-to-jsx";
import React, { useEffect, useState } from "react";

interface Stock {
    id: number;
    symbol: string;
    score: number,
    type: 'LongTerm' | 'ShortTerm',
    content: string,
    creatAt: string
}

const StockDiscover = () => {
    const [type, setType] = useState('LongTerm');
    const [topStock, setTopStock] = useState<Stock[]>([]);

    const [selectedItem, setSelectedItem] = useState(null);

    const handleRowClick = (id) => {
        if (selectedItem === id) {
            setSelectedItem(null);
        } else {
            setSelectedItem(id);
        }
    };

    useEffect(() => {
        const fetchStocks = async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/top_ticker`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ type: type })
            });

            const data = await res.json();
            setTopStock(data.tickers);
        };

        fetchStocks();
    }, [type]);

    return (
        <div className="pt-8 lg:pt-8">
            <div className="flex flex-wrap items-center">
                <button className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-md",
                    type == 'LongTerm'
                        ? "bg-teal-100 text-teal-800"
                        : "")}
                    onClick={() => { setType('LongTerm') }}>
                    <Calendar />
                    <div>Dài hạn</div>
                </button>
                <button className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-md",
                    type == 'ShortTerm'
                        ? "bg-teal-100 text-teal-800"
                        : "")}
                    onClick={() => { setType('ShortTerm') }}>
                    <Clock />
                    <div>Ngắn hạn</div>
                </button>
            </div>
            <div className="pt-8 lg:pt-8">
                <h1 className="text-2xl font-bold text-center mb-6">Bảng xếp hạng cổ phiếu trong chỉ số VN100</h1>
                <table className="min-w-full table-auto border-collapse bg-light-primary dark:bg-dark-secondary shadow-md">
                    <thead>
                        <tr>
                            <th className="text-left border px-6 py-3">Mã cổ phiếu</th>
                            <th className="text-left border px-6 py-3">Điểm số</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topStock.map((item) => (
                            <React.Fragment key={item.id}>
                                <tr
                                    onClick={() => handleRowClick(item.id)}
                                >
                                    <td className="px-6 py-3">{item.symbol}</td>
                                    <td className="flex justify-between px-6 py-3">
                                        {item.score}
                                        <ChevronDown />
                                    </td>
                                </tr>
                                {selectedItem === item.id && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-3 text-sm text-gray-500">
                                            <Markdown>{`${item.content}\n\nThời gian cập nhật: **${item.creatAt}**`}</Markdown>
                                            Muốn thông tin mới hơn? Hỏi chatbot ngay tại <a className="text-teal-200" href={`/?q=Tình hình cổ phiếu ${item.symbol} tại Việt Nam`}>đây</a>.
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockDiscover;