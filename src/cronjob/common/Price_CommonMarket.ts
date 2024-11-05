import fetch from "node-fetch";
import fs from 'fs';
import path from 'path';

const saveFile = (content: string, symbol: string, fileName: string) => {
    const filePath = path.resolve(`./data/${symbol}/all/${fileName}`);

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

const industry_classification = async () => {
    const res = await fetch("https://api-finfo.vndirect.com.vn/v4/industry_classification?q=industryLevel:2");
    const body = await res.json();
    const industry_classification = new Map();
    for (let i in body.data) {
        industry_classification.set(body.data[i].industryCode, body.data[i]);
    }
    return industry_classification;
}

const industry_changne = async () => {
    const industry = await industry_classification();

    const res = await fetch("https://mkw-socket-v2.vndirect.com.vn/mkwsocketv2/industrychange");
    const body = await res.json();
    for (let i in body.data) {
        body.data[i].industryName = industry.get(body.data[i].indexCode).vietnameseName;
        //body.data[i].tickerList = industry.get(body.data[i].indexCode).codeList;
    }
    const bodyText = JSON.stringify(body).replaceAll("indIndex", "industryIndex")
        .replaceAll("indChgCr", "industryChangeCurrent")
        .replaceAll("indChgPctCr", "industryChangePercentCurrent");
    saveFile(bodyText, "common", "DynamicPrice.json");
}

export default industry_changne;

//industry_changne();

