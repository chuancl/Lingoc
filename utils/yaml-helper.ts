
/**
 * Simple YAML Helper for Configuration Management
 * Optimized for robustness: uses JSON-stringified values for strings to safely handle newlines/special chars.
 */

interface FieldMetadata {
    key: string;
    comment: string;
    options?: string;
    type?: 'string' | 'boolean' | 'number' | 'array' | 'object';
}

// --------------------------------------------------------------------------------
// METADATA DEFINITIONS (For Comments)
// --------------------------------------------------------------------------------

// 1. General
const generalFields: FieldMetadata[] = [
    { key: 'enabled', comment: '总开关：默认开启翻译', options: 'true | false' },
    { key: 'translateWholePage', comment: '扫描范围：是否扫描整个页面（包括侧边栏等）', options: 'true | false' },
    { key: 'bilingualMode', comment: '双语对照：在段落末尾追加完整中文译文', options: 'true | false' },
    { key: 'aggressiveMode', comment: '激进匹配：启用词典API进行模糊匹配（消耗较大）', options: 'true | false' },
    { key: 'matchInflections', comment: '词态匹配：是否自动识别单词变形', options: 'true | false' },
    { key: 'ttsSpeed', comment: '朗读速度：TTS 播放倍速', options: '0.25 - 3.0' },
    { key: 'blacklist', comment: '黑名单域名列表', type: 'array' },
    { key: 'whitelist', comment: '白名单域名列表', type: 'array' }
];

// 2. Visual Styles
const styleFields: FieldMetadata[] = [
    { key: 'color', comment: '文字颜色 (Hex)', type: 'string' },
    { key: 'backgroundColor', comment: '背景颜色 (Hex)', type: 'string' },
    { key: 'isBold', comment: '是否加粗', options: 'true | false' },
    { key: 'layoutMode', comment: '布局模式', options: 'horizontal | vertical' },
    { key: 'densityMode', comment: '密度模式', options: 'count | percent' },
    { key: 'densityValue', comment: '密度值', type: 'number' },
    { key: 'originalText', comment: '原文样式配置', type: 'object' },
    { key: 'horizontal', comment: '水平布局详细配置', type: 'object' },
    { key: 'vertical', comment: '垂直布局详细配置', type: 'object' }
];

// 3. Scenarios
const scenarioFields: FieldMetadata[] = [
    { key: 'id', comment: '场景 ID', type: 'string' },
    { key: 'name', comment: '场景名称', type: 'string' },
    { key: 'isActive', comment: '是否激活', options: 'true | false' },
];

// 4. Interaction
const interactionFields: FieldMetadata[] = [
    { key: 'bubblePosition', comment: '气泡位置', options: 'top | bottom | left | right' },
    { key: 'autoPronounce', comment: '自动朗读', options: 'true | false' },
    { key: 'mainTrigger', comment: '主触发方式配置', type: 'object' },
    { key: 'quickAddTrigger', comment: '快速添加触发配置', type: 'object' },
    { key: 'onlineDictUrl', comment: '在线词典链接模板', type: 'string' },
];

// 5. Page Widget
const pageWidgetFields: FieldMetadata[] = [
    { key: 'enabled', comment: '启用悬浮球', options: 'true | false' },
    { key: 'showSections', comment: '显示的单词分类 (known/want/learning)', type: 'object' },
    { key: 'cardDisplay', comment: '卡片内容排序与开关', type: 'array' },
    { key: 'showPhonetic', comment: '显示音标', options: 'true | false' },
    { key: 'showMeaning', comment: '显示释义', options: 'true | false' },
    { key: 'modalPosition', comment: '弹窗位置', type: 'object' },
    { key: 'modalSize', comment: '弹窗大小', type: 'object' },
];

// 6. Engines
const engineFields: FieldMetadata[] = [
    { key: 'id', comment: '引擎ID', type: 'string' },
    { key: 'name', comment: '引擎名称', type: 'string' },
    { key: 'type', comment: '类型', options: 'standard | ai' },
    { key: 'isEnabled', comment: '是否启用', options: 'true | false' },
    { key: 'apiKey', comment: 'API Key (已加密/脱敏)', type: 'string' },
    { key: 'isWebSimulation', comment: '是否网页模拟', options: 'true | false' },
];

// 7. Anki
const ankiFields: FieldMetadata[] = [
    { key: 'enabled', comment: '启用集成', options: 'true | false' },
    { key: 'url', comment: 'AnkiConnect 地址', type: 'string' },
    { key: 'deckNameWant', comment: '想学牌组', type: 'string' },
    { key: 'deckNameLearning', comment: '在学牌组', type: 'string' },
    { key: 'templates', comment: '卡片模板 (HTML)', type: 'object' },
    { key: 'syncScope', comment: '同步范围', type: 'object' },
];

// --------------------------------------------------------------------------------
// GENERATOR (EXPORT)
// --------------------------------------------------------------------------------

const indent = (level: number) => '  '.repeat(level);

/**
 * Safely dumps a value to a YAML-compatible string.
 * Uses JSON.stringify for strings to handle escaping/newlines perfectly.
 */
const dumpValue = (value: any, level: number): string => {
    if (value === null || value === undefined) return 'null';
    
    // Primitives
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return value.toString();
    
    // Strings: Always use JSON.stringify to handle escapes (\n, ", etc.) safely
    if (typeof value === 'string') {
        return JSON.stringify(value);
    }

    // Arrays
    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        // Check for simple primitives array
        if (value.every(v => typeof v !== 'object')) {
            return `[${value.map(v => JSON.stringify(v)).join(', ')}]`;
        }
        // Object array
        let str = '\n';
        value.forEach(item => {
            // Trim start to align dash with indentation
            str += `${indent(level)}- ${dumpObject(item, level + 1, [], true).trimStart()}`;
        });
        return str;
    }

    // Objects
    if (typeof value === 'object') {
        return '\n' + dumpObject(value, level + 1);
    }

    return String(value);
};

const dumpObject = (obj: any, level: number, metadata: FieldMetadata[] = [], isListItem: boolean = false): string => {
    let output = '';
    const keys = Object.keys(obj || {});
    
    keys.forEach((key, index) => {
        const val = obj[key];
        const meta = metadata.find(m => m.key === key);
        
        // Add comment only if exists and not inside a compact list item to avoid clutter
        if (meta && !isListItem) {
            output += `${indent(level)}# ${meta.comment}`;
            if (meta.options) output += ` (${meta.options})`;
            output += '\n';
        }

        // Handle indentation: first item of a list starts with nothing (handled by caller's dash)
        const prefix = (isListItem && index === 0) ? '' : indent(level);
        output += `${prefix}${key}: ${dumpValue(val, level)}\n`;
    });
    return output;
};

export const generateConfigYaml = (fullConfig: any): string => {
    let yaml = `# ContextLingo 配置文件\n# Exported: ${new Date().toLocaleString()}\n`;

    const sections = [
        { key: 'general', title: '1. General Settings', meta: generalFields },
        { key: 'styles', title: '2. Visual Styles', meta: styleFields, isMap: true },
        { key: 'scenarios', title: '3. Scenarios', meta: scenarioFields, isArray: true },
        { key: 'interaction', title: '4. Interaction', meta: interactionFields },
        { key: 'pageWidget', title: '5. Page Widget', meta: pageWidgetFields },
        { key: 'engines', title: '6. Translation Engines', meta: engineFields, isArray: true },
        { key: 'anki', title: '7. Anki Integration', meta: ankiFields }
    ];

    sections.forEach(sec => {
        yaml += `\n# ==================================================\n# ${sec.title}\n# ==================================================\n`;
        const val = fullConfig[sec.key];
        
        if (sec.isMap) {
            // Special case for Styles map
            yaml += `${sec.key}:\n`;
            Object.keys(val).forEach(subKey => {
                yaml += `  "${subKey}":\n${dumpObject(val[subKey], 2, sec.meta)}`;
            });
        } else if (sec.isArray) {
            // Arrays (Engines, Scenarios)
            yaml += `${sec.key}:\n`;
            if (Array.isArray(val)) {
                val.forEach((item: any) => {
                    yaml += `  - ${dumpObject(item, 2, sec.meta, true).trimStart()}`;
                });
            } else {
                yaml += `  []\n`;
            }
        } else {
            // Standard Objects
            yaml += `${sec.key}:\n${dumpObject(val, 1, sec.meta)}`;
        }
    });

    return yaml;
};

// --------------------------------------------------------------------------------
// PARSER (IMPORT) - ROBUST IMPLEMENTATION
// --------------------------------------------------------------------------------

/**
 * A more robust recursive descent parser for our subset of YAML.
 * Safely handles:
 * - Nested objects (indentation based)
 * - Arrays of objects (dash `-`)
 * - Quoted strings with escapes (using JSON.parse)
 * - Comments (ignores lines starting with # or content after # outside quotes)
 */
export const parseConfigYaml = (yaml: string): any => {
    const lines = yaml.split('\n');
    let currentLine = 0;

    const getLine = () => {
        if (currentLine >= lines.length) return null;
        let line = lines[currentLine];
        
        // Remove comments (safely, simplistic approach assuming comments are at end of line or start)
        // Note: Complex case like "color": "#FFF" is handled by regex extraction below instead of naive split
        const commentIdx = line.indexOf('#');
        // Only strip if # is likely a comment (not inside quotes). 
        // For simplicity in this config format, we assume comments are usually on their own lines or clearly separated.
        // We will strip comments during parsing of value.
        
        // Return raw line for indentation analysis
        return line;
    };

    const countIndent = (line: string) => {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
    };

    const parseValue = (valStr: string): any => {
        valStr = valStr.trim();
        if (!valStr) return null;
        
        // Handle Comments at end of line (e.g., true # default)
        // But be careful with colors like "#FFF" or strings "End #1"
        // Heuristic: If it looks like a quoted string, parse it first
        if (valStr.startsWith('"') || valStr.startsWith("'")) {
             try {
                 // Try parsing as JSON string (supports escapes)
                 // If it starts with ', replace with " for JSON compat (simple cases)
                 if (valStr.startsWith("'")) valStr = `"${valStr.slice(1, -1).replace(/"/g, '\\"')}"`;
                 
                 // Find closing quote
                 const firstQuote = valStr[0];
                 let endQuoteIdx = -1;
                 for (let i = 1; i < valStr.length; i++) {
                     if (valStr[i] === firstQuote && valStr[i-1] !== '\\') {
                         endQuoteIdx = i;
                         break;
                     }
                 }
                 if (endQuoteIdx > -1) {
                     return JSON.parse(valStr.substring(0, endQuoteIdx + 1));
                 }
             } catch (e) { /* ignore */ }
        }

        // Remove comments for non-quoted values
        const commentIdx = valStr.indexOf('#');
        if (commentIdx > -1) valStr = valStr.substring(0, commentIdx).trim();

        if (valStr === 'true') return true;
        if (valStr === 'false') return false;
        if (valStr === 'null') return null;
        if (valStr === '[]') return [];
        if (valStr === '{}') return {};
        
        const num = Number(valStr);
        if (!isNaN(num) && valStr !== '') return num;

        // Fallback string
        return valStr.replace(/^["']|["']$/g, '');
    };

    const parseBlock = (minIndent: number): any => {
        const result: any = {};
        const listResult: any[] = [];
        let isListMode = false;

        while (currentLine < lines.length) {
            const line = getLine();
            if (line === null) break;
            
            // Skip empty lines or full comment lines
            if (!line.trim() || line.trim().startsWith('#')) {
                currentLine++;
                continue;
            }

            const indentLevel = countIndent(line);
            
            // End of block
            if (indentLevel < minIndent) {
                break;
            }

            const content = line.trim();
            
            // Array Item
            if (content.startsWith('-')) {
                isListMode = true;
                const valuePart = content.substring(1).trim();
                
                if (!valuePart) {
                    // Object inside list (on next lines)
                    // e.g. 
                    // - 
                    //   id: 1
                    currentLine++;
                    listResult.push(parseBlock(indentLevel + 1)); // Assuming sub-indent
                } else if (valuePart.includes(':') && !valuePart.startsWith('"') && !valuePart.startsWith("'")) {
                    // Inline Object definition start: "- key: value"
                    // Treat "- " as part of indentation for the object
                    // We construct a virtual block for the object
                    const keyColonIdx = valuePart.indexOf(':');
                    const key = valuePart.substring(0, keyColonIdx).trim();
                    const valStr = valuePart.substring(keyColonIdx + 1).trim();
                    
                    currentLine++; // Consume this line
                    
                    // Start an object with this key
                    const obj = parseBlock(indentLevel + 2); // Recursively parse rest of object properties
                    // But we need to add the inline key/value first
                    if (valStr) {
                        obj[key] = parseValue(valStr);
                    } else {
                        // Value is on next line? Not handled in this simplified parser for inline start
                        // But wait, parseBlock(indentLevel + 2) handles subsequent lines.
                        // We just need to merge {key: val} into it if val exists, or let parseBlock handle children
                        // Actually, if valStr is empty, the children are in parseBlock.
                        // If valStr is not empty, it's a primitive prop.
                    }
                    
                    // Wait, parseBlock parses *lines*. We consumed the line.
                    // The object properties are on subsequent lines with higher indent.
                    // But we missed the property on *this* line.
                    // Better approach: Treat "- key: val" as:
                    //   key: val
                    //   ... other props
                    // So we create the object, assign the inline prop, then parse subsequent lines.
                    
                    const objItem: any = {};
                    if (valStr) {
                        objItem[key] = parseValue(valStr);
                    } else {
                        // key: <newline> object
                        objItem[key] = parseBlock(indentLevel + 2); // Heuristic indent
                    }
                    
                    // Merge with subsequent lines that belong to this item
                    const rest = parseBlock(indentLevel + 1); // Indent relative to dash
                    Object.assign(objItem, rest);
                    
                    listResult.push(objItem);
                } else {
                    // Primitive array item: "- value"
                    listResult.push(parseValue(valuePart));
                    currentLine++;
                }
            } 
            // Key-Value Pair
            else if (content.includes(':')) {
                // Careful with colons in strings. Assuming keys don't have colons.
                const colonIdx = content.indexOf(':');
                const key = content.substring(0, colonIdx).trim().replace(/['"]/g, '');
                const valStr = content.substring(colonIdx + 1).trim();
                
                currentLine++;

                if (valStr) {
                    // Value is inline
                    result[key] = parseValue(valStr);
                } else {
                    // Value is a nested block (object or array)
                    result[key] = parseBlock(indentLevel + 1);
                }
            } else {
                // Unknown format or continuation? Skip
                currentLine++;
            }
        }

        return isListMode ? listResult : result;
    };

    return parseBlock(0);
};
