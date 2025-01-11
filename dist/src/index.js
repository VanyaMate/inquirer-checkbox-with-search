import { createPrompt, useState, useKeypress, usePrefix, usePagination, useMemo, makeTheme, Separator, } from '@inquirer/core';
import colors from 'yoctocolors-cjs';
import figures from '@inquirer/figures';
const defaultCheckboxTheme = {
    icon: {
        checked: colors.green(figures.circleFilled),
        unchecked: figures.circle,
        cursor: figures.pointer,
    },
    style: {
        disabledChoice: (text) => colors.dim(`- ${text}`),
        renderSelectedChoices: (selectedChoices) => selectedChoices.map((choice) => choice.name ?? choice.value).join(', '),
        description: (text) => colors.cyan(text),
        highlight: (text) => colors.cyan(text),
        original: (text) => text,
    },
    helpMode: 'auto',
};
// Функция нормализации списка
const normalizeChoices = function (choices) {
    return choices.map((choice) => {
        if (Separator.isSeparator(choice))
            return choice;
        if (typeof choice === 'string') {
            return {
                value: choice,
                name: choice,
                checked: false,
            };
        }
        const name = choice.name ?? String(choice.value);
        return {
            value: choice.value,
            name: name,
            checked: choice.checked ?? false,
        };
    });
};
// Функция поиска по name и value
const filterItem = function (item, value) {
    if (Separator.isSeparator(item)) {
        return true;
    }
    const lowerCaseValue = value.toLowerCase();
    return !!item.name.toLowerCase().match(lowerCaseValue)
        || (typeof item.value === 'string'
            ? !!item.value.toLowerCase().match(lowerCaseValue)
            : false);
};
// typeguard для получения списка без сепараторов
const notSeparator = function (item) {
    return !Separator.isSeparator(item);
};
// Переключение элемента
const toggle = function (item) {
    if (!Separator.isSeparator(item)) {
        item.checked = !item.checked;
    }
    return item;
};
// Переключение элемента
const check = function (item) {
    if (!Separator.isSeparator(item)) {
        item.checked = true;
    }
    return item;
};
// Переключение элемента
const uncheck = function (item) {
    if (!Separator.isSeparator(item)) {
        item.checked = false;
    }
    return item;
};
// Проверка, что элемент выбран
const checked = function (item) {
    if (Separator.isSeparator(item)) {
        return false;
    }
    return item.checked;
};
// Возвращение значения
const value = function (item) {
    if (Separator.isSeparator(item)) {
        throw new Error(`Cant get a value from separator`);
    }
    return item.value;
};
// Функция для переключения элемента по индексу
const toggleByIndex = function (activeIndex) {
    return function (item, index) {
        if (index === activeIndex) {
            return toggle(item);
        }
        return item;
    };
};
// Функция получения нового индекса со смещением и бесконечной прокруткой
const getActiveIndex = function (currentIndex, delta, length) {
    return (currentIndex + delta + length) % length;
};
// Функция рендера элемента списка
const renderRow = function (props, theme, showActive) {
    // isActive - активен ли элемент (берется из usePagination автоматически)
    // item - элемент списка
    const { isActive, item } = props;
    // Если это сепаратор - то просто рендерим его
    if (Separator.isSeparator(item)) {
        return `${item.separator}`;
    }
    // Если элемент выбран - отмечаем, что выбран
    const rowCheckbox = item.checked ? theme.icon.checked
        : theme.icon.unchecked;
    // Если элемент активен и нужно это показать - выбираем функцию цвета
    const rowColor = (isActive && showActive) ? theme.style.highlight
        : theme.style.original;
    // Если элемент активен и нужно это показать - выбираем курсор
    const rowCursor = (isActive && showActive) ? theme.icon.cursor : ' ';
    return rowColor(`${rowCursor}${rowCheckbox} ${item.name ?? `[${item.value}]`}`);
};
export default createPrompt((config, done) => {
    const { message, pageSize = 7, loop = true, required = false, choices = [], theme = {}, } = config.checkbox;
    const { init = '' } = config.input;
    // Тема для чекбоксов
    const checkboxTheme = makeTheme(defaultCheckboxTheme, theme);
    // Тема для ввода
    const inputTheme = makeTheme();
    // Нормализованный список
    const [originalItems, setOriginalItems] = useState(normalizeChoices(choices));
    // Текущий поиск
    const [searchValue, setSearchValue] = useState(init);
    // Состояние активности поиска
    const [searchIsActive, setSearchIsActive] = useState(false);
    // Текущий элемент
    const [activeIndex, setActiveIndex] = useState(0);
    // Статус завершения выбора
    const [status, setStatus] = useState('idle');
    // Сообщение об ошибке
    const [errorMessage, setErrorMessage] = useState('');
    // Для иконки в начале
    const prefix = usePrefix({
        status, theme: checkboxTheme,
    });
    // Что покажется после переключения status на 'done'
    if (status === 'done') {
        const selectedItems = checkboxTheme.style.highlight(checkboxTheme.style.renderSelectedChoices(originalItems.filter(notSeparator).filter(checked), originalItems));
        // Префикс, сообщение и выбранные элементы
        return `${prefix} ${message}: ${selectedItems}`;
    }
    // При изменении оригинального списка со всеми элементами или поиска
    // - список отфильтруется и покажется новый
    const filteredItems = useMemo(() => {
        if (searchValue) {
            return originalItems.filter((item) => filterItem(item, searchValue));
        }
        else {
            return [...originalItems];
        }
    }, [originalItems, searchValue]);
    // Обработка ввода
    useKeypress(({ name, ctrl }, rl) => {
        // Если нажат CTRL
        if (ctrl) {
            // Если нажата клавиша "s"
            if (name === 's') {
                // Если поиск активен
                if (searchIsActive) {
                    // Выключить поиск
                    setSearchIsActive(false);
                    // Активный index в начало
                    setActiveIndex(0);
                }
                // Если поиск не активен
                else {
                    // Включить поиск
                    setSearchIsActive(true);
                    // Очистить текущее поле ввода
                    rl.clearLine(0);
                    // Установить поле ввода на текущий поиск
                    rl.write(searchValue);
                }
            }
        }
        // Если CTRL не нажат
        else {
            // Если поиск активен
            if (searchIsActive) {
                // Если нажата клавиша вниз
                if (name === 'down') {
                    // Выключить поиск
                    setSearchIsActive(false);
                    // Активный index в начало
                    setActiveIndex(0);
                }
                // Если нажата клавиша вверх
                else if (name === 'up') {
                    // Выключить поиск
                    setSearchIsActive(false);
                    // Активный index в конце
                    setActiveIndex(filteredItems.length - 1);
                }
                // Если нажата любая другая клавиша
                else {
                    // Записать текущий ввод в поиск
                    setSearchValue(rl.line);
                }
            }
            // Если не нажат CTRL и поиск не активен
            else {
                if (name === 'down') {
                    // Переключить вниз
                    setActiveIndex(getActiveIndex(activeIndex, 1, filteredItems.length));
                }
                else if (name === 'up') {
                    // Переключить вверх
                    setActiveIndex(getActiveIndex(activeIndex, -1, filteredItems.length));
                }
                else if (name === 'a') {
                    // Переключить все значения на выбранные
                    setOriginalItems(originalItems.map(check));
                }
                else if (name === 'i') {
                    // Переключить все значения на противиположные
                    setOriginalItems(originalItems.map(toggle));
                }
                else if (name === 'x') {
                    // Переключить все значения на не выбранные
                    setOriginalItems(originalItems.map(uncheck));
                }
                else if (name === 'space') {
                    // Переключить значение текущего элемента на
                    // противиположное
                    setOriginalItems(filteredItems.map(toggleByIndex(activeIndex)));
                }
                else if (name === 'return') {
                    // Если обязательно нужно что-то выбрать
                    if (required) {
                        const selectedItems = originalItems.filter(checked).map(value);
                        if (selectedItems.length > 0) {
                            // Завершить
                            // Установка статуса на done
                            setStatus('done');
                            // Вызов функции done со значениями выбранных
                            // элементов
                            done(originalItems.filter(checked).map(value));
                        }
                        else {
                            // Устанавливаем ошибку
                            setErrorMessage(checkboxTheme.style.error(`Select at least one item`));
                            return;
                        }
                    }
                    else {
                        // Завершить
                        // Установка статуса на done
                        setStatus('done');
                        // Вызов функции done со значениями выбранных
                        // элементов
                        done(originalItems.filter(checked).map(value));
                    }
                }
            }
        }
        // При любом вводе очищаем ошибку
        setErrorMessage('');
    });
    // Список
    const page = usePagination({
        items: filteredItems,
        pageSize: pageSize,
        active: activeIndex,
        loop: loop,
        renderItem: (props) => renderRow(props, checkboxTheme, !searchIsActive),
    });
    // Подсказки
    const helpRows = [
        `${checkboxTheme.style.key('space')} to select`,
        `${checkboxTheme.style.key('a')} to select all`,
        `${checkboxTheme.style.key('x')} to unselect all`,
        `${checkboxTheme.style.key('i')} to invert selection`,
        `and ${checkboxTheme.style.key('enter')} to proceed`,
    ];
    const _help = checkboxTheme.helpMode === 'always'
        ? `${checkboxTheme.style.help(`(Press ${helpRows.join(', ')})`)}\n`
        : '';
    const _message = inputTheme.style.message(message, 'idle');
    const _input = searchIsActive
        ? searchValue
            ? `[${searchValue}]`
            : inputTheme.style.help('[Search is empty]')
        : searchValue
            ? inputTheme.style.highlight(`[${searchValue}]`)
            : inputTheme.style.help('[Write]');
    const _errorMessage = errorMessage ? `\n${errorMessage}` : '';
    const _page = page ? page
        : inputTheme.style.help('Nothing found');
    // Как сделать так, чтобы курсор был в том месте, где я ввожу я -
    // так и не понял
    const _hideCursorSym = `\u001B[?25l`;
    return `${_help}${prefix} ${_message} ${_input}${_errorMessage}\n${_page}${_hideCursorSym}`;
});
