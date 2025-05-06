// tscheck.js
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Lấy tham số dòng lệnh
const args = process.argv.slice(2);
const isWatch = args.includes('--watch');
const isVerbose = args.includes('--verbose');
const includesLint = args.includes('--lint');

// Các thư mục cần kiểm tra
const directoriesToCheck = [
    'app',
    'common',
    'contexts',
    'components',
    'helper',
    'hooks',
    'utils',
    'lib',
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
    console.error('\x1b[31m%s\x1b[0m', 'Không tìm thấy thư mục mã nguồn nào để kiểm tra.');
    process.exit(1);
}

console.log('\x1b[36m%s\x1b[0m', '📂 Đang kiểm tra các thư mục:', existingDirectories.join(', '));

// Xây dựng lệnh tsc để kiểm tra mã nguồn
const watchFlag = isWatch ? '--watch' : '';
const tscCheckCommand = `npx tsc --noEmit --pretty ${watchFlag} --project tsconfig.json`;

console.log('\x1b[36m%s\x1b[0m', `🔍 Đang chạy TypeScript check: ${tscCheckCommand}`);

// Hàm kiểm tra ESLint
const runEslintCheck = () => {
    if (!includesLint) return Promise.resolve();

    return new Promise((resolve, reject) => {
        console.log('\x1b[36m%s\x1b[0m', '🔍 Đang chạy ESLint check...');

        const eslintCommand = 'npx eslint . --ext .ts,.tsx';
        exec(eslintCommand, (error, stdout, stderr) => {
            if (stdout && isVerbose) {
                console.log(stdout);
            }

            if (stderr) {
                console.error('\x1b[31m%s\x1b[0m', stderr);
            }

            if (error) {
                console.error('\x1b[31m%s\x1b[0m', '❌ Kiểm tra ESLint thất bại!');
                reject(error);
            } else {
                console.log('\x1b[32m%s\x1b[0m', '✅ Kiểm tra ESLint thành công!');
                resolve();
            }
        });
    });
};

// Hàm kiểm tra TypeScript
const runTypeScriptCheck = () => {
    return new Promise((resolve, reject) => {
        exec(tscCheckCommand, (error, stdout, stderr) => {
            if (stdout && (isVerbose || error)) {
                console.log(stdout);
            }

            if (stderr) {
                console.error('\x1b[31m%s\x1b[0m', stderr);
            }

            if (error) {
                console.error('\x1b[31m%s\x1b[0m', '❌ Kiểm tra TypeScript thất bại!');

                // Phân tích lỗi TypeScript để hiển thị tóm tắt
                const errorMatch = stdout.match(/Found (\d+) error/);
                if (errorMatch && errorMatch[1]) {
                    console.error('\x1b[31m%s\x1b[0m', `Tìm thấy ${errorMatch[1]} lỗi TypeScript.`);
                }

                reject(error);
            } else {
                console.log('\x1b[32m%s\x1b[0m', '✅ Kiểm tra TypeScript thành công! Không tìm thấy lỗi nào.');
                resolve();
            }
        });
    });
};

// Nếu ở chế độ watch, chỉ chạy TypeScript check
if (isWatch) {
    runTypeScriptCheck().catch(() => {
        // Trong chế độ watch, không thoát với lỗi vì TypeScript sẽ tiếp tục theo dõi
        console.log('\x1b[33m%s\x1b[0m', 'Đang theo dõi các thay đổi file...');
    });
} else {
    // Chạy cả hai kiểm tra nếu được yêu cầu
    Promise.all([
        runTypeScriptCheck(),
        includesLint ? runEslintCheck() : Promise.resolve()
    ])
        .then(() => {
            console.log('\x1b[32m%s\x1b[0m', '✨ Tất cả kiểm tra đã hoàn tất thành công!');
        })
        .catch(() => {
            console.error('\x1b[31m%s\x1b[0m', '❌ Một hoặc nhiều kiểm tra thất bại.');
            process.exit(1);
        });
}


// // tscheck.js
// const { exec } = require('child_process');
// const path = require('path');
// const fs = require('fs');

// // Các thư mục cần kiểm tra
// const directoriesToCheck = [
//     'app',
//     'common',
//     'context',
//     'components',
//     'helper',
//     'utils',
//     'lib',
//     'hooks',
//     'redux',
//     'screens',
//     'services',
//     'apis',
//     'actions',
//     'schemas',
//     'types',
//     'config',
//     'constants',
// ];

// // Tìm các thư mục tồn tại
// const existingDirectories = directoriesToCheck.filter(dir => {
//     try {
//         return fs.statSync(path.join(process.cwd(), dir)).isDirectory();
//     } catch (e) {
//         return false;
//     }
// });

// if (existingDirectories.length === 0) {
//     console.error('Không tìm thấy thư mục mã nguồn nào để kiểm tra.');
//     process.exit(1);
// }

// console.log('Đang kiểm tra lỗi TypeScript trong các thư mục:', existingDirectories.join(', '));

// // Xây dựng lệnh tsc để kiểm tra mã nguồn
// const tscCheckCommand = `npx tsc --noEmit --pretty --project tsconfig.json`;

// console.log(`Đang chạy: ${tscCheckCommand}`);

// // Thực thi lệnh kiểm tra
// exec(tscCheckCommand, (error, stdout, stderr) => {
//     if (stdout) {
//         console.log(stdout);
//     }

//     if (stderr) {
//         console.error(stderr);
//     }

//     if (error) {
//         console.error('Kiểm tra TypeScript thất bại với lỗi:');
//         process.exit(1);
//     } else {
//         console.log('✅ Kiểm tra TypeScript thành công! Không tìm thấy lỗi nào.');
//     }
// });