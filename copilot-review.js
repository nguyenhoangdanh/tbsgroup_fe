#!/usr/bin/env node
const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Script để tự động review code bằng VSCode và GitHub Copilot
 * Cách sử dụng: node vscode-copilot-review.js
 */

// Các cấu hình
const CONFIG = {
    // Các extensions file cần review
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    // Các thư mục/file cần loại trừ
    excludePaths: ['node_modules', '.next', 'out', 'dist', 'build', '.git', 'code-reviews'],
    // Output directory để lưu kết quả review
    outputDir: 'copilot-reviews',
    // Số lượng file tối đa để review trong một lần chạy
    maxFiles: 10,
    // Thời gian chờ tối đa cho mỗi file (ms)
    timeout: 30000
};

// Tạo thư mục output nếu chưa tồn tại
if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * Lấy tất cả các file trong project với extension được chỉ định
 */
function getAllFiles(dir, extensions, excludePaths) {
    let results = [];

    // Kiểm tra xem path có nằm trong danh sách loại trừ không
    if (excludePaths.some(excludePath => dir.includes(excludePath))) {
        return results;
    }

    try {
        const list = fs.readdirSync(dir);

        list.forEach(file => {
            const fullPath = path.join(dir, file);

            try {
                const stat = fs.statSync(fullPath);

                if (stat && stat.isDirectory()) {
                    // Đệ quy vào thư mục con
                    results = results.concat(getAllFiles(fullPath, extensions, excludePaths));
                } else {
                    // Kiểm tra extension
                    const ext = path.extname(file);
                    if (extensions.includes(ext)) {
                        results.push(fullPath);
                    }
                }
            } catch (err) {
                // Bỏ qua các lỗi khi truy cập file/thư mục
                console.log(`⚠️ Không thể truy cập: ${fullPath}`);
            }
        });
    } catch (err) {
        console.log(`⚠️ Không thể đọc thư mục: ${dir}`);
    }

    return results;
}

/**
 * Kiểm tra VSCode được cài đặt
 */
async function checkVSCode() {
    try {
        await execPromise('code --version');
        console.log('✅ VSCode đã được cài đặt.');
        return true;
    } catch (error) {
        console.error('❌ VSCode CLI không khả dụng. Hãy đảm bảo VSCode đã được cài đặt và trong PATH.');
        return false;
    }
}

/**
 * Kiểm tra GitHub Copilot extension
 */
async function checkCopilotExtension() {
    try {
        const { stdout } = await execPromise('code --list-extensions | grep -i copilot');
        if (stdout.includes('github.copilot') || stdout.includes('GitHub.copilot') || stdout.includes('copilot')) {
            console.log('✅ GitHub Copilot extension đã được cài đặt.');
            return true;
        } else {
            console.error('❌ Không tìm thấy GitHub Copilot extension.');
            return false;
        }
    } catch (error) {
        console.error('❌ Không thể kiểm tra GitHub Copilot extension.');
        return false;
    }
}

/**
 * Tạo tệp VSCode task để tự động review
 */
function createVSCodeTask(filePath) {
    const taskDir = path.join('.vscode', 'tasks');
    const taskFile = path.join(taskDir, 'copilot-review-task.json');

    if (!fs.existsSync(taskDir)) {
        fs.mkdirSync(taskDir, { recursive: true });
    }

    const taskConfig = {
        "version": "2.0.0",
        "tasks": [
            {
                "label": "Copilot Review",
                "type": "shell",
                "command": "echo 'Running Copilot Review for ${file}'",
                "problemMatcher": [],
                "group": {
                    "kind": "build",
                    "isDefault": true
                },
                "presentation": {
                    "reveal": "always",
                    "panel": "new"
                }
            }
        ]
    };

    fs.writeFileSync(taskFile, JSON.stringify(taskConfig, null, 2));
    console.log(`✅ Đã tạo tệp task VSCode tại ${taskFile}`);
}

/**
 * Tạo tệp VSCode keybinding để tự động gọi Copilot review
 */
function createVSCodeKeybinding() {
    // Xác định thư mục cấu hình VSCode dựa trên hệ điều hành
    let configDir;
    if (process.platform === 'win32') {
        configDir = path.join(process.env.APPDATA, 'Code', 'User');
    } else if (process.platform === 'darwin') {
        configDir = path.join(process.env.HOME, 'Library', 'Application Support', 'Code', 'User');
    } else {
        configDir = path.join(process.env.HOME, '.config', 'Code', 'User');
    }

    const keybindingsFile = path.join(configDir, 'keybindings.json');

    // Kiểm tra nếu file đã tồn tại
    let keybindings = [];
    if (fs.existsSync(keybindingsFile)) {
        try {
            keybindings = JSON.parse(fs.readFileSync(keybindingsFile, 'utf8'));
        } catch (error) {
            console.error(`⚠️ Không thể đọc file keybindings hiện tại: ${error.message}`);
            keybindings = [];
        }
    }

    // Kiểm tra xem keybinding đã tồn tại chưa
    const copilotReviewBinding = keybindings.find(kb =>
        kb.command === 'workbench.action.terminal.sendSequence' &&
        kb.args &&
        kb.args.text &&
        kb.args.text.includes('/review')
    );

    if (!copilotReviewBinding) {
        keybindings.push({
            "key": "ctrl+alt+r",
            "command": "workbench.action.terminal.sendSequence",
            "args": { "text": "/review\n" }
        });

        fs.writeFileSync(keybindingsFile, JSON.stringify(keybindings, null, 2));
        console.log(`✅ Đã thêm keybinding Ctrl+Alt+R cho Copilot review`);
    } else {
        console.log('✅ Keybinding cho Copilot review đã tồn tại');
    }
}

/**
 * Tạo file JavaScript để tự động thực hiện review
 */
function createReviewerScript(filePath) {
    const reviewerPath = path.join(CONFIG.outputDir, 'reviewer.js');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const reviewerContent = `
// Reviewer script for ${filePath}

// Function that simulates the Copilot review process
function simulateCopilotReview() {
  // This is a placeholder for actual Copilot review
  // In a real implementation, this would interact with Copilot API
  
  const fileToReview = \`${filePath.replace(/\\/g, '\\\\')}\`;
  const fileContent = \`${fileContent.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`;
  
  // Generate review based on file content
  const review = {
    filename: fileToReview,
    timestamp: new Date().toISOString(),
    suggestions: [
      {
        type: "performance",
        line: 1,
        description: "This is an automatically generated review suggestion. In a real implementation, GitHub Copilot would provide actual code review feedback here."
      }
    ]
  };
  
  return review;
}

// Run the review
const review = simulateCopilotReview();
console.log(JSON.stringify(review, null, 2));
`;

    fs.writeFileSync(reviewerPath, reviewerContent);
    console.log(`✅ Đã tạo script reviewer tại ${reviewerPath}`);

    return reviewerPath;
}

/**
 * Thực hiện review một file với VSCode và Copilot
 */
async function reviewFile(filePath) {
    const outputFile = path.join(CONFIG.outputDir, `${path.basename(filePath)}.review.md`);
    console.log(`🔍 Đang review file: ${filePath}`);

    try {
        // Đọc nội dung file
        const fileContent = fs.readFileSync(filePath, 'utf8');

        // Tạo file markdown review mặc định
        const reviewHeader = `# GitHub Copilot Review: ${filePath}\n\nReview được tạo vào: ${new Date().toISOString()}\n\n`;
        fs.writeFileSync(outputFile, reviewHeader + "Đang thực hiện review...\n", 'utf8');

        // Chuẩn bị lệnh để mở VSCode với file
        const vscodePath = 'code';
        const vscodeArgs = [
            '--wait',         // Đợi cho đến khi VSCode đóng
            '--new-window',   // Mở trong cửa sổ mới
            filePath,         // File cần review
        ];

        // Gợi ý hướng dẫn cho người dùng
        console.log('\n📝 Hướng dẫn để review file:');
        console.log('1. VSCode sẽ mở với file cần review');
        console.log('2. Sử dụng Copilot Chat (Ctrl+Shift+I) và nhập lệnh "/review"');
        console.log('3. Sao chép kết quả review');
        console.log('4. Lưu vào file review được tạo sẵn');
        console.log(`5. File review: ${outputFile}\n`);

        // Tạo script thực hiện review tự động
        const reviewerScript = createReviewerScript(filePath);

        // Thực hiện phân tích code tự động
        const analysisContent = `## Phân tích tự động

### Thông tin cơ bản
- **File:** ${filePath}
- **Kích thước:** ${fileContent.length} ký tự
- **Số dòng:** ${fileContent.split('\n').length} dòng

### Các vấn đề có thể có:
- Kiểm tra cấu trúc code
- Kiểm tra hiệu suất
- Kiểm tra bảo mật
- Kiểm tra các phương pháp tốt nhất

### Đề xuất review với GitHub Copilot:
Để nhận đánh giá chi tiết, vui lòng sử dụng VSCode với GitHub Copilot:
1. Mở file trong VSCode
2. Mở Copilot Chat (Ctrl+Shift+I)
3. Nhập lệnh: /review
4. Sao chép kết quả review vào file này

`;

        // Cập nhật file review với phân tích tự động
        fs.writeFileSync(outputFile, reviewHeader + analysisContent, 'utf8');

        // Mở VSCode với file
        console.log(`🚀 Đang mở VSCode để review file ${filePath}...`);
        try {
            execSync(`code "${filePath}"`, { stdio: 'inherit' });
            console.log(`✅ VSCode đã được mở với file ${filePath}`);
        } catch (error) {
            console.error(`❌ Không thể mở VSCode: ${error.message}`);
        }

        return true;
    } catch (error) {
        console.error(`❌ Lỗi khi review file ${filePath}:`, error.message);

        const errorContent = `# GitHub Copilot Review: ${filePath}\n\nReview được tạo vào: ${new Date().toISOString()}\n\n⚠️ **LỖI KHI REVIEW FILE**\n\n\`\`\`\n${error.message}\n\`\`\`\n\nVui lòng thử lại sau hoặc review thủ công.`;
        fs.writeFileSync(outputFile, errorContent, 'utf8');

        return false;
    }
}

/**
 * Tạo tập lệnh PowerShell để tự động hóa review trong VSCode
 */
function createPowerShellAutomation() {
    const scriptPath = path.join(CONFIG.outputDir, 'auto-review.ps1');

    const psContent = `
# PowerShell script to automate Copilot code review in VSCode
# Requires AutoHotkey on Windows

# Function to simulate keystrokes
function Send-Keystrokes {
    param (
        [string]$text
    )
    
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait($text)
    Start-Sleep -Milliseconds 500
}

# Open Copilot Chat
Write-Host "Opening Copilot Chat..."
Send-Keystrokes("^+i")  # Ctrl+Shift+I
Start-Sleep -Seconds 1

# Type the review command
Write-Host "Typing review command..."
Send-Keystrokes("/review")
Start-Sleep -Milliseconds 500
Send-Keystrokes("{ENTER}")

# Wait for the review to complete
Write-Host "Waiting for review to complete..."
Start-Sleep -Seconds 10

# Select all text
Write-Host "Selecting review text..."
Send-Keystrokes("^a")  # Ctrl+A
Start-Sleep -Milliseconds 500

# Copy the text
Write-Host "Copying review text..."
Send-Keystrokes("^c")  # Ctrl+C

Write-Host "Review completed and copied to clipboard."
`;

    fs.writeFileSync(scriptPath, psContent);
    console.log(`✅ Đã tạo script PowerShell automation tại ${scriptPath}`);
}

/**
 * Tạo tập lệnh Bash để tự động hóa review trong VSCode
 */
function createBashAutomation() {
    const scriptPath = path.join(CONFIG.outputDir, 'auto-review.sh');

    const bashContent = `#!/bin/bash
# Bash script to automate Copilot code review in VSCode
# Requires xdotool on Linux

# Function to simulate keystrokes
send_keystrokes() {
    if command -v xdotool &> /dev/null; then
        xdotool key "$1"
        sleep 0.5
    else
        echo "xdotool not found. Please install it with: sudo apt-get install xdotool"
        exit 1
    fi
}

# Wait for VSCode to be in focus
echo "Please focus on VSCode window in 5 seconds..."
sleep 5

# Open Copilot Chat
echo "Opening Copilot Chat..."
send_keystrokes "ctrl+shift+i"
sleep 1

# Type the review command
echo "Typing review command..."
xdotool type "/review"
sleep 0.5
send_keystrokes "Return"

# Wait for the review to complete
echo "Waiting for review to complete..."
sleep 10

# Select all text
echo "Selecting review text..."
send_keystrokes "ctrl+a"
sleep 0.5

# Copy the text
echo "Copying review text..."
send_keystrokes "ctrl+c"

echo "Review completed and copied to clipboard."
`;

    fs.writeFileSync(scriptPath, bashContent);
    fs.chmodSync(scriptPath, '755');
    console.log(`✅ Đã tạo script Bash automation tại ${scriptPath}`);
}

/**
 * Tạo hướng dẫn sử dụng cho người dùng
 */
function createUserGuide() {
    const guidePath = path.join(CONFIG.outputDir, 'README.md');

    const guideContent = `# GitHub Copilot Review Automation Guide

## Tổng quan

Script này giúp tự động hóa quy trình review code với GitHub Copilot trong VSCode. Nó sẽ quét các file trong project của bạn, mở chúng trong VSCode và chuẩn bị các file review.

## Cách sử dụng

### Yêu cầu
- VSCode đã được cài đặt
- GitHub Copilot extension đã được cài đặt và kích hoạt trong VSCode

### Các bước thực hiện review tự động

1. Chạy script: \`node vscode-copilot-review.js\`
2. Script sẽ tạo các file review trong thư mục \`${CONFIG.outputDir}\`
3. Với mỗi file, VSCode sẽ tự động mở
4. Bạn cần thực hiện các bước sau trong VSCode:
   - Mở Copilot Chat (Ctrl+Shift+I)
   - Nhập lệnh \`/review\`
   - Sao chép kết quả review
   - Dán vào file review tương ứng trong thư mục \`${CONFIG.outputDir}\`

### Script tự động hóa

Script đã tạo các tập lệnh tự động hóa cho Windows (PowerShell) và Linux (Bash):

#### Windows (PowerShell)
\`\`\`
${CONFIG.outputDir}/auto-review.ps1
\`\`\`

#### Linux (Bash - yêu cầu xdotool)
\`\`\`
${CONFIG.outputDir}/auto-review.sh
\`\`\`

## Tùy chỉnh

Bạn có thể tùy chỉnh cấu hình trong script \`vscode-copilot-review.js\`:
- \`extensions\`: Loại file cần review
- \`excludePaths\`: Thư mục/file cần loại trừ
- \`outputDir\`: Thư mục lưu kết quả review

## Khắc phục sự cố

- Nếu VSCode không mở, hãy kiểm tra xem lệnh \`code\` đã có trong PATH
- Nếu GitHub Copilot không hoạt động, hãy đảm bảo bạn đã đăng nhập và kích hoạt extension

## Lưu ý

- Đây là phương pháp bán tự động vì GitHub Copilot không có API chính thức
- Kết quả review cần được đánh giá bởi con người
`;

    fs.writeFileSync(guidePath, guideContent);
    console.log(`📝 Đã tạo hướng dẫn sử dụng tại ${guidePath}`);
}

/**
 * Hàm chính
 */
async function main() {
    try {
        console.log('🚀 Bắt đầu quá trình review với GitHub Copilot...');

        // Kiểm tra VSCode đã được cài đặt
        const vsCodeInstalled = await checkVSCode();
        if (!vsCodeInstalled) {
            console.error('❌ VSCode cần được cài đặt để tiếp tục.');
            process.exit(1);
        }

        // Kiểm tra GitHub Copilot extension
        const copilotInstalled = await checkCopilotExtension();
        if (!copilotInstalled) {
            console.warn('⚠️ Không phát hiện được GitHub Copilot extension. Tiếp tục nhưng có thể gặp vấn đề.');
        }

        // Tạo VSCode tasks cho tự động hóa
        createVSCodeTask();

        // Tạo VSCode keybinding
        createVSCodeKeybinding();

        // Tạo script tự động hóa
        createPowerShellAutomation();
        createBashAutomation();

        // Lấy danh sách tất cả các file cần review
        console.log('📁 Đang quét project để tìm các file cần review...');
        let files = getAllFiles('.', CONFIG.extensions, CONFIG.excludePaths);
        console.log(`🔢 Tìm thấy ${files.length} file cần review.`);

        if (files.length === 0) {
            console.log('❓ Không tìm thấy file nào để review. Vui lòng kiểm tra lại cấu hình.');
            process.exit(0);
        }

        // Giới hạn số lượng file
        if (files.length > CONFIG.maxFiles) {
            console.log(`⚠️ Có quá nhiều file (${files.length}). Chỉ review ${CONFIG.maxFiles} file đầu tiên.`);
            files = files.slice(0, CONFIG.maxFiles);
        }

        // Tạo README hướng dẫn sử dụng
        createUserGuide();

        // Review từng file
        const results = [];
        for (let i = 0; i < files.length; i++) {
            console.log(`\n📋 File ${i + 1}/${files.length}: ${files[i]}`);
            const result = await reviewFile(files[i]);
            results.push(result);

            // Đợi user nhấn Enter để tiếp tục
            if (i < files.length - 1) {
                console.log('\n⏱️ Nhấn Enter sau khi đã hoàn thành review file này...');
                await new Promise(resolve => {
                    process.stdin.once('data', () => {
                        resolve();
                    });
                });
            }
        }

        console.log('\n🎉 Đã hoàn thành việc chuẩn bị review!');
        console.log(`📊 File review được tạo trong thư mục ${CONFIG.outputDir}`);
        console.log('📝 Làm theo hướng dẫn trong README.md để hoàn thành các review');

    } catch (error) {
        console.error('❌ Lỗi trong quá trình review:', error.message);
        process.exit(1);
    }
}

// Chạy hàm chính
main();