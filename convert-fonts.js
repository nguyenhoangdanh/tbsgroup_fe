const fs = require('fs');
const path = require('path');

// Đường dẫn đến thư mục chứa fonts
const FONTS_DIR = './public/fonts'; // Điều chỉnh đường dẫn tới thư mục chứa font của bạn

// Tạo thư mục output nếu chưa tồn tại
const OUTPUT_DIR = './lib/fonts-data';
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Đọc tất cả fonts trong thư mục
fs.readdir(FONTS_DIR, (err, files) => {
    if (err) {
        console.error('Không thể đọc thư mục fonts:', err);
        return;
    }

    // Lọc chỉ lấy các file TTF
    const ttfFiles = files.filter(file => file.toLowerCase().endsWith('.ttf'));

    // Tạo nội dung file TypeScript
    let tsContent = `// Font data được tự động tạo từ script convert-fonts.js\n\n`;

    // Chuyển đổi từng file
    ttfFiles.forEach(file => {
        const fontName = path.basename(file, '.ttf');
        const fontPath = path.join(FONTS_DIR, file);

        // Đọc file TTF và chuyển đổi sang Base64
        const fontData = fs.readFileSync(fontPath);
        const base64Font = fontData.toString('base64');

        // Chuẩn hóa tên biến
        const variableName = fontName
            .replace(/BeVietnamPro-/, '')
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '')
            .replace(/-/g, '_');

        tsContent += `export const ${variableName}_font = "${base64Font}";\n\n`;
    });

    // Thêm khối vfs_fonts để sử dụng với pdfmake
    tsContent += `// Cấu hình cho pdfmake\nexport const vfs_fonts = {\n`;
    ttfFiles.forEach(file => {
        tsContent += `  "${file}": ${path.basename(file, '.ttf')
            .replace(/BeVietnamPro-/, '')
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '')
            .replace(/-/g, '_')}_font,\n`;
    });
    tsContent += `};\n\n`;

    // Thêm cấu hình font families cho pdfmake
    tsContent += `// Cấu hình font families cho pdfmake\nexport const pdfmake_fonts = {\n`;
    tsContent += `  BeVietnamPro: {\n`;
    tsContent += `    normal: 'BeVietnamPro-Regular.ttf',\n`;
    tsContent += `    bold: 'BeVietnamPro-Bold.ttf',\n`;
    tsContent += `    italics: 'BeVietnamPro-Italic.ttf',\n`;
    tsContent += `    bolditalics: 'BeVietnamPro-BoldItalic.ttf',\n`;
    tsContent += `  },\n`;
    tsContent += `};\n`;

    // Ghi file TypeScript
    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), tsContent);

    console.log(`Đã chuyển đổi ${ttfFiles.length} font thành Base64 và lưu vào ${path.join(OUTPUT_DIR, 'index.ts')}`);
});