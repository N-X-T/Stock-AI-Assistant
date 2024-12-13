'use client';

import HomeDiscover from '@/components/Discover/Home';
import SectorDiscover from '@/components/Discover/Sector';
import StockDiscover from '@/components/Discover/Stock';
import { cn } from '@/lib/utils';
import { Earth, Home, Factory, CircleDollarSign } from 'lucide-react';
import { useState } from 'react';

const DiscoverPage = () => {
    const [tab, setTab] = useState("home");

    return (
        <div>
            <div className="fixed z-40 top-0 left-0 right-0 lg:pl-[104px] lg:pr-6 lg:px-8 px-4 py-4 lg:py-6 border-b border-light-200 dark:border-dark-200">
                <div className="flex flex-row items-center space-x-2 max-w-screen-lg lg:mx-auto">
                    <Earth />
                    <h2 className="text-black dark:text-white lg:text-3xl lg:font-medium">
                        Discover
                    </h2>
                </div>
            </div>
            <div className="flex flex-col pt-16 lg:pt-24">
                <div className="flex flex-wrap items-center">
                    <button className={cn(
                        "flex items-center space-x-2 px-4 py-2 rounded-md",
                        tab == 'home'
                            ? "bg-teal-100 text-teal-800"
                            : "")}
                        onClick={() => { setTab('home') }}>
                        <Home />
                        <div>Home</div>
                    </button>
                    <button className={cn(
                        "flex items-center space-x-2 px-4 py-2 rounded-md",
                        tab == 'sector'
                            ? "bg-teal-100 text-teal-800"
                            : "")}
                        onClick={() => { setTab('sector') }}>
                        <Factory />
                        <div>Sector</div>
                    </button>
                    <button className={cn(
                        "flex items-center space-x-2 px-4 py-2 rounded-md",
                        tab == 'stock'
                            ? "bg-teal-100 text-teal-800"
                            : "")}
                        onClick={() => { setTab('stock') }}>
                        <CircleDollarSign />
                        <div>Stock</div>
                    </button>
                </div>
                {tab == 'home' && <HomeDiscover />}
                {tab == 'sector' && <SectorDiscover />}
                {tab == 'stock' && <StockDiscover />}
            </div>
        </div>
    );
};

export default DiscoverPage;
