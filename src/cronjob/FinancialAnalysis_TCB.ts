import fetch from "node-fetch";
import fs from 'fs';
import path from 'path';

const VN100List = ["AAA", "ACB", "ANV", "ASM", "BCG", "BCM", "BID", "BMP", "BSI", "BVH", "BWE", "CII", "CMG", "CRE", "CTD", "CTG", "CTR", "DBC", "DCM", "DGC", "DGW", "DIG", "DPM", "DXG", "DXS", "EIB", "EVF", "FPT", "FRT", "FTS", "GAS", "GEX", "GMD", "GVR", "HAG", "HCM", "HDB", "HDC", "HDG", "HHV", "HPG", "HSG", "HT1", "IMP", "KBC", "KDC", "KDH", "KOS", "LPB", "MBB", "MSB", "MSN", "MWG", "NKG", "NLG", "NT2", "NVL", "OCB", "PAN", "PC1", "PDR", "PHR", "PLX", "PNJ", "POW", "PPC", "PTB", "PVD", "PVT", "REE", "SAB", "SBT", "SCS", "SHB", "SIP", "SJS", "SSB", "SSI", "STB", "SZC", "TCB", "TCH", "TLG", "TPB", "VCB", "VCG", "VCI", "VGC", "VHC", "VHM", "VIB", "VIC", "VIX", "VJC", "VND", "VNM", "VPB", "VPI", "VRE", "VSH"];

const host = "https://apipubaws.tcbs.com.vn/tcanalysis/v1";

const lastNquarter = 6;

const getFinancialAnalysisOfSymbol = async (symbol: string) => {
    let overview = await getData(`${host}/ticker/${symbol}/overview`);
    let stockratio = await getData(`${host}/ticker/${symbol}/stockratio`);
    let industryAvg = await getData(`${host}/finance/${symbol}/tooltip`);
    let price_volatility = await getData(`${host}/ticker/${symbol}/price-volatility`);
    let balancesheet = await getDataFilter(`${host}/finance/${symbol}/balancesheet?yearly=0&isAll=true`);
    let incomestatement = await getDataFilter(`${host}/finance/${symbol}/incomestatement?yearly=0&isAll=true`);
    let cashflow = await getDataFilter(`${host}/finance/${symbol}/cashflow?yearly=0&isAll=true`);
    let financialratio = await getDataFilter(`${host}/finance/${symbol}/financialratio?yearly=0&isAll=true`);

    saveFile(JSON.stringify(overview), symbol, "overview.json");
    saveFile(JSON.stringify(stockratio), symbol, "stockratio.json");
    saveFile(JSON.stringify(industryAvg), symbol, "industryAvg.json");
    saveFile(JSON.stringify(price_volatility), symbol, "price_volatility.json");
    saveFile(JSON.stringify(balancesheet), symbol, "balancesheet.json");
    saveFile(JSON.stringify(incomestatement), symbol, "incomestatement.json");
    saveFile(JSON.stringify(cashflow), symbol, "cashflow.json");
    saveFile(JSON.stringify(financialratio), symbol, "financialratio.json");
}

const getData = async (url: string) => {
    let response = await fetch(url, { method: "GET" });
    return await response.json();
}

const getDataFilter = async (url: string) => {
    let response = await fetch(url, { method: "GET" });
    let body = await response.json();
    let result = [];
    for (let i = 0; i < lastNquarter; i++) {
        result.push(body[i]);
    }
    return result;
}

const saveFile = (content: string, symbol: string, fileName: string) => {
    const filePath = path.resolve(`./data/stock/${symbol}/raw/${fileName}`);

    fs.mkdir(path.dirname(filePath), { recursive: true }, (err) => {
        if (err) {
            console.error('Lỗi khi tạo thư mục:', err);
            return;
        }

        fs.writeFile(filePath, content, (err) => {
            if (err) {
                console.error('Lỗi khi ghi file:', err);
            }
        });
    });
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getFinancialAnalysis = async () => {
    for (let i in VN100List) {
        console.log(`Getting ${VN100List[i]}...`)
        getFinancialAnalysisOfSymbol(VN100List[i]);
        await delay(15000);
    }
}

export default getFinancialAnalysis;

