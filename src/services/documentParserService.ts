import csvParser from 'csv-parser'
import ExcelJS from 'exceljs'
import { Readable } from 'stream'

export const parseCsvBuffer = async (buffer: Buffer): Promise<string> => {
    return new Promise((resolve, reject) => {
        const results: string[] = []
        const stream = Readable.from(buffer)

        stream
            .pipe(csvParser())
            .on('data', (data) => {
                results.push(JSON.stringify(data))
            })
            .on('end', () => {
                resolve(results.join('\n'))
            })
            .on('error', (error) => {
                reject(error)
            })
    })
}

export const parseExcelBuffer = async (buffer: Buffer): Promise<string> => {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as any)

    const rowsText: string[] = []

    workbook.eachSheet((worksheet) => {
        worksheet.eachRow((row) => {
            const rowValues = row.values
            if (Array.isArray(rowValues)) {
                rowsText.push(rowValues.filter(Boolean).join(' | '))
            }
        })
    })

    return rowsText.join('\n')
}