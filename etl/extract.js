import { promises as fs } from "fs";
import { parse } from "csv-parse/sync";
import { createObjectCsvWriter } from "csv-writer";

async function readCsv(filePath) {
    const data = await fs.readFile(filePath);
    return parse(data, { columns: true });
}

async function readText(filePath) {
    const data = await fs.readFile(filePath, "utf-8");
    const lines = data.split("\n").filter(line => line.trim() !== "");
    return lines.map(line => {
        const match = line.match(/\((\w+) \d+, \d+\)/);
        return match ? { month: match[1] } : null;
    }).filter(item => item !== null);
}

function extractColors(rows) {
    return rows.map(row => {
        const colorsArray = JSON.parse(row.colors.replace(/'/g, ""));
        const cleanedColors = colorsArray.map(color => color.trim().replace(/[\r\n]+/g, ''));
        const cleanedColorsString = `['${cleanedColors.join("','")}']`;

        return {
            title: row.painting_title,
            source: row.youtube_src,
            colors: cleanedColorsString
        };
    });
}