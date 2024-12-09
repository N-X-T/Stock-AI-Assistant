import { ChevronDown } from "lucide-react";
import Markdown from "markdown-to-jsx";
import { useEffect, useState } from "react";

interface market {
    id: number;
    content: string;
    creatAt: string;
}

const HomeDiscover = () => {

    const [info, setInfo] = useState<market[]>([]);
    const [selectedItem, setSelectedItem] = useState(null);

    const handleRowClick = (id) => {
        if (selectedItem === id) {
            setSelectedItem(null);
        } else {
            setSelectedItem(id);
        }
    };

    useEffect(() => {
        const fetchMarket = async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/market`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await res.json();
            setInfo(data);
        };

        fetchMarket();
    }, []);

    return (
        <div className="pt-8 lg:pt-8 space-y-4">
            {info.map((e) => (<>
                <div className="p-4 bg-light-primary dark:bg-dark-secondary shadow-md rounded-lg">
                    <h2 className="flex justify-between text-xl font-semibold mb-2 ju"
                        onClick={() => handleRowClick(e.id)}>
                        Tình hình thị trường ngày {new Date(e.creatAt).toLocaleDateString("vi-VN")}<ChevronDown />
                    </h2>
                    {selectedItem === e.id && (<Markdown>{e.content}</Markdown>)}
                </div>
            </>
            ))}
        </div>
    );
}
export default HomeDiscover;