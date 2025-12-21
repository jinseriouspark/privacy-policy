/**
 * 텍스트 입력 검증 및 오타 체크 유틸리티
 */

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  suggestions?: string[];
}

/**
 * 일반적인 텍스트 입력 검증
 */
export function validateText(text: string): ValidationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // 1. 연속된 공백 체크
  if (/\s{2,}/.test(text)) {
    warnings.push('연속된 공백이 있습니다');
    suggestions.push(text.replace(/\s+/g, ' '));
  }

  // 2. 앞뒤 공백 체크
  if (text !== text.trim()) {
    warnings.push('앞뒤 공백이 있습니다');
    suggestions.push(text.trim());
  }

  // 3. 특수문자 반복 체크 (!!!, ???, ...)
  if (/([!?.]){3,}/.test(text)) {
    warnings.push('특수문자가 과도하게 반복됩니다');
  }

  // 4. 전각/반각 혼용 체크
  const hasFullWidth = /[\uff01-\uff5e]/.test(text);
  const hasHalfWidth = /[!-~]/.test(text);
  if (hasFullWidth && hasHalfWidth) {
    warnings.push('전각/반각 문자가 혼용되어 있습니다');
  }

  // 5. 숫자와 한글이 붙어있는 경우 (띄어쓰기 권장)
  if (/[가-힣]\d|\d[가-힣]/.test(text)) {
    warnings.push('숫자와 한글 사이에 띄어쓰기를 권장합니다');
  }

  // 6. 일반적인 오타 패턴 체크
  const commonTypos: Record<string, string> = {
    '겟습니다': '습니다',
    '갔습니다': '습니다',
    '됩니다': '됩니다',
    '업습니다': '습니다',
    '엇습니다': '습니다',
    '읍니다': '습니다',
    '이써': '이서',
    '잇습니다': '있습니다',
    '읶습니다': '인습니다',
  };

  Object.entries(commonTypos).forEach(([typo, correct]) => {
    if (text.includes(typo)) {
      warnings.push(`"${typo}" → "${correct}"로 수정하시겠습니까?`);
      suggestions.push(text.replace(new RegExp(typo, 'g'), correct));
    }
  });

  // 7. 템플 관련 특수 용어 체크
  const templeTerms: Record<string, string> = {
    '부처': '부처님',
    '법회': '법회',
    '예불': '예불',
    '참선': '참선',
    '정진': '정진',
    '수행': '수행',
  };

  // 8. 중복 단어 체크
  const words = text.split(/\s+/);
  const duplicates = words.filter((word, idx) =>
    word.length > 1 && words.indexOf(word) !== idx
  );
  if (duplicates.length > 0) {
    warnings.push(`중복된 단어가 있습니다: ${[...new Set(duplicates)].join(', ')}`);
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}

/**
 * 제목 특화 검증
 */
export function validateTitle(title: string): ValidationResult {
  const baseValidation = validateText(title);
  const warnings = [...baseValidation.warnings];

  // 제목은 너무 길면 안됨 (50자 제한 권장)
  if (title.length > 50) {
    warnings.push('제목이 너무 깁니다 (50자 이하 권장)');
  }

  // 제목은 너무 짧으면 안됨
  if (title.trim().length < 2) {
    warnings.push('제목이 너무 짧습니다');
  }

  // 제목에 특수문자만 있는 경우
  if (/^[^가-힣a-zA-Z0-9]+$/.test(title.trim())) {
    warnings.push('제목에 의미 있는 텍스트를 입력하세요');
  }

  return {
    ...baseValidation,
    warnings,
  };
}

/**
 * 법명 검증
 */
export function validateDharmaName(name: string): ValidationResult {
  const warnings: string[] = [];

  // 법명은 한글만
  if (!/^[가-힣\s]*$/.test(name)) {
    warnings.push('법명은 한글만 입력 가능합니다');
  }

  // 법명은 2-5자 권장
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    warnings.push('법명이 너무 짧습니다');
  }
  if (trimmed.length > 5) {
    warnings.push('법명이 너무 깁니다 (일반적으로 2-5자)');
  }

  // 공백 포함 체크
  if (trimmed.includes(' ')) {
    warnings.push('법명에 공백이 포함되어 있습니다');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}

/**
 * 자동 수정 제안
 */
export function autoCorrect(text: string): string {
  let corrected = text;

  // 1. 연속 공백 제거
  corrected = corrected.replace(/\s+/g, ' ');

  // 2. 앞뒤 공백 제거
  corrected = corrected.trim();

  // 3. 일반적인 오타 자동 수정
  const autoFixes: Record<string, string> = {
    '겟습니다': '습니다',
    '업습니다': '습니다',
    '엇습니다': '습니다',
    '읍니다': '습니다',
    '이써': '이서',
    '잇습니다': '있습니다',
  };

  Object.entries(autoFixes).forEach(([typo, correct]) => {
    corrected = corrected.replace(new RegExp(typo, 'g'), correct);
  });

  return corrected;
}

/**
 * 실시간 검증용 디바운스된 검증
 */
export function createDebouncedValidator(
  callback: (result: ValidationResult) => void,
  delay: number = 500
) {
  let timeoutId: NodeJS.Timeout;

  return (text: string, validatorFn: (text: string) => ValidationResult) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const result = validatorFn(text);
      callback(result);
    }, delay);
  };
}
