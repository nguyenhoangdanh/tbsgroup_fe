/**
 * Get the initials from a full name
 * @param {string} fullName - The full name to parse
 * @param {number} [maxInitials=2] - Maximum number of initials to return
 * @returns {string} Initials in uppercase
 */
export const getInitialsFromName = (
  fullName: string,
  maxInitials: number = 2,
): string => {
  // Return empty string if fullName is not provided
  if (!fullName) return '';

  // Split the name into parts
  const nameParts = fullName
    .trim()
    .split(' ')
    .filter(part => part.length > 0);

  // If no valid parts, return empty string
  if (nameParts.length === 0) return '';

  // For Vietnamese names, we typically want to use the first name (last part)
  // and perhaps the middle name (second to last part if available)
  let initials = '';

  if (nameParts.length === 1) {
    // If only one name part, use the first character of that
    initials = nameParts[0].charAt(0);
  } else if (maxInitials === 1) {
    // If maxInitials is 1, just use the first character of the first name (last part)
    initials = nameParts[nameParts.length - 1].charAt(0);
  } else {
    // Use the standard: first character of first part and first character of last part
    // For Vietnamese names: this would be first character of family name and first character of first name
    const firstPart = nameParts[0];
    const lastPart = nameParts[nameParts.length - 1];

    if (nameParts.length >= maxInitials) {
      // If there are enough name parts, use first character of first maxInitials parts
      initials = nameParts
        .slice(0, maxInitials)
        .map(part => part.charAt(0))
        .join('');
    } else {
      // Otherwise, use all name parts
      initials = nameParts.map(part => part.charAt(0)).join('');
    }
  }

  return initials.toUpperCase();
};

interface DisplayInitialsOptions {
  vietnameseStyle?: boolean;
  maxInitials?: number;
}

/**
 * Advanced function to get display initials based on name type
 * @param {string} fullName - The full name to parse
 * @param {DisplayInitialsOptions} options - Configuration options
 * @returns {string} Initials in uppercase
 */
export const getDisplayInitials = (
  fullName: string,
  options: DisplayInitialsOptions = {},
): string => {
  const {vietnameseStyle = true, maxInitials = 2} = options;

  if (!fullName) return '';

  const nameParts = fullName
    .trim()
    .split(' ')
    .filter(part => part.length > 0);

  if (nameParts.length === 0) return '';

  // Simple case - just one name part
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }

  // For Vietnamese style (prioritize given name)
  if (vietnameseStyle) {
    if (maxInitials === 1) {
      // Just use the first character of the given name (last part)
      return nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    } else if (nameParts.length === 2) {
      // For two part names, use both initials
      return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
    } else {
      // For multi-part Vietnamese names (e.g. Nguyễn Văn An)
      // Use family name and given name (first and last parts)
      const familyInitial = nameParts[0].charAt(0);
      const givenInitial = nameParts[nameParts.length - 1].charAt(0);

      return `${familyInitial}${givenInitial}`.toUpperCase();
    }
  }

  // Western style - use first maxInitials parts
  return nameParts
    .slice(0, maxInitials)
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
};

// Hàm định dạng ngày tháng khi xuất dữ liệu
export function formatDate(value: unknown): string {
  // Kiểm tra nếu là đối tượng Date
  if (value instanceof Date) {
    return `${value.getDate().toString().padStart(2, '0')}/${(value.getMonth() + 1).toString().padStart(2, '0')}/${value.getFullYear()} - ${`${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}:${value.getSeconds().toString().padStart(2, '0')}`}`;
  }

  // Kiểm tra nếu là chuỗi ngày tháng ISO hoặc chuỗi ngày hợp lệ
  if (typeof value === 'string') {
    // Thử chuyển đổi thành Date object
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} - ${`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`}`;
    }
  }

  // Trả về giá trị ban đầu nếu không phải ngày
  return String(value);
}

// Hàm trích xuất giá trị thuần túy từ các cell (bao gồm cả React components)
export function extractPlainValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Nếu là function (thường là cell render function)
  if (typeof value === 'function') {
    return '';
  }

  // Xử lý giá trị ngày tháng
  if (value instanceof Date) {
    return formatDate(value);
  }

  // Kiểm tra xem chuỗi có phải là ngày tháng không
  if (typeof value === 'string') {
    // Kiểm tra các mẫu ngày tháng phổ biến (ISO, US, etc.)
    const dateRegex = /^\d{4}-\d{2}-\d{2}|^\d{2}\/\d{2}\/\d{4}/;
    if (dateRegex.test(value)) {
      return formatDate(value);
    }
  }

  // Nếu là React element
  if (
    value &&
    typeof value === 'object' &&
    (value.type !== undefined ||
      value.props !== undefined ||
      value.$$typeof !== undefined)
  ) {
    // Nếu có props.children là string, trả về
    if (value.props && typeof value.props.children === 'string') {
      return value.props.children;
    }
    // Trường hợp phức tạp khác
    return '';
  }

  // Các kiểu dữ liệu thông thường
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return Object.prototype.toString.call(value);
    }
  }

  // String, number, boolean
  return String(value);
}

// Hàm chuyển đổi ký tự tiếng Việt sang không dấu
export function removeVietnameseAccents(str: string): string {
  if (!str) return '';

  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

