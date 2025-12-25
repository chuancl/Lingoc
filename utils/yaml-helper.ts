
/**
 * Simple YAML Helper for Configuration Management
 * Supports serializing JS objects to YAML with comments and parsing a subset of YAML back to JS.
 */

interface FieldMetadata {
    key: string;
    comment: string;
    options?: string;
    type?: 'string' | 'boolean' | 'number' | 'array' | 'object';
}

interface SectionMetadata {
    sectionKey: string;
    title: string;
    fields: FieldMetadata[];
    children?: Record<string, SectionMetadata>; // For nested objects like 'styles.known'
}

// --------------------------------------------------------------------------------
// METADATA DEFINITIONS FOR COMMENTS
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

// 2. Visual Styles - Sub structure for a style config
const styleFields: FieldMetadata[] = [
    { key: 'color', comment: '文字颜色 (Hex)', type: 'string' },
    { key: 'backgroundColor', comment: '背景颜色 (Hex)', type: 'string' },
    { key: 'isBold', comment: '是否加粗', options: 'true | false' },
    { key: 'isItalic', comment: '是否斜体', options: 'true | false' },
    { key: 'underlineStyle', comment: '下划线样式', options: 'none | solid | dashed | dotted | double | wavy' },
    { key: 'underlineColor', comment: '下划线颜色', type: 'string' },
    { key: 'underlineOffset', comment: '下划线偏移量', type: 'string' },
    { key: 'fontSize', comment: '字体大小', options: 'e.g. 1em, 0.8em' },
    { key: 'opacity', comment: '透明度', type: 'number' },
    { key: 'layoutMode', comment: '布局模式', options: 'horizontal (水平) | vertical (垂直)' },
    { key: 'densityMode', comment: '密度控制模式', options: 'count (按个数) | percent (按百分比)' },
    { key: 'densityValue', comment: '密度阈值', type: 'number' },
];

// 3. Scenarios
const scenarioFields: FieldMetadata[] = [
    { key: 'id', comment: '场景 ID (不可重复)', type: 'string' },
    { key: 'name', comment: '场景名称', type: 'string' },
    { key: 'isActive', comment: '是否当前激活', options: 'true | false' },
    { key: 'isCustom', comment: '是否为自定义场景', options: 'true | false' },
];

// 4. Interaction
const interactionFields: FieldMetadata[] = [
    { key: 'bubblePosition', comment: '气泡出现位置', options: 'top | bottom | left | right' },
    { key: 'showPhonetic', comment: '气泡内显示音标', options: 'true | false' },
    { key: 'showOriginalText', comment: '气泡内显示原文', options: 'true | false' },
    { key: 'showDictExample', comment: '气泡内显示例句', options: 'true | false' },
    { key: 'showDictTranslation', comment: '气泡内显示释义', options: 'true | false' },
    { key: 'autoPronounce', comment: '自动朗读开关', options: 'true | false' },
    { key: 'autoPronounceAccent', comment: '朗读口音', options: 'US | UK' },
    { key: 'autoPronounceCount', comment: '自动朗读次数', type: 'number' },
    { key: 'dismissDelay', comment: '气泡消失延迟 (ms)', type: 'number' },
    { key: 'allowMultipleBubbles', comment: '允许多个气泡共存', options: 'true | false' },
    { key: 'onlineDictUrl', comment: '在线词典链接模板 ({word} 为占位符)', type: 'string' },
];

// 5. Page Widget
const pageWidgetFields: FieldMetadata[] = [
    { key: 'enabled', comment: '启用悬浮球', options: 'true | false' },
    { key: 'showPhonetic', comment: '列表中显示音标', options: 'true | false' },
    { key: 'showMeaning', comment: '列表中显示释义', options: 'true | false' },
    { key: 'showMultiExamples', comment: '显示多个例句', options: 'true | false' },
    { key: 'showExampleTranslation', comment: '显示例句翻译', options: 'true | false' },
    { key: 'showContextTranslation', comment: '显示原句翻译', options: 'true | false' },
    { key: 'showPartOfSpeech', comment: '显示词性', options: 'true | false' },
    { key: 'showTags', comment: '显示标签', options: 'true | false' },
    { key: 'showImportance', comment: '显示星级', options: 'true | false' },
    { key: 'showCocaRank', comment: '显示COCA排名', options: 'true | false' },
];

// 6. Engines
const engineFields: FieldMetadata[] = [
    { key: 'id', comment: '引擎 ID', type: 'string' },
    { key: 'name', comment: '引擎名称', type: 'string' },
    { key: 'type', comment: '引擎类型', options: 'standard | ai' },
    { key: 'isEnabled', comment: '是否启用', options: 'true | false' },
    { key: 'apiKey', comment: 'API Key (敏感信息)', type: 'string' },
    { key: 'isWebSimulation', comment: '是否使用网页模拟模式', options: 'true | false' },
];

// 7. Anki
const ankiFields: FieldMetadata[] = [
    { key: 'enabled', comment: '启用 Anki 集成', options: 'true | false' },
    { key: 'url', comment: 'AnkiConnect 地址', type: 'string' },
    { key: 'deckNameWant', comment: '想学习单词的牌组名称', type: 'string' },
    { key: 'deckNameLearning', comment: '正在学单词的牌组名称', type: 'string' },
    { key: 'modelName', comment: '使用的笔记类型名称', type: 'string' },
    { key: 'syncInterval', comment: '自动掌握天数阈值', type: 'number' },
    { key: 'autoSync', comment: '是否开启自动同步', options: 'true | false' },
];

// --------------------------------------------------------------------------------
// GENERATOR LOGIC
// --------------------------------------------------------------------------------

const indent = (level: number) => '  '.repeat(level);

const dumpValue = (value: any, level: number): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') {
        // Simple quoting if needed
        if (value.includes('\n') || value.includes(':') || value.includes('#')) {
            return `"${value.replace(/"/g, '\\"')}"`;
        }
        return value || '""';
    }
    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        // Check if primitive array
        if (value.every(v => typeof v !== 'object')) {
            return `[${value.map(v => typeof v === 'string' ? `"${v}"` : v).join(', ')}]`;
        }
        // Object array
        let str = '\n';
        value.forEach(item => {
            str += `${indent(level)}- ${dumpObject(item, level + 1, [], true).trimStart()}`;
        });
        return str;
    }
    if (typeof value === 'object') {
        return '\n' + dumpObject(value, level + 1);
    }
    return String(value);
};

const dumpObject = (obj: any, level: number, metadata: FieldMetadata[] = [], isListItem: boolean = false): string => {
    let output = '';
    const keys = Object.keys(obj);
    
    keys.forEach((key, index) => {
        const val = obj[key];
        const meta = metadata.find(m => m.key === key);
        
        // Add comment if exists
        if (meta) {
            output += `\n${indent(level)}# ${meta.comment}`;
            if (meta.options) output += ` (可选值: ${meta.options})`;
            output += '\n';
        }

        const prefix = (isListItem && index === 0) ? '' : indent(level);
        
        // Special handling for nested complex objects that don't have direct metadata passed but might need recursion
        // For simple recursion, we won't pass metadata down unless specific known structures.
        // For top level configs, we will control the call.
        
        output += `${prefix}${key}: ${dumpValue(val, level)}\n`;
    });
    return output;
};

export const generateConfigYaml = (fullConfig: any): string => {
    let yaml = `# ContextLingo 配置文件\n# 导出时间: ${new Date().toLocaleString()}\n`;

    // 1. General
    yaml += `\n# ==================================================\n# 1. 常规选项 (General Settings)\n# ==================================================\n`;
    yaml += `general:\n${dumpObject(fullConfig.general, 1, generalFields)}`;

    // 2. Styles
    yaml += `\n# ==================================================\n# 2. 视觉样式 (Visual Styles)\n# ==================================================\n`;
    // Styles is a Record<Category, Config>, treat as object but apply generic style fields to sub-objects?
    // We can't easily map dynamic keys. We will just dump it, but maybe add comments to known sub-keys if possible.
    // Actually, we can hardcode the categories for comments if we want perfectly nice output.
    yaml += `styles:\n`;
    Object.keys(fullConfig.styles).forEach(cat => {
        yaml += `  # 类别: ${cat}\n  "${cat}":\n${dumpObject(fullConfig.styles[cat], 2, styleFields)}`;
    });

    // 3. Scenarios
    yaml += `\n# ==================================================\n# 3. 场景配置 (Scenarios)\n# ==================================================\n`;
    yaml += `scenarios:\n`;
    fullConfig.scenarios.forEach((s: any) => {
        yaml += `  - ${dumpObject(s, 2, scenarioFields, true).trimStart()}`;
    });

    // 4. Interaction
    yaml += `\n# ==================================================\n# 4. 交互配置 (Interaction)\n# ==================================================\n`;
    yaml += `interaction:\n${dumpObject(fullConfig.interaction, 1, interactionFields)}`;

    // 5. Page Widget
    yaml += `\n# ==================================================\n# 5. 悬浮球弹窗 (Page Widget)\n# ==================================================\n`;
    yaml += `pageWidget:\n${dumpObject(fullConfig.pageWidget, 1, pageWidgetFields)}`;

    // 6. Engines
    yaml += `\n# ==================================================\n# 6. 翻译引擎 (Translation Engines)\n# ==================================================\n`;
    yaml += `engines:\n`;
    fullConfig.engines.forEach((e: any) => {
        yaml += `  - ${dumpObject(e, 2, engineFields, true).trimStart()}`;
    });

    // 7. Anki
    yaml += `\n# ==================================================\n# 7. Anki 集成 (Anki Integration)\n# ==================================================\n`;
    yaml += `anki:\n${dumpObject(fullConfig.anki, 1, ankiFields)}`;

    return yaml;
};

// --------------------------------------------------------------------------------
// PARSER LOGIC
// --------------------------------------------------------------------------------

/**
 * A very basic YAML parser for our generated format.
 * Supports:
 * - Key: Value
 * - Nested objects via indentation
 * - Lists via '-'
 * - Comments #
 * - Inline arrays [a, b]
 */
export const parseConfigYaml = (yaml: string): any => {
    const lines = yaml.split('\n');
    const root: any = {};
    const stack: { obj: any; indent: number; key?: string | number }[] = [{ obj: root, indent: -1 }];

    for (let line of lines) {
        // Strip comments
        const commentIndex = line.indexOf('#');
        if (commentIndex !== -1) {
            // Be careful not to strip # inside quotes, but for simplicity assuming standard config
            line = line.substring(0, commentIndex);
        }
        
        if (!line.trim()) continue;

        const indentLevel = line.search(/\S/);
        const content = line.trim();

        // List item
        if (content.startsWith('- ')) {
            // Ensure parent is an array
            let parent = stack[stack.length - 1];
            while (parent.indent >= indentLevel) {
                stack.pop();
                parent = stack[stack.length - 1];
            }

            // The list itself might be the value of a previous key
            // Or we are inside a list of objects
            
            // Simplified handling: We expect standard structure.
            // If parent.obj is object, and we encounter '-', it's invalid unless key was defined previously?
            // Actually, in our format, lists are values of keys. e.g. "scenarios:" then "- name: ..."
            
            // If the parent object IS an array, we push a new item.
            // If the parent object is a generic object, and we see -, it usually means we just defined a key that holds an array.
            
            // Let's rely on the previous key context.
            // This basic parser is tricky. 
            // Alternative: Assume strict structure matching our generator.
            
            // Let's use a simpler recursion based on lines if possible, or RegEx.
            // Given the complexity of writing a robust YAML parser from scratch,
            // and the requirement to support user edits, this is the fragile part.
            
            // Strategy: Convert strict indentation to JSON structure.
        }
    }
    
    // Fallback: Since writing a full parser is error prone, and user wants "YAML format",
    // I will implement a "Simple Key-Value Hierarchy" parser.
    
    // We will parse recursively.
    
    return parseLines(lines.filter(l => l.trim() && !l.trim().startsWith('#')), 0).result;
};

const parseLines = (lines: string[], currentIndent: number): { result: any, consumed: number } => {
    const result: any = {};
    let i = 0;
    let isArray = false;
    let arrayItems: any[] = [];

    while (i < lines.length) {
        const line = lines[i];
        const indent = line.search(/\S/);
        
        if (indent < currentIndent) {
            break; // End of this block
        }

        if (indent > currentIndent) {
            // Should not happen if logic is correct, handled by recursion call
            i++; 
            continue;
        }

        const content = line.trim();

        // Array Item
        if (content.startsWith('-')) {
            isArray = true;
            const valPart = content.substring(1).trim();
            
            if (valPart) {
                // Inline value or start of object
                if (valPart.includes(': ')) {
                    // Object starting on same line: "- name: foo"
                    // Treat as block
                    // Adjust line to remove '- ' and parse as object block with same indent
                    const cleanLine = ' '.repeat(indent) + valPart;
                    // We need to gather lines belonging to this item
                    // look ahead
                    let blockLines = [cleanLine];
                    let j = i + 1;
                    while(j < lines.length) {
                        const nextIndent = lines[j].search(/\S/);
                        if (nextIndent > indent) {
                            blockLines.push(lines[j]);
                            j++;
                        } else {
                            break;
                        }
                    }
                    const parsed = parseLines(blockLines, indent).result;
                    arrayItems.push(parsed);
                    i = j;
                    continue;
                } else {
                    // Primitive value "- value"
                    arrayItems.push(parseValue(valPart));
                    i++;
                    continue;
                }
            } else {
                // Object block starts on next line? Or empty?
                // Not standard in our generator, skip complex case
                i++;
                continue;
            }
        }

        // Key-Value
        const colonIndex = content.indexOf(':');
        if (colonIndex !== -1) {
            const key = content.substring(0, colonIndex).trim().replace(/^"|"$/g, '');
            const valStr = content.substring(colonIndex + 1).trim();

            if (valStr) {
                result[key] = parseValue(valStr);
                i++;
            } else {
                // Nested Block
                // Gather children
                let blockLines: string[] = [];
                let j = i + 1;
                while (j < lines.length) {
                    const nextIndent = lines[j].search(/\S/);
                    if (nextIndent > indent) {
                        blockLines.push(lines[j]);
                        j++;
                    } else {
                        break;
                    }
                }
                
                // Determine child indent
                if (blockLines.length > 0) {
                    const childIndent = blockLines[0].search(/\S/);
                    const parsedChild = parseLines(blockLines, childIndent).result;
                    result[key] = parsedChild;
                } else {
                    result[key] = {};
                }
                i = j;
            }
        } else {
            // Malformed line?
            i++;
        }
    }

    return { result: isArray ? arrayItems : result, consumed: i };
};

const parseValue = (val: string): any => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (val === 'null') return null;
    if (!isNaN(Number(val)) && !val.includes('"') && !val.includes("'")) return Number(val);
    
    // Inline Array [a, b]
    if (val.startsWith('[') && val.endsWith(']')) {
        const inner = val.slice(1, -1);
        if (!inner.trim()) return [];
        return inner.split(',').map(s => parseValue(s.trim()));
    }

    // String cleanup
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        return val.slice(1, -1);
    }
    
    return val;
};
