import fetch from "node-fetch";
import fs from 'fs';
import path from 'path';
import moment from 'moment';

const VN100List = ["AAA", "ACB", "ANV", "ASM", "BCG", "BCM", "BID", "BMP", "BSI", "BVH", "BWE", "CII", "CMG", "CRE", "CTD", "CTG", "CTR", "DBC", "DCM", "DGC", "DGW", "DIG", "DPM", "DXG", "DXS", "EIB", "EVF", "FPT", "FRT", "FTS", "GAS", "GEX", "GMD", "GVR", "HAG", "HCM", "HDB", "HDC", "HDG", "HHV", "HPG", "HSG", "HT1", "IMP", "KBC", "KDC", "KDH", "KOS", "LPB", "MBB", "MSB", "MSN", "MWG", "NKG", "NLG", "NT2", "NVL", "OCB", "PAN", "PC1", "PDR", "PHR", "PLX", "PNJ", "POW", "PPC", "PTB", "PVD", "PVT", "REE", "SAB", "SBT", "SCS", "SHB", "SIP", "SJS", "SSB", "SSI", "STB", "SZC", "TCB", "TCH", "TLG", "TPB", "VCB", "VCG", "VCI", "VGC", "VHC", "VHM", "VIB", "VIC", "VIX", "VJC", "VND", "VNM", "VPB", "VPI", "VRE", "VSH"];
const Vietnam10YearBondYield = 0.02681;
const TradingDaysPerYear = 252;

interface DataItem {
    Ngay: string; // Ngày
    GiaDieuChinh: number; // Giá điều chỉnh
    GiaDongCua: number; // Giá đóng cửa
    ThayDoi: string; // Thay đổi
    KhoiLuongKhopLenh: number; // Khối lượng khớp lệnh
    GiaTriKhopLenh: number; // Giá trị khớp lệnh
    KLThoaThuan: number; // Khối lượng thỏa thuận
    GtThoaThuan: number; // Giá trị thỏa thuận
    GiaMoCua: number; // Giá mở cửa
    GiaCaoNhat: number; // Giá cao nhất
    GiaThapNhat: number; // Giá thấp nhất
}

interface DataResponse {
    TotalCount: number; // Tổng số lượng
    Data: DataItem[]; // Mảng các dữ liệu
}

interface ApiResponseVN100 {
    Data: DataResponse; // Dữ liệu trả về
}

interface StockDataItem {
    open: number; // Giá mở cửa
    high: number; // Giá cao nhất
    low: number; // Giá thấp nhất
    close: number; // Giá đóng cửa
    volume: number; // Khối lượng giao dịch
    tradingDate: string; // Ngày giao dịch
}

interface StockApiResponse {
    ticker: string; // Mã chứng khoán
    data: StockDataItem[]; // Mảng dữ liệu giao dịch
}


const getHistoryPrice = async (symbol: string) => {
    let endHistoryDate = moment().unix();

    let history = await getData(`https://apipubaws.tcbs.com.vn/stock-insight/v2/stock/bars-long-term?ticker=${symbol}&type=stock&resolution=D&to=${endHistoryDate}&countBack=365`) as StockApiResponse;

    let historyData = history.data.map((e) => {
        return {
            price: e.close,
            tradingDate: e.tradingDate.substring(0, 10)
        }
    });
    return historyData;
}

const getHistoryVN100 = async () => {

    let history = await getData(`https://s.cafef.vn/Ajax/PageNew/DataHistory/PriceHistory.ashx?Symbol=VN100-INDEX&StartDate=${moment().subtract(1, "years").format("MM/DD/YYYY")}&EndDate=${moment().format("MM/DD/YYYY")}&PageIndex=1&PageSize=500`) as ApiResponseVN100;

    let historyData = history.Data.Data.map((e) => {
        return {
            price: parseInt(String(e.GiaDongCua * 1000)),
            tradingDate: moment(e.Ngay, "DD/MM/YYYY").format("YYYY-MM-DD")
        }
    });
    historyData.reverse();
    return historyData;
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

const getData = async (url: string) => {
    let response = await fetch(url, { method: "GET" });
    let body = await response.json()
    return body;
}

const stdevP = (values: number[]) => {
    const n = values.length;
    if (n === 0) return 0;

    const mean = values.reduce((acc, val) => acc + val, 0) / n;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;

    return Math.sqrt(variance);
}

const AnnualizedVolatility = (GrowthPercent: number[]) => {
    return Number((stdevP(GrowthPercent) * Math.sqrt(TradingDaysPerYear)).toFixed(4));
}

const SharpeRatio = (cumulative: number[], price: Record<string, any>[], month: number) => {
    let indexPrice = 252 - Math.floor(252 * month / 12);
    let annualizedVolatility = AnnualizedVolatility(cumulative.slice(indexPrice + 1, cumulative.length));
    let loinhuan = Number((Math.pow(price[price.length - 1].price / price[indexPrice].price, 12 / month) - 1).toFixed(4));
    return Number(((loinhuan - Vietnam10YearBondYield) / annualizedVolatility).toFixed(4))
}

const Cumulative = (price: Record<string, any>[], month: number) => {
    return Number((price[price.length - 1].price / price[252 - Math.floor(252 * month / 12)].price - 1).toFixed(4))
}

const MaxDrawdown = (price: Record<string, any>[]) => {
    let prices = price.map((e) => e.price);
    let peak = prices[0];
    let maxDrawdown = 0;

    for (let i = 1; i < prices.length; i++) {
        if (prices[i] > peak) {
            peak = prices[i];
        } else {
            const drawdown = (peak - prices[i]) / peak;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }
    }

    return Number(maxDrawdown.toFixed(4));
}

const AnalysisStock = async (symbol: string) => {
    let stockPrice = await getHistoryPrice(symbol);
    let stockPercent: number[] = [];
    for (let j = 1; j < stockPrice.length; j++) {
        stockPercent.push(Number((stockPrice[j].price / stockPrice[j - 1].price - 1).toFixed(4)));
    }

    let AnalysisStock = {
        Cumulative_Return_3_Month: Cumulative(stockPrice, 3),
        Cumulative_Return_6_Month: Cumulative(stockPrice, 6),
        Cumulative_Return_12_Month: Cumulative(stockPrice, 12),
        Volatility_12_Month: AnnualizedVolatility(stockPercent),
        SharpeRatio_3_Month: SharpeRatio(stockPercent, stockPrice, 3),
        SharpeRatio_6_Month: SharpeRatio(stockPercent, stockPrice, 6),
        SharpeRatio_12_Month: SharpeRatio(stockPercent, stockPrice, 12),
        Maximum_Drawdown_12_Month: MaxDrawdown(stockPrice)
    }
    return AnalysisStock;
}

const AnalysisSimilarStock = async (symbol: string) => {
    let response = await fetch(`https://apipubaws.tcbs.com.vn/tcanalysis/v1/ticker/${symbol}/stock-same-ind`, { method: "GET" });
    let body = await response.json()
    return body.value.map(e => {
        return {
            "correlation": e.correlation,
            "beta": e.beta,
            "pe": e.pe,
            "price_volatility_1_month_compareWith_VNINDEX": e.vni1m,
            "price_volatility_3_month_compareWith_VNINDEX": e.vni3m,
            "price_volatility_6_month_compareWith_VNINDEX": e.vni6m,
            "companyName": e.companyName,
            "industryName": e.industryName,
            "exchangeName": e.exchangeName,
            "ticker": e.ticker
        }
    });

}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const CalcPriceDynamics = async () => {
    let VN100Price = await getHistoryVN100();
    let VN100Percent: number[] = [];

    for (let i = 1; i < VN100Price.length; i++) {
        VN100Percent.push(Number((VN100Price[i].price / VN100Price[i - 1].price - 1).toFixed(4)));
    }

    let AnalysisVN100 = {
        Cumulative_Return_3_Month: Cumulative(VN100Price, 3),
        Cumulative_Return_6_Month: Cumulative(VN100Price, 6),
        Cumulative_Return_12_Month: Cumulative(VN100Price, 12),
        Volatility_12_Month: AnnualizedVolatility(VN100Percent),
        SharpeRatio_3_Month: SharpeRatio(VN100Percent, VN100Price, 3),
        SharpeRatio_6_Month: SharpeRatio(VN100Percent, VN100Price, 6),
        SharpeRatio_12_Month: SharpeRatio(VN100Percent, VN100Price, 12),
        Maximum_Drawdown_12_Month: MaxDrawdown(VN100Price)
    }

    saveFile(JSON.stringify(AnalysisVN100), "VN100", "DynamicPrice.json");

    for (let i in VN100List) {
        console.log(`${VN100List[i]}...`);
        let analysisStock = await AnalysisStock(VN100List[i]);
        let similarStock = await AnalysisSimilarStock(VN100List[i]);
        saveFile(JSON.stringify({
            OriginStock: analysisStock,
            SimilarStock: similarStock
        }), VN100List[i], "DynamicPrice.json");
        await delay(10000);
    }
}

export default CalcPriceDynamics;