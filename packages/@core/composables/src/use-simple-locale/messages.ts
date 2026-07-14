export type Locale =
  | 'en-US'
  | 'zh-CN'
  | 'zh-TW'
  | 'zh-HK'
  | 'ja-JP'
  | 'ko-KR'
  | 'id-ID'
  | 'vi-VN'
  | 'th-TH'
  | 'ms-MY';

export const messages: Record<Locale, Record<string, string>> = {
  'en-US': {
    cancel: 'Cancel',
    collapse: 'Collapse',
    confirm: 'Confirm',
    expand: 'Expand',
    prompt: 'Prompt',
    reset: 'Reset',
    submit: 'Submit',
  },
  'zh-CN': {
    cancel: '取消',
    collapse: '收起',
    confirm: '确认',
    expand: '展开',
    prompt: '提示',
    reset: '重置',
    submit: '提交',
  },
  'zh-TW': {
    cancel: '取消',
    collapse: '收起',
    confirm: '確認',
    expand: '展開',
    prompt: '提示',
    reset: '重設',
    submit: '提交',
  },
  'zh-HK': {
    cancel: '取消',
    collapse: '收起',
    confirm: '確認',
    expand: '展開',
    prompt: '提示',
    reset: '重設',
    submit: '提交',
  },
  'ja-JP': {
    cancel: 'キャンセル',
    collapse: '折りたたむ',
    confirm: '確認',
    expand: '展開',
    prompt: 'ヒント',
    reset: 'リセット',
    submit: '送信',
  },
  'ko-KR': {
    cancel: '취소',
    collapse: '접기',
    confirm: '확인',
    expand: '펼치기',
    prompt: '알림',
    reset: '초기화',
    submit: '제출',
  },
  'id-ID': {
    cancel: 'Batal',
    collapse: 'Ciutkan',
    confirm: 'Konfirmasi',
    expand: 'Perluas',
    prompt: 'Petunjuk',
    reset: 'Atur ulang',
    submit: 'Kirim',
  },
  'vi-VN': {
    cancel: 'Hủy',
    collapse: 'Thu gọn',
    confirm: 'Xác nhận',
    expand: 'Mở rộng',
    prompt: 'Gợi ý',
    reset: 'Đặt lại',
    submit: 'Gửi',
  },
  'th-TH': {
    cancel: 'ยกเลิก',
    collapse: 'ย่อ',
    confirm: 'ยืนยัน',
    expand: 'ขยาย',
    prompt: 'คำแนะนำ',
    reset: 'รีเซ็ต',
    submit: 'ส่ง',
  },
  'ms-MY': {
    cancel: 'Batal',
    collapse: 'Runtuh',
    confirm: 'Sahkan',
    expand: 'Kembangkan',
    prompt: 'Petunjuk',
    reset: 'Set semula',
    submit: 'Hantar',
  },
};

export const getMessages = (locale: Locale) => messages[locale];
