export const VALIDATION_LIMITS = {
  username: { min: 2, max: 50 },
  phrase: { min: 1, max: 200 },
  meaning: { min: 1, max: 500 },
  contact: { min: 1, max: 1000 },
  aiInput: { min: 1, max: 2000 },
  answer: { min: 1, max: 200 },
};

export function normalizeText(value) {
  return String(value || "").trim();
}

export function isValidEmail(value) {
  const email = normalizeText(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(value) {
  const password = String(value || "");
  return password.length >= 8 && password.length <= 16;
}

export function validateUsername(value) {
  const username = normalizeText(value);
  if (!username) {
    return "ユーザー名を入力してください。";
  }
  const { min, max } = VALIDATION_LIMITS.username;
  if (username.length < min || username.length > max) {
    return `ユーザー名は${min}~${max}文字で入力してください。`;
  }
  return "";
}

export function validateEmail(value) {
  const email = normalizeText(value);
  if (!email) {
    return "メールアドレスを入力してください。";
  }
  if (email.length > 254) {
    return "メールアドレスが長すぎます。";
  }
  if (!isValidEmail(email)) {
    return "メールアドレスを正しく入力してください。";
  }
  return "";
}

export function validatePassword(value, label = "パスワード") {
  const password = String(value || "");
  if (!password) {
    return `${label}を入力してください。`;
  }
  if (!isValidPassword(password)) {
    return `${label}は8~16文字で入力してください。`;
  }
  return "";
}

export function validatePasswordConfirmation(password, confirm) {
  if (String(password || "") !== String(confirm || "")) {
    return "パスワードが一致しません。";
  }
  return "";
}

export function validateTextLength(value, { label, min, max }) {
  const text = normalizeText(value);
  if (!text) {
    return `${label}を入力してください。`;
  }
  if (min && text.length < min) {
    return `${label}は${min}文字以上で入力してください。`;
  }
  if (max && text.length > max) {
    return `${label}は${max}文字以内で入力してください。`;
  }
  return "";
}

export function validatePhrase(value) {
  return validateTextLength(value, {
    label: "単語・フレーズ",
    ...VALIDATION_LIMITS.phrase,
  });
}

export function validateMeaning(value) {
  return validateTextLength(value, {
    label: "意味",
    ...VALIDATION_LIMITS.meaning,
  });
}

export function validateContactContent(value) {
  return validateTextLength(value, {
    label: "お問い合わせ内容",
    ...VALIDATION_LIMITS.contact,
  });
}

export function validateAiInput(value) {
  return validateTextLength(value, {
    label: "英文",
    ...VALIDATION_LIMITS.aiInput,
  });
}

export function validateAnswer(value) {
  return validateTextLength(value, {
    label: "回答",
    ...VALIDATION_LIMITS.answer,
  });
}

export function normalizeAnswer(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
