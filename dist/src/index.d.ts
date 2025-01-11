import { Separator, type Theme } from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';
type CheckboxTheme = {
    icon: {
        checked: string;
        unchecked: string;
        cursor: string;
    };
    style: {
        disabledChoice: (text: string) => string;
        renderSelectedChoices: <T>(selectedChoices: ReadonlyArray<NormalizedChoice<T>>, allChoices: ReadonlyArray<NormalizedChoice<T> | Separator>) => string;
        description: (text: string) => string;
        highlight: (text: string) => string;
        original: (text: string) => string;
    };
    helpMode: 'always' | 'never' | 'auto';
};
type Choice<Value> = {
    value: Value;
    name?: string;
    checked?: boolean;
};
type NormalizedChoice<Value> = {
    value: Value;
    name: string;
    checked: boolean;
};
type InputTheme = {
    validationFailureMode: 'keep' | 'clear';
};
declare const _default: <Value>(config: {
    checkbox: {
        message: string;
        pageSize?: number;
        choices: readonly (string | Separator)[] | readonly (Separator | Choice<Value>)[];
        loop?: boolean;
        required?: boolean;
        theme?: PartialDeep<Theme<CheckboxTheme>>;
    };
    input: {
        init?: string;
        theme?: PartialDeep<Theme<InputTheme>>;
    };
}, context?: import("@inquirer/type").Context) => Promise<Value[]> & {
    cancel: () => void;
};
export default _default;
