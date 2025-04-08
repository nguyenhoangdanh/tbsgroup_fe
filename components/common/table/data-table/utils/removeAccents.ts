// file: components/common/table/data-table/utils/removeAccents.ts
export default function removeAccents(str: string) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }
  