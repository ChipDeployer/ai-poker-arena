// Global parsed log utility
const parseLogMessage = (logText) => {
  if (!logText) return null;

  if (logText.startsWith('===')) {
    return {
      type: 'separator',
      text: logText.replace(/===/g, '').trim()
    };
  }
  
  if (logText.startsWith('🏆')) {
    return {
      type: 'winner',
      text: logText.replace('🏆', '').trim()
    };
  }

  if (logText.startsWith('🤖')) {
    const match = logText.match(/^🤖\s*([^:]+):\s*(.*)/);
    if (match) {
      return {
        type: 'thought',
        name: match[1].trim(),
        content: match[2].trim()
      };
    }
  }

  if (logText.startsWith('➔')) {
    const match = logText.match(/^➔\s*([^\s]+(?:\s+[^\s]+)*?)\s*робить:\s*(.*)/);
    if (match) {
      return {
        type: 'action',
        name: match[1].trim(),
        content: match[2].trim()
      };
    }
  }
  
  return {
    type: 'system',
    content: logText
  };
};

export { parseLogMessage };
