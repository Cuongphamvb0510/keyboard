export function normalizeTelex(input) {
  const TONE_MAP = {
    f: 0, // huyền
    s: 1, // sắc
    r: 2, // hỏi
    x: 3, // ngã
    j: 4  // nặng
  };

  const VOWEL_TONE_MAP = {
    'a': ['à', 'á', 'ả', 'ã', 'ạ'],
    'ă': ['ằ', 'ắ', 'ẳ', 'ẵ', 'ặ'],
    'â': ['ầ', 'ấ', 'ẩ', 'ẫ', 'ậ'],
    'e': ['è', 'é', 'ẻ', 'ẽ', 'ẹ'],
    'ê': ['ề', 'ế', 'ể', 'ễ', 'ệ'],
    'i': ['ì', 'í', 'ỉ', 'ĩ', 'ị'],
    'o': ['ò', 'ó', 'ỏ', 'õ', 'ọ'],
    'ô': ['ồ', 'ố', 'ổ', 'ỗ', 'ộ'],
    'ơ': ['ờ', 'ớ', 'ở', 'ỡ', 'ợ'],
    'u': ['ù', 'ú', 'ủ', 'ũ', 'ụ'],
    'ư': ['ừ', 'ứ', 'ử', 'ữ', 'ự'],
    'y': ['ỳ', 'ý', 'ỷ', 'ỹ', 'ỵ']
  };

  // Tạo reverse map để tìm nguyên âm gốc từ nguyên âm có dấu
  const REVERSE_VOWEL_MAP = {};
  for (let base in VOWEL_TONE_MAP) {
    for (let toned of VOWEL_TONE_MAP[base]) {
      REVERSE_VOWEL_MAP[toned] = base;
    }
  }

  const VOWEL_PRIORITY = ['ê', 'ơ', 'ô', 'ă', 'â', 'ư', 'a', 'e', 'i', 'o', 'u', 'y'];

  input = input.toLowerCase();
  const originalInput = input;

  // Kiểm tra xem có phải đang gõ dấu lần 2 không
  const lastChar = input[input.length - 1];
  if (lastChar in TONE_MAP && input.length >= 2) {
    const secondLastChar = input[input.length - 2];
    
    // Nếu ký tự trước đó cũng là dấu giống vậy
    if (secondLastChar === lastChar) {
      // Bỏ dấu và giữ lại ký tự
      const beforeDouble = input.substring(0, input.length - 2);
      
      // Tìm và bỏ dấu trong từ
      let processed = beforeDouble;
      let foundTone = false;
      
      // Duyệt từ phải sang trái để tìm nguyên âm có dấu
      const chars = [...processed];
      for (let i = chars.length - 1; i >= 0; i--) {
        if (REVERSE_VOWEL_MAP[chars[i]]) {
          chars[i] = REVERSE_VOWEL_MAP[chars[i]];
          foundTone = true;
          break;
        }
      }
      
      if (foundTone) {
        return chars.join('') + lastChar;
      }
      
      return input; // Không có dấu để bỏ, giữ nguyên
    }
  }

  // 1. Tách dấu thanh ở cuối từ
  let tone = null;
  
  // Kiểm tra ký tự cuối có phải là dấu thanh không
  if (lastChar in TONE_MAP) {
    // Kiểm tra xem có nguyên âm trước đó không
    const beforeLastChar = input.substring(0, input.length - 1);
    const hasVowel = /[aeiouăâêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(beforeLastChar);
    
    if (hasVowel) {
      tone = TONE_MAP[lastChar];
      input = beforeLastChar;
    }
  }

  // 2. Ghép nguyên âm đặc biệt
  input = input.replace(/dd/g, 'đ');
  input = input.replace(/aa/g, 'â');
  input = input.replace(/aw/g, 'ă');
  input = input.replace(/ee/g, 'ê');
  input = input.replace(/oo/g, 'ô');
  input = input.replace(/ow/g, 'ơ');
  input = input.replace(/uw/g, 'ư');
  
  // Chỉ xóa w ở cuối từ nếu nó theo sau một nguyên âm đặc biệt
  if (input.endsWith('w') && (originalInput.includes('aw') || originalInput.includes('ow') || originalInput.includes('uw'))) {
    input = input.substring(0, input.length - 1);
  }

  // 3. Tìm vị trí nguyên âm ưu tiên để đặt dấu
  const chars = [...input];
  const vowelPositions = [];

  for (let i = 0; i < chars.length; i++) {
    let c = chars[i];
    if (VOWEL_TONE_MAP[c]) {
      const priority = VOWEL_PRIORITY.indexOf(c);
      vowelPositions.push({ priority: priority === -1 ? 100 : priority, index: i, char: c });
    }
  }

  if (vowelPositions.length === 0 || tone === null) {
    return input;
  }

  // Chọn nguyên âm ưu tiên nhất để đặt dấu
  vowelPositions.sort((a, b) => a.priority - b.priority);
  const { index, char } = vowelPositions[0];
  chars[index] = VOWEL_TONE_MAP[char][tone];

  return chars.join('');
}

// Hàm để lấy từ hiện tại từ vị trí cursor
export function getCurrentWord(text, cursorPosition) {
  // Tìm điểm bắt đầu của từ
  let start = cursorPosition;
  while (start > 0 && text[start - 1] !== ' ') {
    start--;
  }
  
  // Tìm điểm kết thúc của từ
  let end = cursorPosition;
  while (end < text.length && text[end] !== ' ') {
    end++;
  }
  
  return {
    word: text.substring(start, end),
    start: start,
    end: end
  };
}

// Hàm xử lý input với Telex
export function processVietnameseInput(currentText, cursorPosition, newChar) {
  // Nếu đang gõ space, không cần xử lý Telex
  if (newChar === ' ') {
    const newText = currentText.substring(0, cursorPosition) + newChar + currentText.substring(cursorPosition);
    return {
      text: newText,
      cursorPosition: cursorPosition + 1
    };
  }

  // Lấy từ hiện tại
  const { word, start, end } = getCurrentWord(currentText, cursorPosition);
  
  // Thêm ký tự mới vào từ
  const charPosition = cursorPosition - start;
  const newWord = word.slice(0, charPosition) + newChar + word.slice(charPosition);
  
  // Xử lý Telex
  const processedWord = normalizeTelex(newWord);
  
  // Ghép lại văn bản hoàn chỉnh
  const newText = currentText.substring(0, start) + processedWord + currentText.substring(end);
  
  // Tính vị trí cursor mới
  // Nếu từ được xử lý khác với từ gốc, cursor ở cuối từ
  // Ngược lại, cursor ở vị trí sau ký tự vừa thêm
  let newCursorPosition;
  if (processedWord !== newWord) {
    newCursorPosition = start + processedWord.length;
  } else {
    newCursorPosition = cursorPosition + 1;
  }
  
  return {
    text: newText,
    cursorPosition: newCursorPosition
  };
} 