import fetch from "node-fetch";
import fs from 'fs';
import path from 'path';

const host = "https://apipubaws.tcbs.com.vn/tcanalysis/v1";

const lastNquarter = 6;

const listIndustry = [
    {
        "id": 240,
        "name": "Bán lẻ",
        "code": "5300"
    },
    {
        "id": 280,
        "name": "Bảo hiểm",
        "code": "8500"
    },
    {
        "id": 334,
        "name": "Bất động sản",
        "code": "8600"
    },
    {
        "id": 305,
        "name": "Công nghệ Thông tin",
        "code": "9500"
    },
    {
        "id": 142,
        "name": "Dầu khí",
        "code": "0500"
    },
    {
        "id": 281,
        "name": "Dịch vụ tài chính",
        "code": "8700"
    },
    {
        "id": 271,
        "name": "Điện, nước & xăng dầu khí đốt",
        "code": "7500"
    },
    {
        "id": 242,
        "name": "Du lịch và Giải trí",
        "code": "5700"
    },
    {
        "id": 171,
        "name": "Hàng & Dịch vụ Công nghiệp",
        "code": "2700"
    },
    {
        "id": 203,
        "name": "Hàng cá nhân & Gia dụng",
        "code": "3700"
    },
    {
        "id": 147,
        "name": "Hóa chất",
        "code": "1300"
    },
    {
        "id": 279,
        "name": "Ngân hàng",
        "code": "8300"
    },
    {
        "id": 201,
        "name": "Ô tô và phụ tùng",
        "code": "3300"
    },
    {
        "id": 148,
        "name": "Tài nguyên Cơ bản",
        "code": "1700"
    },
    {
        "id": 202,
        "name": "Thực phẩm và đồ uống",
        "code": "3500"
    },
    {
        "id": 241,
        "name": "Truyền thông",
        "code": "5500"
    },
    {
        "id": 264,
        "name": "Viễn thông",
        "code": "6500"
    },
    {
        "id": 170,
        "name": "Xây dựng và Vật liệu",
        "code": "2300"
    },
    {
        "id": 231,
        "name": "Y tế",
        "code": "4500"
    }
];

const getFinancialAnalysisOfSymbol = async (industryCode: string) => {
    let balancesheet = await getDataFilter(`${host}/finance/industry/${industryCode}/balancesheet?yearly=0&isAll=true`);
    let incomestatement = await getDataFilter(`${host}/finance/industry/${industryCode}/incomestatement?yearly=0&isAll=true`);
    let cashflow = await getDataFilter(`${host}/finance/industry/${industryCode}/cashflow?yearly=0&isAll=true`);
    let financialratio = await getDataFilter(`${host}/finance/industry/${industryCode}/financialratio?yearly=0&isAll=true`);

    saveFile(JSON.stringify(balancesheet), industryCode, "balancesheet.json");
    saveFile(JSON.stringify(incomestatement), industryCode, "incomestatement.json");
    saveFile(JSON.stringify(cashflow), industryCode, "cashflow.json");
    saveFile(JSON.stringify(financialratio), industryCode, "financialratio.json");
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
    const filePath = path.resolve(`./data/common/${symbol}/raw/${fileName}`);

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
    for (let i in listIndustry) {
        console.log(`Getting ${listIndustry[i].name}...`)
        getFinancialAnalysisOfSymbol(listIndustry[i].code);
        await delay(15000);
    }
}

export default getFinancialAnalysis;

//getFinancialAnalysis();

