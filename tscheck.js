// tscheck.js
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Các thư mục cần kiểm tra
const directoriesToCheck = [
    'app',
    'common',
    'context',
    'components',
    'helper',
    'utils',
    'lib',
    'hooks',
    'redux',
    'screens',
    'services',
    'apis',
    'actions',
    'schemas',
    'types',
    'config',
    'constants',
];

// Tìm các thư mục tồn tại
const existingDirectories = directoriesToCheck.filter(dir => {
    try {
        return fs.statSync(path.join(process.cwd(), dir)).isDirectory();
    } catch (e) {
        return false;
    }
});

if (existingDirectories.length === 0) {
    console.error('Không tìm thấy thư mục mã nguồn nào để kiểm tra.');
    process.exit(1);
}

console.log('Đang kiểm tra lỗi TypeScript trong các thư mục:', existingDirectories.join(', '));

// Xây dựng lệnh tsc để kiểm tra mã nguồn
const tscCheckCommand = `npx tsc --noEmit --pretty --project tsconfig.json`;

console.log(`Đang chạy: ${tscCheckCommand}`);

// Thực thi lệnh kiểm tra
exec(tscCheckCommand, (error, stdout, stderr) => {
    if (stdout) {
        console.log(stdout);
    }

    if (stderr) {
        console.error(stderr);
    }

    if (error) {
        console.error('Kiểm tra TypeScript thất bại với lỗi:');
        process.exit(1);
    } else {
        console.log('✅ Kiểm tra TypeScript thành công! Không tìm thấy lỗi nào.');
    }
});